import type { Page } from "playwright";

export type Reference = {
  href: string;
  text?: string;
  ariaLabel?: string;
  title?: string;
  heading?: string;
};

export type ExtractResult = {
  url: string;
  sections: Record<string, string>;
  references?: Record<string, Reference[]>;
  section_errors?: Record<string, { message: string; url?: string }>;
  unknown_sections?: string[];
  job_ids?: string[];
  sidebar_profiles?: Record<string, string[]>;
};

type ExtractedPage = {
  text: string;
  references: Reference[];
  error?: { message: string; url?: string };
};

export const personSections = [
  "experience",
  "education",
  "interests",
  "honors",
  "languages",
  "certifications",
  "skills",
  "projects",
  "contact_info",
  "posts",
] as const;

export const companySections = ["posts", "jobs"] as const;

const personSectionPaths: Record<string, string> = {
  experience: "details/experience/",
  education: "details/education/",
  interests: "details/interests/",
  honors: "details/honors/",
  languages: "details/languages/",
  certifications: "details/certifications/",
  skills: "details/skills/",
  projects: "details/projects/",
  contact_info: "overlay/contact-info/",
  posts: "recent-activity/all/",
};

const datePostedMap: Record<string, string> = {
  past_hour: "r3600",
  past_24_hours: "r86400",
  past_week: "r604800",
  past_month: "r2592000",
};

const jobTypeMap: Record<string, string> = {
  full_time: "F",
  part_time: "P",
  contract: "C",
  temporary: "T",
  volunteer: "V",
  internship: "I",
  other: "O",
};

const experienceLevelMap: Record<string, string> = {
  internship: "1",
  entry: "2",
  associate: "3",
  mid_senior: "4",
  director: "5",
  executive: "6",
};

const workTypeMap: Record<string, string> = {
  on_site: "1",
  remote: "2",
  hybrid: "3",
};

const sortByMap: Record<string, string> = {
  date: "DD",
  relevance: "R",
};

const parseSections = (
  value: string | undefined,
  allowed: readonly string[],
) => {
  const requested = (value ?? "")
    .split(",")
    .map((section) => section.trim())
    .filter(Boolean);
  const known = requested.filter((section) => allowed.includes(section));
  const unknown = requested.filter((section) => !allowed.includes(section));
  return { known, unknown };
};

const normalizeCsv = (
  value: string | undefined,
  map: Record<string, string>,
) => {
  if (!value) return undefined;
  return value
    .split(",")
    .map((part) => map[part.trim()] ?? part.trim())
    .filter(Boolean)
    .join(",");
};

const cleanText = (value: string) => {
  const lines = value
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const noise = [
    /^About$/,
    /^Accessibility$/,
    /^Privacy & Terms$/,
    /^Ad Choices$/,
    /^Advertising$/,
    /^Business Services$/,
    /^Get the LinkedIn app$/,
  ];
  return lines
    .filter((line) => !noise.some((pattern) => pattern.test(line)))
    .join("\n");
};

const isAuthBarrier = (url: string, text: string) =>
  /\/login|checkpoint|authwall|signup/i.test(url) ||
  /\b(Sign in|Join now|Welcome to your professional community)\b/i.test(text);

const isRateLimited = (text: string) =>
  /temporarily restricted|unusual activity|request limit|try again later/i.test(
    text,
  );

export const checkSession = async (page: Page) => {
  await page.goto("https://www.linkedin.com/feed/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  const text = await page
    .locator("body")
    .innerText({ timeout: 5_000 })
    .catch(() => "");
  return {
    authenticated: !isAuthBarrier(page.url(), text),
    url: page.url(),
    headless: process.env.HEADLESS ?? "true",
  };
};

export const assertAuthenticated = async (page: Page) => {
  const session = await checkSession(page);
  if (!session.authenticated) {
    throw new Error(
      "LinkedIn session is not authenticated. Run `bun run login` in linkedin-mcp, sign in, then retry.",
    );
  }
};

const handleModalClose = async (page: Page) => {
  await page.keyboard.press("Escape").catch(() => undefined);
  await page
    .locator('button[aria-label*="Dismiss"], button[aria-label*="Close"]')
    .first()
    .click({ timeout: 1_000 })
    .catch(() => undefined);
};

const scrollToBottom = async (page: Page, iterations: number) => {
  let previousHeight = 0;
  for (let index = 0; index < iterations; index += 1) {
    const height = await page
      .evaluate(() => document.body.scrollHeight)
      .catch(() => 0);
    if (height <= previousHeight) break;
    previousHeight = height;
    await page
      .evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      .catch(() => undefined);
    await page.waitForTimeout(800);
  }
};

const clickShowMore = async (page: Page, iterations: number) => {
  for (let index = 0; index < iterations; index += 1) {
    const clicked = await page
      .locator(
        'button[aria-expanded="false"], button:has-text("Show more"), button:has-text("See more")',
      )
      .last()
      .click({ timeout: 1_000 })
      .then(() => true)
      .catch(() => false);
    if (!clicked) break;
    await page.waitForTimeout(500);
  }
};

export const extractCurrentPage = async (
  page: Page,
  section: string,
  maxScrolls = 3,
): Promise<ExtractedPage> => {
  await page
    .waitForSelector("body", { timeout: 15_000 })
    .catch(() => undefined);
  await handleModalClose(page);
  if (
    section === "posts" ||
    section === "jobs" ||
    section === "search_results"
  ) {
    await scrollToBottom(page, maxScrolls);
  } else {
    await clickShowMore(page, maxScrolls);
  }

  const extracted = await page.evaluate(() => {
    const normalize = (value: string | null | undefined) =>
      (value ?? "").replace(/\s+/g, " ").trim();
    const root = document.querySelector("main") ?? document.body;
    const text = (root as HTMLElement | undefined)?.innerText ?? "";
    const references = Array.from(root?.querySelectorAll("a[href]") ?? [])
      .slice(0, 500)
      .map((anchor) => ({
        href: (anchor as HTMLAnchorElement).href,
        text: normalize((anchor as HTMLElement).innerText),
        ariaLabel: normalize(anchor.getAttribute("aria-label")),
        title: normalize(anchor.getAttribute("title")),
        heading: normalize(
          anchor.closest("section, article, li, div")?.querySelector("h1,h2,h3")
            ?.textContent,
        ),
      }))
      .filter((reference) => reference.href && reference.href !== "#");
    return { text, references };
  });

  const text = cleanText(extracted.text);
  if (isAuthBarrier(page.url(), text)) {
    return {
      text: "",
      references: [],
      error: { message: "LinkedIn authentication required", url: page.url() },
    };
  }
  if (isRateLimited(text)) {
    return {
      text: "[Rate limited] LinkedIn blocked this section. Try again later or request fewer sections.",
      references: [],
      error: { message: "LinkedIn rate limited this page", url: page.url() },
    };
  }
  return { text, references: dedupeReferences(extracted.references) };
};

const dedupeReferences = (references: Reference[]) => {
  const seen = new Set<string>();
  return references.filter((reference) => {
    const key = `${reference.href}|${reference.text ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const extractPage = async (
  page: Page,
  url: string,
  section: string,
  maxScrolls?: number,
): Promise<ExtractedPage> => {
  await assertAuthenticated(page);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  return extractCurrentPage(page, section, maxScrolls);
};

const addSection = (
  result: ExtractResult,
  name: string,
  extracted: ExtractedPage,
) => {
  if (extracted.text) result.sections[name] = extracted.text;
  if (extracted.references.length > 0) {
    result.references ??= {};
    result.references[name] = extracted.references;
  }
  if (extracted.error) {
    result.section_errors ??= {};
    result.section_errors[name] = extracted.error;
  }
};

export const scrapePerson = async (
  page: Page,
  linkedinUsername: string,
  sections?: string,
  maxScrolls?: number,
) => {
  const profile = linkedinUsername
    .replace(/^https?:\/\/(?:www\.)?linkedin\.com\/in\//, "")
    .replace(/^\/|\/$/g, "");
  const baseUrl = `https://www.linkedin.com/in/${profile}/`;
  const result: ExtractResult = { url: baseUrl, sections: {} };
  const parsed = parseSections(sections, personSections);

  addSection(
    result,
    "main",
    await extractPage(page, baseUrl, "main", maxScrolls ?? 3),
  );
  for (const section of parsed.known) {
    const url = `${baseUrl}${personSectionPaths[section]}`;
    addSection(
      result,
      section,
      await extractPage(
        page,
        url,
        section,
        maxScrolls ?? (section === "posts" ? 10 : 5),
      ),
    );
  }
  if (parsed.unknown.length > 0) result.unknown_sections = parsed.unknown;
  return result;
};

export const scrapeCompany = async (
  page: Page,
  companyName: string,
  sections?: string,
) => {
  const company = companyName
    .replace(/^https?:\/\/(?:www\.)?linkedin\.com\/company\//, "")
    .replace(/^\/|\/$/g, "");
  const baseUrl = `https://www.linkedin.com/company/${company}/`;
  const result: ExtractResult = { url: baseUrl, sections: {} };
  const parsed = parseSections(sections, companySections);

  addSection(result, "about", await extractPage(page, baseUrl, "about", 3));
  for (const section of parsed.known) {
    addSection(
      result,
      section,
      await extractPage(page, `${baseUrl}${section}/`, section, 5),
    );
  }
  if (parsed.unknown.length > 0) result.unknown_sections = parsed.unknown;
  return result;
};

export const scrapeJob = async (page: Page, jobId: string) => {
  const url = `https://www.linkedin.com/jobs/view/${jobId}/`;
  const extracted = await extractPage(page, url, "job", 5);
  const result: ExtractResult = { url, sections: {} };
  addSection(result, "job", extracted);
  return result;
};

export const searchPeople = async (
  page: Page,
  keywords: string,
  location?: string,
) => {
  const params = new URLSearchParams({ keywords });
  if (location) params.set("location", location);
  const url = `https://www.linkedin.com/search/results/people/?${params}`;
  const extracted = await extractPage(page, url, "search_results", 5);
  const result: ExtractResult = { url, sections: {} };
  addSection(result, "search_results", extracted);
  return result;
};

export type JobSearchOptions = {
  location?: string;
  max_pages?: number;
  date_posted?: string;
  job_type?: string;
  experience_level?: string;
  work_type?: string;
  easy_apply?: boolean;
  sort_by?: string;
};

export const searchJobs = async (
  page: Page,
  keywords: string,
  options: JobSearchOptions = {},
) => {
  const params = new URLSearchParams({ keywords });
  if (options.location) params.set("location", options.location);
  const datePosted = normalizeCsv(options.date_posted, datePostedMap);
  const jobType = normalizeCsv(options.job_type, jobTypeMap);
  const experienceLevel = normalizeCsv(
    options.experience_level,
    experienceLevelMap,
  );
  const workType = normalizeCsv(options.work_type, workTypeMap);
  const sortBy = options.sort_by
    ? (sortByMap[options.sort_by] ?? options.sort_by)
    : undefined;
  if (datePosted) params.set("f_TPR", datePosted);
  if (jobType) params.set("f_JT", jobType);
  if (experienceLevel) params.set("f_E", experienceLevel);
  if (workType) params.set("f_WT", workType);
  if (options.easy_apply) params.set("f_EA", "true");
  if (sortBy) params.set("sortBy", sortBy);

  const maxPages = Math.min(Math.max(options.max_pages ?? 3, 1), 10);
  const result: ExtractResult = {
    url: `https://www.linkedin.com/jobs/search/?${params}`,
    sections: {},
    job_ids: [],
  };

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const pageParams = new URLSearchParams(params);
    if (pageIndex > 0) pageParams.set("start", String(pageIndex * 25));
    const url = `https://www.linkedin.com/jobs/search/?${pageParams}`;
    const extracted = await extractPage(
      page,
      url,
      `search_results_page_${pageIndex + 1}`,
      5,
    );
    addSection(result, `search_results_page_${pageIndex + 1}`, extracted);
  }

  const ids = new Set<string>();
  Object.values(result.references ?? {})
    .flat()
    .forEach((reference) => {
      const id =
        reference.href.match(/\/jobs\/view\/(\d+)/)?.[1] ??
        reference.href.match(/currentJobId=(\d+)/)?.[1];
      if (id) ids.add(id);
    });
  result.job_ids = [...ids];
  return result;
};

export const getSidebarProfiles = async (
  page: Page,
  linkedinUsername: string,
) => {
  const profile = linkedinUsername.replace(/^\/|\/$/g, "");
  const url = `https://www.linkedin.com/in/${profile}/`;
  await extractPage(page, url, "main", 2);
  const sidebarProfiles = await page.evaluate(() => {
    const buckets: Record<string, string[]> = {};
    const roots = Array.from(
      document.querySelectorAll("aside section, aside, main"),
    );
    for (const root of roots) {
      const heading =
        root.querySelector("h2,h3")?.textContent?.trim() || "profiles";
      const key =
        heading
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "") || "profiles";
      const paths = Array.from(root.querySelectorAll('a[href*="/in/"]'))
        .map((anchor) => new URL((anchor as HTMLAnchorElement).href).pathname)
        .filter((path) => /^\/in\/[^/]+\/?$/.test(path));
      if (paths.length > 0) buckets[key] = [...new Set(paths)];
    }
    return buckets;
  });
  return { url, sections: {}, sidebar_profiles: sidebarProfiles };
};

export const getInbox = async (page: Page, limit: number) => {
  const url = "https://www.linkedin.com/messaging/";
  const extracted = await extractPage(
    page,
    url,
    "inbox",
    Math.ceil(limit / 10),
  );
  const result: ExtractResult = { url, sections: {} };
  addSection(result, "inbox", extracted);
  return result;
};

export const getConversation = async (
  page: Page,
  args: { linkedin_username?: string; thread_id?: string; index?: number },
) => {
  let url = args.thread_id
    ? `https://www.linkedin.com/messaging/thread/${args.thread_id}/`
    : `https://www.linkedin.com/messaging/?searchTerm=${encodeURIComponent(args.linkedin_username ?? "")}`;
  await assertAuthenticated(page);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);

  if (!args.thread_id) {
    const row = page.locator('[role="listitem"], li').nth(args.index ?? 0);
    await row.click({ timeout: 5_000 }).catch(() => undefined);
    await page.waitForTimeout(1_000);
    url = page.url();
  }

  const extracted = await extractCurrentPage(page, "conversation", 3);
  const result: ExtractResult = { url, sections: {} };
  addSection(result, "conversation", extracted);
  return result;
};

export const searchConversations = async (
  page: Page,
  keywords: string,
  limit: number,
) => {
  const url = `https://www.linkedin.com/messaging/?searchTerm=${encodeURIComponent(keywords)}`;
  const extracted = await extractPage(
    page,
    url,
    "search_results",
    Math.ceil(limit / 10),
  );
  const result: ExtractResult = { url, sections: {} };
  addSection(result, "search_results", extracted);
  return result;
};

export const sendMessage = async (
  page: Page,
  linkedinUsername: string,
  message: string,
  confirmSend: boolean,
  profileUrn?: string,
) => {
  const profileUrl = `https://www.linkedin.com/in/${linkedinUsername.replace(/^\/|\/$/g, "")}/`;
  let composeUrl = "";
  if (profileUrn) {
    const encoded = encodeURIComponent(`urn:li:fsd_profile:${profileUrn}`);
    composeUrl = `https://www.linkedin.com/messaging/compose/?profileUrn=${encoded}&recipient=${profileUrn}&screenContext=NON_SELF_PROFILE_VIEW&interop=msgOverlay`;
  } else {
    await extractPage(page, profileUrl, "main", 2);
    composeUrl =
      (await page
        .locator('main a[href*="/messaging/compose/"]')
        .first()
        .getAttribute("href")
        .catch(() => null)) ?? "";
    if (composeUrl.startsWith("/"))
      composeUrl = new URL(composeUrl, "https://www.linkedin.com").href;
  }
  if (!composeUrl) {
    return {
      url: profileUrl,
      status: "message_unavailable",
      message: "LinkedIn did not expose a Message action.",
      sent: false,
    };
  }

  await page.goto(composeUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1_500);
  const textbox = page
    .locator(
      'div[role="textbox"][contenteditable="true"], [contenteditable="true"][aria-label*="message"]',
    )
    .first();
  const canCompose = await textbox
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
  if (!canCompose) {
    return {
      url: page.url(),
      status: "composer_unavailable",
      message: "LinkedIn did not expose a usable message composer.",
      sent: false,
    };
  }
  if (!confirmSend) {
    await page.keyboard.press("Escape").catch(() => undefined);
    return {
      url: page.url(),
      status: "confirmation_required",
      message: "Set confirm_send=true to send the message.",
      sent: false,
    };
  }
  await textbox.click();
  await page.keyboard.type(message, { delay: 15 });
  await page.waitForTimeout(500);
  const clicked = await page
    .locator(
      'button[type="submit"]:not([disabled]), button[aria-label*="Send"]:not([disabled])',
    )
    .last()
    .click({ timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (!clicked) await page.keyboard.press("Enter").catch(() => undefined);
  return {
    url: page.url(),
    status: "sent",
    message: "Message sent.",
    sent: true,
  };
};

export const connectWithPerson = async (
  page: Page,
  linkedinUsername: string,
  note?: string,
) => {
  const profile = linkedinUsername.replace(/^\/|\/$/g, "");
  const url = `https://www.linkedin.com/in/${profile}/`;
  await extractPage(page, url, "main", 2);
  const inviteHref = await page
    .locator(`a[href*="/preload/custom-invite/?vanityName=${profile}"]`)
    .first()
    .getAttribute("href")
    .catch(() => null);
  if (inviteHref) {
    await page.goto(new URL(inviteHref, "https://www.linkedin.com").href, {
      waitUntil: "domcontentloaded",
    });
  } else {
    const clicked = await page
      .locator(
        'main button:has-text("Connect"), main button:has-text("Accept")',
      )
      .first()
      .click({ timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (!clicked)
      return {
        url,
        status: "connect_unavailable",
        message: "LinkedIn did not expose a Connect action.",
        note_sent: false,
      };
  }
  await page.waitForTimeout(1_000);
  if (note) {
    const addNoteClicked = await page
      .locator('button:has-text("Add a note")')
      .click({ timeout: 2_000 })
      .then(() => true)
      .catch(() => false);
    if (addNoteClicked)
      await page
        .locator("textarea")
        .first()
        .fill(note)
        .catch(() => undefined);
  }
  const sent = await page
    .locator('button:has-text("Send"), button:has-text("Accept")')
    .last()
    .click({ timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  return {
    url: page.url(),
    status: sent ? "pending" : "send_failed",
    message: sent
      ? "Connection request sent or invitation accepted."
      : "Could not complete LinkedIn connection flow.",
    note_sent: Boolean(note && sent),
  };
};

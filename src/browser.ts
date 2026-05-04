import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { type BrowserContext, chromium, type Page } from "playwright";
import { config, viewport } from "./config";

let context: BrowserContext | undefined;
let page: Page | undefined;
let queue: Promise<unknown> = Promise.resolve();

const launchContext = async () => {
  await mkdir(dirname(config.userDataDir), { recursive: true });

  context = await chromium.launchPersistentContext(config.userDataDir, {
    headless: config.headless,
    executablePath: config.chromePath,
    slowMo: config.slowMo,
    viewport,
    userAgent: config.userAgent,
    acceptDownloads: false,
  });
  context.setDefaultTimeout(config.timeout);
  context.setDefaultNavigationTimeout(config.timeout);
  page = context.pages()[0] ?? (await context.newPage());
  return page;
};

export const getPage = async () => {
  if (page && !page.isClosed()) return page;
  if (context) await context.close().catch(() => undefined);
  return launchContext();
};

export const closeBrowser = async () => {
  await context?.close().catch(() => undefined);
  context = undefined;
  page = undefined;
};

export const withLinkedInPage = async <T>(
  handler: (page: Page) => Promise<T>,
) => {
  const run = queue.then(async () => handler(await getPage()));
  queue = run.catch(() => undefined);
  return run;
};

export const toMcpResult = <T>(structuredContent: T) => ({
  content: [
    {
      type: "text" as const,
      text: JSON.stringify(structuredContent, null, 2),
    },
  ],
  structuredContent,
});

export const withLinkedInTool = async <T>(
  handler: (page: Page) => Promise<T>,
) => toMcpResult(await withLinkedInPage(handler));

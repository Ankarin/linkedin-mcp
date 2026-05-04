import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { scrapePerson } from "../linkedin";

export const schema = {
  linkedin_username: z
    .string()
    .describe('LinkedIn username, e.g. "stickerdaniel" or "williamhgates"'),
  sections: z
    .string()
    .optional()
    .describe(
      "Comma-separated extra sections: experience, education, interests, honors, languages, certifications, skills, projects, contact_info, posts",
    ),
  max_scrolls: z.number().int().min(1).max(50).optional(),
};

export const metadata = {
  name: "get_person_profile",
  description:
    "Get a specific person's LinkedIn profile as raw section text and references.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function getPersonProfile(
  args: InferSchema<typeof schema>,
) {
  return withLinkedInTool((page) =>
    scrapePerson(page, args.linkedin_username, args.sections, args.max_scrolls),
  );
}

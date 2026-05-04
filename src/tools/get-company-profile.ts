import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { scrapeCompany } from "../linkedin";

export const schema = {
  company_name: z
    .string()
    .describe('LinkedIn company slug, e.g. "docker", "anthropic", "microsoft"'),
  sections: z
    .string()
    .optional()
    .describe("Comma-separated extra sections: posts, jobs"),
};

export const metadata = {
  name: "get_company_profile",
  description:
    "Get a LinkedIn company profile as raw section text and references.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function getCompanyProfile(
  args: InferSchema<typeof schema>,
) {
  return withLinkedInTool((page) =>
    scrapeCompany(page, args.company_name, args.sections),
  );
}

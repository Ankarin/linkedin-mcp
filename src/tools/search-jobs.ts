import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { searchJobs } from "../linkedin";

export const schema = {
  keywords: z.string().describe('Search keywords, e.g. "software engineer"'),
  location: z.string().optional(),
  max_pages: z.number().int().min(1).max(10).default(3),
  date_posted: z
    .string()
    .optional()
    .describe("past_hour, past_24_hours, past_week, or past_month"),
  job_type: z
    .string()
    .optional()
    .describe(
      "Comma-separated: full_time, part_time, contract, temporary, volunteer, internship, other",
    ),
  experience_level: z
    .string()
    .optional()
    .describe(
      "Comma-separated: internship, entry, associate, mid_senior, director, executive",
    ),
  work_type: z
    .string()
    .optional()
    .describe("Comma-separated: on_site, remote, hybrid"),
  easy_apply: z.boolean().default(false),
  sort_by: z.string().optional().describe("date or relevance"),
};

export const metadata = {
  name: "search_jobs",
  description:
    "Search LinkedIn jobs and return raw result text plus job_ids for get_job_details.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function searchJobsTool(args: InferSchema<typeof schema>) {
  return withLinkedInTool((page) => searchJobs(page, args.keywords, args));
}

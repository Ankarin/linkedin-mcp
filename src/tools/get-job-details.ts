import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { scrapeJob } from "../linkedin";

export const schema = {
  job_id: z.string().describe('LinkedIn job ID, e.g. "4252026496"'),
};

export const metadata = {
  name: "get_job_details",
  description: "Get details for a specific LinkedIn job posting.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function getJobDetails(args: InferSchema<typeof schema>) {
  return withLinkedInTool((page) => scrapeJob(page, args.job_id));
}

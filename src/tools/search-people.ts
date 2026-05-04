import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { searchPeople } from "../linkedin";

export const schema = {
  keywords: z.string().describe('Search keywords, e.g. "software engineer"'),
  location: z
    .string()
    .optional()
    .describe('Optional location filter, e.g. "New York"'),
};

export const metadata = {
  name: "search_people",
  description:
    "Search LinkedIn people and return raw result text plus profile references.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function searchPeopleTool(
  args: InferSchema<typeof schema>,
) {
  return withLinkedInTool((page) =>
    searchPeople(page, args.keywords, args.location),
  );
}

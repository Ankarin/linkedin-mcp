import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { searchConversations } from "../linkedin";

export const schema = {
  keywords: z.string().describe("Message search keywords"),
  limit: z.number().int().min(1).max(50).default(20),
};

export const metadata = {
  name: "search_conversations",
  description: "Search LinkedIn message conversations by keyword.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function searchConversationsTool(
  args: InferSchema<typeof schema>,
) {
  return withLinkedInTool((page) =>
    searchConversations(page, args.keywords, args.limit),
  );
}

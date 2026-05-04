import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { getConversation } from "../linkedin";

export const schema = {
  linkedin_username: z
    .string()
    .optional()
    .describe("LinkedIn username of the conversation participant"),
  thread_id: z.string().optional().describe("LinkedIn messaging thread ID"),
  index: z.number().int().min(0).default(0),
};

export const metadata = {
  name: "get_conversation",
  description:
    "Read a specific LinkedIn messaging conversation by username or thread_id.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function getConversationTool(
  args: InferSchema<typeof schema>,
) {
  if (!args.linkedin_username && !args.thread_id) {
    throw new Error("Provide at least one of linkedin_username or thread_id.");
  }
  return withLinkedInTool((page) => getConversation(page, args));
}

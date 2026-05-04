import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { getInbox } from "../linkedin";

export const schema = {
  limit: z.number().int().min(1).max(50).default(20),
};

export const metadata = {
  name: "get_inbox",
  description: "List recent conversations from the LinkedIn messaging inbox.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function getInboxTool(args: InferSchema<typeof schema>) {
  return withLinkedInTool((page) => getInbox(page, args.limit));
}

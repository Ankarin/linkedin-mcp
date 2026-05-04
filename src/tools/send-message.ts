import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { sendMessage } from "../linkedin";

export const schema = {
  linkedin_username: z.string().describe("LinkedIn username of the recipient"),
  message: z.string().min(1).describe("Message text to send"),
  confirm_send: z
    .boolean()
    .describe("Must be true to actually send the message"),
  profile_urn: z
    .string()
    .optional()
    .describe("Optional LinkedIn profile URN, e.g. ACoAAB..."),
};

export const metadata = {
  name: "send_message",
  description:
    "Send a LinkedIn message. Requires confirm_send=true; otherwise performs a dry run.",
  annotations: { destructiveHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function sendMessageTool(
  args: InferSchema<typeof schema>,
) {
  return withLinkedInTool((page) =>
    sendMessage(
      page,
      args.linkedin_username,
      args.message,
      args.confirm_send,
      args.profile_urn,
    ),
  );
}

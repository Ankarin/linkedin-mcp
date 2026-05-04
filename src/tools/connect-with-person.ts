import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { connectWithPerson } from "../linkedin";

export const schema = {
  linkedin_username: z.string().describe("LinkedIn username to connect with"),
  note: z.string().optional().describe("Optional invitation note"),
};

export const metadata = {
  name: "connect_with_person",
  description: "Send a LinkedIn connection request or accept an incoming one.",
  annotations: { destructiveHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function connectWithPersonTool(
  args: InferSchema<typeof schema>,
) {
  return withLinkedInTool((page) =>
    connectWithPerson(page, args.linkedin_username, args.note),
  );
}

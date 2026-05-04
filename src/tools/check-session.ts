import type { ToolMetadata } from "xmcp";
import { withLinkedInTool } from "../browser";
import { checkSession } from "../linkedin";

export const schema = {};

export const metadata = {
  name: "check_session",
  description:
    "Check whether the persistent LinkedIn browser profile is authenticated.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function checkLinkedInSession() {
  return withLinkedInTool((page) => checkSession(page));
}

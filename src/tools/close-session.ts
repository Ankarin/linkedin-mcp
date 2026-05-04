import type { ToolMetadata } from "xmcp";
import { closeBrowser, toMcpResult } from "../browser";

export const schema = {};

export const metadata = {
  name: "close_session",
  description: "Close the shared LinkedIn browser session.",
  annotations: { destructiveHint: true, openWorldHint: false },
} as ToolMetadata;

export default async function closeSession() {
  await closeBrowser();
  return toMcpResult({ status: "closed" });
}

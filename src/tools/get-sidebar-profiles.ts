import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { getSidebarProfiles } from "../linkedin";

export const schema = {
  linkedin_username: z
    .string()
    .describe(
      "LinkedIn username whose sidebar recommendations should be extracted",
    ),
};

export const metadata = {
  name: "get_sidebar_profiles",
  description:
    "Extract LinkedIn profile links from sidebar recommendation sections.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function getSidebarProfilesTool(
  args: InferSchema<typeof schema>,
) {
  return withLinkedInTool((page) =>
    getSidebarProfiles(page, args.linkedin_username),
  );
}

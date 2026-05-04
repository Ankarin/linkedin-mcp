import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { withLinkedInTool } from "../browser";
import { type ExtractResult, extractPage } from "../linkedin";

export const schema = {
  company_name: z.string().describe("LinkedIn company slug"),
};

export const metadata = {
  name: "get_company_posts",
  description: "Get recent posts from a LinkedIn company feed.",
  annotations: { readOnlyHint: true, openWorldHint: true },
} as ToolMetadata;

export default async function getCompanyPosts(
  args: InferSchema<typeof schema>,
) {
  return withLinkedInTool(async (page) => {
    const company = args.company_name.replace(/^\/|\/$/g, "");
    const url = `https://www.linkedin.com/company/${company}/posts/`;
    const extracted = await extractPage(page, url, "posts", 5);
    const result: ExtractResult = { url, sections: {} };
    if (extracted.text) result.sections.posts = extracted.text;
    if (extracted.references.length > 0)
      result.references = { posts: extracted.references };
    if (extracted.error) result.section_errors = { posts: extracted.error };
    return result;
  });
}

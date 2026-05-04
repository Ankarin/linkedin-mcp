import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { closeBrowser, getPage } from "./browser";

const page = await getPage();
await page.goto("https://www.linkedin.com/login", {
  waitUntil: "domcontentloaded",
});
const readline = createInterface({ input, output });

await readline.question(
  "LinkedIn login browser opened. Sign in, then press Enter here to close.",
);
readline.close();

await closeBrowser();

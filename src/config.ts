import { homedir } from "node:os";
import { join } from "node:path";

const booleanFromEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const numberFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  userDataDir:
    process.env.USER_DATA_DIR ?? join(homedir(), ".linkedin-mcp", "profile"),
  headless: booleanFromEnv(process.env.HEADLESS, true),
  slowMo: numberFromEnv(process.env.SLOW_MO, 0),
  timeout: numberFromEnv(process.env.TIMEOUT, 30_000),
  toolTimeout: numberFromEnv(process.env.TOOL_TIMEOUT, 120_000),
  chromePath: process.env.CHROME_PATH,
  userAgent: process.env.USER_AGENT,
  viewport: process.env.VIEWPORT ?? "1440x1000",
};

export const viewport = (() => {
  const [width, height] = config.viewport.split("x").map(Number);
  return {
    width: Number.isFinite(width) ? width : 1440,
    height: Number.isFinite(height) ? height : 1000,
  };
})();

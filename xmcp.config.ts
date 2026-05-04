import type { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  paths: {
    tools: "src/tools",
    prompts: false,
    resources: false,
  },
  stdio: {
    silent: true,
  },
  http: {
    host: process.env.HOST ?? "127.0.0.1",
    port: Number(process.env.PORT ?? 3001),
    endpoint: process.env.HTTP_PATH ?? "/mcp",
  },
  bundler: (rspackConfig) => {
    const existingExternals = rspackConfig.externals
      ? Array.isArray(rspackConfig.externals)
        ? rspackConfig.externals
        : [rspackConfig.externals]
      : [];

    return {
      ...rspackConfig,
      externals: [
        ...existingExternals,
        {
          playwright: "commonjs playwright",
          "playwright-core": "commonjs playwright-core",
        },
      ],
    };
  },
  template: {
    name: "LinkedIn MCP",
    description:
      "Browser-backed LinkedIn MCP server for profiles, companies, jobs, and messages.",
    instructions:
      "Run `bun run login` first with a visible browser, then use read tools before write tools. Send-message requires confirm_send=true.",
  },
};

export default config;

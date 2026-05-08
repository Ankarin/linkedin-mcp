# LinkedIn MCP Server

A Model Context Protocol (MCP) server for LinkedIn automation and scraping. Built using [xmcp](https://github.com/basementstudio/xmcp), Playwright, and Bun.

## Features
- Automates LinkedIn interactions via Playwright.
- Exposes LinkedIn capabilities to AI agents via the MCP protocol.

## Setup & Installation

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run the interactive login script to authenticate your LinkedIn account (saves session state):
   ```bash
   bun run login
   ```
   *(This opens a non-headless browser window where you can log in to LinkedIn.)*

## Usage

Start the MCP server in development mode:
```bash
bun run dev
```

Build for production:
```bash
bun run build
```

## Stack
- TypeScript
- Playwright
- [xmcp](https://github.com/basementstudio/xmcp) (MCP framework)
- Zod
- Bun

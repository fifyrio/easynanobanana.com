# @easynanobanana.com/cli

Generate AI images and faceless-video assets from your agent (Claude Code, Codex, Cursor) or the terminal. Backed by [Easy Nano Banana](https://www.easynanobanana.com).

## Install

```bash
npm install -g @easynanobanana.com/cli
```

## Authenticate

Get an API key at https://www.easynanobanana.com/settings/api-keys, then:

```bash
easynanobanana auth login
# or non-interactively:
easynanobanana auth login --key enb_live_xxx
```

The key is stored at `~/.easynanobanana/config.json` (mode 0600). It shares your account's credit balance.

## Use from the terminal

```bash
easynanobanana generate "a cinematic banana in space" --ratio 16:9
easynanobanana credits
```

## Plug into an agent (MCP)

The CLI is also an MCP server over stdio. Add it once and your agent gets `generate_image` and `get_credits` tools.

**Claude Code:**

```bash
claude mcp add easynanobanana -- easynanobanana mcp
```

Then just ask: *"Generate an image with Easy Nano Banana."*

**Any MCP client** — configure a stdio server:

```json
{
  "mcpServers": {
    "easynanobanana": { "command": "easynanobanana", "args": ["mcp"] }
  }
}
```

## Config / overrides

| Env var | Purpose |
|---|---|
| `EASYNANOBANANA_API_KEY` | Override the stored key |
| `EASYNANOBANANA_API_URL` | Point at a different base URL (e.g. `http://localhost:3210`) |

## Commands

| Command | Description |
|---|---|
| `auth login [--key K] [--url U]` | Save + verify an API key |
| `auth status` | Show masked key, URL, and credit balance |
| `generate "<prompt>" [--ratio 1:1\|9:16\|16:9]` | Generate one image, print the URL |
| `credits` | Print remaining credits |
| `mcp` | Run as an MCP stdio server |

## License

MIT

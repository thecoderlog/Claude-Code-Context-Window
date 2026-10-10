# Context windows in Claude Code: demo

The demo from the video: a small React app (the whole team, 300 people) and a relay that shows what Claude Code sends to the model on every turn.

- `relay/relay.mjs`: sits between Claude Code and the API. It logs every request body to `relay/requests.jsonl`, plus the token counts the API sends back for it (input, cache read, cache write, output), so you can watch each request carry the one before it.
- `CLAUDE.md`: the house rules. Claude Code puts them into every request.
- `.claude/skills/add-user-field/SKILL.md`: a skill. Only its name and description are in the request until the model uses it.
- `.claude/settings.json` + `hooks/protect-files.mjs`: last video's hook (blocks any change to `.env`).
- `scripts/seed-users.mjs`: writes `api/users.json` (`npm run seed`; `npm run seed -- 50` for another size).

```sh
npm install
cp .env.example .env
npm test

# Watch the wire
node relay/relay.mjs
ENABLE_TOOL_SEARCH=true ANTHROPIC_BASE_URL=http://localhost:8787 claude     # in a second terminal
```

`ENABLE_TOOL_SEARCH=true` keeps the session the same as without the relay. Claude Code turns tool search off whenever `ANTHROPIC_BASE_URL` points somewhere other than Anthropic, and then sends every tool definition upfront (in this demo, `/context` goes from 13.6k to 23.8k tokens before you type). The relay passes every request through unchanged, so tool search works through it; behind another proxy, check that it forwards `tool_reference` blocks before you set this.

In Claude Code, type `/context` to see what's in the window, `/compact` to summarize the session so far, and `/clear` to start fresh.

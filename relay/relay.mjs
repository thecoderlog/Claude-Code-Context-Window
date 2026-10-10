// relay.mjs: sits between Claude Code and the Anthropic API. Passes every request through unchanged,
// and logs two lines per request to relay/requests.jsonl:
//   { id, t, url, body }        the request, exactly what the model gets
//   { id, t, url, usage, ... }  the token counts the API sent back for it (input, cache read, cache write, output)
//   node relay/relay.mjs
//   ENABLE_TOOL_SEARCH=true ANTHROPIC_BASE_URL=http://localhost:8787 claude
// (ENABLE_TOOL_SEARCH=true: behind a custom ANTHROPIC_BASE_URL Claude Code turns tool search off and sends every tool
// definition upfront. Setting it keeps the session the same as without the relay.)
import fs from 'node:fs';
import http from 'node:http';

const UPSTREAM = 'https://api.anthropic.com';
const log = fs.createWriteStream(process.env.RELAY_LOG ?? new URL('./requests.jsonl', import.meta.url), { flags: 'a' });
// Hop-by-hop headers stay on this side; everything else goes through as it came.
const SKIP = new Set(['host', 'connection', 'content-length', 'accept-encoding', 'upgrade', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'proxy-connection']);
let count = 0;

// Reads the answer as it streams past and keeps the usage. A streamed answer reports it twice:
// message_start (the input side) and message_delta (the final output count). A plain JSON answer has it in its body.
function usageReader(contentType) {
  const decoder = new TextDecoder();
  let text = '';
  const out = { usage: null, model: null, stop_reason: null };
  const event = (data) => {
    if (data.type === 'message_start') {
      out.model = data.message.model;
      out.usage = { ...data.message.usage };
    } else if (data.type === 'message_delta') {
      out.usage = { ...out.usage, ...data.usage };
      out.stop_reason = data.delta?.stop_reason ?? out.stop_reason;
    }
  };
  return {
    feed(chunk) {
      text += decoder.decode(chunk, { stream: true });
      if (!contentType.includes('event-stream')) return;
      let end;
      while ((end = text.indexOf('\n')) >= 0) {
        const line = text.slice(0, end).trim();
        text = text.slice(end + 1);
        if (line.startsWith('data:')) {
          try { event(JSON.parse(line.slice(5))); } catch { /* not JSON: skip */ }
        }
      }
    },
    result() {
      if (!contentType.includes('event-stream')) {
        try {
          const body = JSON.parse(text);
          out.usage = body.usage ?? (body.input_tokens != null ? { input_tokens: body.input_tokens } : null);
          out.model = body.model ?? null;
          out.stop_reason = body.stop_reason ?? null;
        } catch { /* not JSON: no usage */ }
      }
      return out;
    },
  };
}

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  const logged = req.url.startsWith('/v1/messages') && body.length > 0;
  const id = ++count;
  if (logged) {
    log.write(JSON.stringify({ id, t: new Date().toISOString(), url: req.url, body: JSON.parse(body) }) + '\n');
  }
  const headers = Object.fromEntries(Object.entries(req.headers).filter(([k]) => !SKIP.has(k)));
  let up;
  try {
    up = await fetch(UPSTREAM + req.url, { method: req.method, headers, body: body.length ? body : undefined });
  } catch (err) {
    res.writeHead(502).end(String(err.cause ?? err));
    return;
  }
  res.writeHead(up.status, Object.fromEntries([...up.headers].filter(([k]) => !['content-encoding', 'content-length'].includes(k))));
  const reader = usageReader(up.headers.get('content-type') ?? '');
  if (up.body) {
    for await (const c of up.body) {
      res.write(c);
      if (logged) reader.feed(c);
    }
  }
  res.end();
  if (logged) {
    log.write(JSON.stringify({ id, t: new Date().toISOString(), url: req.url, status: up.status, ...reader.result() }) + '\n');
  }
}).listen(8787, () => console.log('relay on http://localhost:8787 → ' + UPSTREAM));

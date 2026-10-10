// PreToolUse hook: Claude Code runs this before every Edit, Write or Bash call.
// The tool call arrives on standard in as JSON. Exit code 2 blocks it, and stderr goes back to Claude as the reason.
let input = '';
for await (const chunk of process.stdin) input += chunk;
const { tool_name, tool_input } = JSON.parse(input);

const ENV = /(^|[\/\s'"])\.env(\s|$|['"])/;
const REDIRECT = />>?\s*['"]?\.env(\s|$|['"])/;
const WRITERS = /\b(sed\s+-i|perl\s+-i|tee|mv|cp|rm|truncate)\b/;
const cmd = tool_input.command ?? '';
const blocked = tool_name === 'Bash'
  ? REDIRECT.test(cmd) || (ENV.test(cmd) && WRITERS.test(cmd))
  : ENV.test(tool_input.file_path ?? '');

if (blocked) {
  console.error(`Blocked: ${tool_name} would change .env. Ask the user to change .env themselves.`);
  process.exit(2);
}
process.exit(0);

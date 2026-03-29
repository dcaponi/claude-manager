# Claude Manager

A desktop app for managing Claude Code skills, agents, plugins, and agent teams. Provides a visual UI for creating, editing, and organizing Claude Code components at both global and project levels.

## What Are These Resources?

### Skills
Slash-command prompts that extend Claude Code. When you create a skill named `deploy`, you invoke it in Claude Code with `/deploy`.

| | |
|---|---|
| **Global path** | `~/.claude/skills/<name>/SKILL.md` |
| **Project path** | `.claude/skills/<name>/SKILL.md` |
| **Invocation** | `/<skill-name>` or `/<skill-name> <args>` |
| **Key fields** | `name`, `description`, `disable-model-invocation`, `context`, `agent`, `memory` |

**`disable-model-invocation`** — When `true`, only the user can invoke this skill via slash command. The model cannot trigger it automatically. Use this for destructive or sensitive operations (deploys, database migrations, etc).

**`context: fork`** — Runs the skill in a forked conversation context so it doesn't pollute the main thread.

**`agent`** — Delegates execution to a specific agent type (`Explore` for codebase search, `Plan` for architecture).

**`memory`** — Where the skill stores persistent state: `user` (~/.claude/), `project` (.claude/), or `local` (not version-controlled).

### Agents (Subagents)
Specialized Claude instances with restricted tool access and focused prompts. An agent named `db-optimizer` is stored as a single markdown file.

| | |
|---|---|
| **Global path** | `~/.claude/agents/<name>.md` |
| **Project path** | `.claude/agents/<name>.md` |
| **Key fields** | `name`, `description`, `tools`, `model`, `memory`, `isolation` |

**`tools`** — Comma-separated list of allowed tools: `Read`, `Grep`, `Glob`, `Bash`, `Edit`, `Write`, `Agent`, `WebFetch`, `WebSearch`. Restricting tools makes agents safer (e.g., read-only agents that can only use `Read, Grep, Glob`).

**`model`** — Which Claude model to use: `opus` (most capable), `sonnet` (balanced), `haiku` (fastest).

**`isolation: worktree`** — Runs the agent in an isolated git worktree so it can't interfere with your working tree. Automatically cleaned up if no changes are made.

### Plugins
Bundles of skills, agents, hooks, and configuration distributed as packages.

```
plugin-directory/
├── .claude-plugin/plugin.json
├── skills/
│   └── <name>/SKILL.md
├── agents/
├── hooks/
├── .mcp.json
└── .lsp.json
```

Plugin skills are namespaced as `plugin-name:skill-name` to prevent conflicts. Install via CLI:
```
/plugin install name@source
/plugin marketplace add https://github.com/org/repo.git
```

**Priority**: Enterprise settings > Personal (~/.claude/) > Project (.claude/).

### Agent Teams
Experimental multi-agent collaboration where multiple Claude instances work together.

| | |
|---|---|
| **Enable** | Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json `env` |
| **Display modes** | In-process (Shift+Down to cycle) or tmux (`teammateMode: "tmux"`) |

**Architecture**: A Lead session orchestrates work, creating tasks on a shared board. Teammates are independent Claude instances that claim tasks and work in parallel. Unlike subagents, teammates can message each other directly.

## Installation

### Pre-built Binaries (Recommended)
Download the latest release for your platform from the [Releases](../../releases) page:
- **macOS**: `Claude-Manager.dmg`
- **Windows**: `Claude-Manager-Setup.exe`

No Node.js or other dependencies required.

### As a Claude Code Skill
Install and launch directly from Claude Code:
```
/claude-manager
```
The skill auto-detects your platform, downloads the binary, and launches the app.

### From Source
```bash
git clone https://github.com/dcaponi/claude-manager.git claude-manager
cd claude-manager
npm install
npm run dev
```

## Usage

1. **Pick your scope** — Toggle between Global and Project in the sidebar. Global components live in `~/.claude/` and are available everywhere. Project components live in `.claude/` within a specific project.

2. **Browse components** — Click Skills, Agents, Plugins, or Agent Teams in the sidebar. Each component shows its name, description, scope, and invocation method.

3. **Expand for details** — Click any component card to reveal its full prompt, metadata, and file path.

4. **Create / Edit / Delete** — Use the control panel (+ New button or Edit) with form fields for every setting, or use the chat bubble.

5. **Chat assistant** — Click the chat bubble (bottom-right) to describe what you want in natural language. It creates components directly. You can also ask questions like "What is a plugin?" or "What's the difference between a skill and an agent?"

6. **Settings** — Configure the Claude CLI path and verify your connection.

## How It Works

Claude Manager reads and writes the same files Claude Code uses natively. There is no sync layer — both tools share the filesystem:

```
~/.claude/
├── skills/           ← Skills view reads/writes here
├── agents/           ← Agents view reads/writes here
├── plugins/          ← Plugins view reads here
├── settings.json     ← Teams view reads/writes here
└── claude-manager-config.json  ← App settings (CLI path)
```

The chat assistant calls `claude --print` to power natural language interactions.

## Building

```bash
# Development
npm run dev

# Production build (creates platform-specific binaries)
npm run build
```

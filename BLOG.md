# Claude Code Has a Powerful Extension System. It's Buried in Markdown Files.

Claude Code can do a lot more than most people realize. Behind the CLI is an entire extension system -- skills, agents, plugins, agent teams -- that lets you customize how Claude works, restrict its tools, give it specialized prompts, and even run multiple Claude instances in parallel on a shared task board.

The catch: all of it is configured through markdown files and JSON scattered across `~/.claude/` and `.claude/` directories. There is no UI. There is no discovery mechanism. You either know the file paths and frontmatter fields, or you don't use any of it.

I built Claude Manager because I kept forgetting the directory structure, the frontmatter keys, and which scope I was editing. It is an Electron desktop app that gives you a visual interface for the entire extension system. It reads and writes the same files Claude Code uses natively -- no sync layer, no database, no middleware. Both tools share the filesystem.

This post covers what each component type does, why you would want it, and how Claude Manager makes them accessible.

## The four component types

### Skills: Slash commands you define yourself

A skill is a reusable prompt that you invoke with a slash command. Create a skill called `deploy` and you run it in Claude Code with `/deploy`. Behind the scenes, it is a `SKILL.md` file in a specific directory.

```
~/.claude/skills/deploy/SKILL.md     (global -- available everywhere)
.claude/skills/deploy/SKILL.md       (project -- scoped to one repo)
```

The file has YAML frontmatter for configuration and a markdown body for the prompt itself. The frontmatter controls behavior:

- **disable-model-invocation**: When true, only you can trigger this skill via slash command. Claude cannot invoke it on its own. Use this for anything destructive -- deploys, migrations, data wipes.
- **context: fork**: Runs the skill in a separate conversation context so it does not pollute your main thread with a long operation's output.
- **agent**: Delegates execution to a specialized agent type like `Explore` (fast codebase search) or `Plan` (architecture reasoning).
- **memory**: Where the skill persists state between runs. Options are `user` (global), `project` (repo-scoped), or `local` (gitignored).

Why you want this: You probably repeat the same complex prompts -- "review this PR for security issues," "generate migration from schema diff," "deploy to staging with rollback plan." Skills let you encode those as one-word commands.

### Agents (Subagents): Restricted Claude instances

An agent is a Claude instance with a focused prompt and limited tool access. Where a skill is a prompt template, an agent is a constrained persona.

```
~/.claude/agents/security-reviewer.md   (global)
.claude/agents/security-reviewer.md     (project)
```

Each agent's frontmatter controls:

- **tools**: A comma-separated allowlist. Give a read-only reviewer `Read, Grep, Glob` and nothing else. Give a code generator `Read, Grep, Glob, Edit, Write`. The available tools are `Read`, `Grep`, `Glob`, `Bash`, `Edit`, `Write`, `Agent`, `WebFetch`, and `WebSearch`.
- **model**: Choose `opus` for the hardest problems, `sonnet` for everyday work, or `haiku` when speed matters more than depth.
- **isolation: worktree**: Runs the agent in an isolated git worktree so it cannot touch your working tree. Changes are automatically cleaned up if the agent produces nothing useful.

Why you want this: Unrestricted Claude with all tools enabled is powerful but risky for certain tasks. An agent that can only read files cannot accidentally delete your database. An agent that runs in a worktree cannot corrupt your uncommitted changes.

### Plugins: Distributable bundles

A plugin packages skills, agents, hooks, and configuration into a single installable unit. Think of it like an npm package for Claude Code extensions.

```
my-plugin/
  .claude-plugin/plugin.json
  skills/
    lint-fix/SKILL.md
    test-gen/SKILL.md
  agents/
    code-reviewer.md
  hooks/
```

Plugin skills are namespaced to avoid collisions: if you install a plugin called `acme-tools`, its `lint-fix` skill becomes `acme-tools:lint-fix`. You install plugins from the marketplace or from a git URL:

```
/plugin install acme-tools@https://github.com/acme/claude-tools.git
```

Priority follows a clear hierarchy: enterprise settings override personal (`~/.claude/`), which override project (`.claude/`).

Why you want this: If your team has a standard set of review prompts, deploy procedures, or code generation patterns, a plugin lets you distribute and version them as a unit rather than copying markdown files between repos.

### Agent Teams: Multi-agent collaboration (experimental)

Agent teams are the most advanced feature and still experimental. Instead of one Claude instance working alone, you get a lead session that orchestrates multiple teammate instances working in parallel.

The architecture has three parts:
1. **Lead** -- your main Claude session. It creates tasks on a shared board.
2. **Teammates** -- independent Claude instances that claim tasks from the board and work on them.
3. **Lateral messaging** -- unlike subagents (which only talk to their parent), teammates can message each other directly for coordination.

You enable teams by setting `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in your settings.json env block. Display modes are either in-process (cycle between instances with Shift+Down) or tmux (each teammate in its own pane).

Why you want this: Large refactors, multi-file feature implementations, or cross-cutting changes where independent tasks can genuinely run in parallel. Not everything benefits from parallelism, but when it does, teams can significantly speed up the work.

## What Claude Manager actually looks like

The app is a single-window Electron application with a sidebar and a main content area.

**The sidebar** has a scope toggle at the top -- Global or Project -- so you always know where your changes will land. Global writes to `~/.claude/`. Project writes to `.claude/` in whichever directory you have selected. Below the toggle is the navigation: Skills, Agents, Plugins, Agent Teams, and Settings.

**The Skills view** lists every skill in the current scope as expandable cards. Each card shows the skill name, description, scope badge, and invocation command. Click a card to see the full prompt, all frontmatter fields, and the file path on disk. A search bar filters the list. The "+ New Skill" button opens a modal editor with form fields for every frontmatter option -- name, description, disable-model-invocation toggle, context mode dropdown, agent delegation, memory scope -- plus a monospace text area for the prompt body.

**The Agents view** works the same way but with agent-specific fields: tool allowlist (checkboxes for each tool), model selector, isolation mode, and memory scope.

**The Plugins view** shows installed plugins from both global and project scopes, including their bundled skills and metadata.

**The Agent Teams view** is a settings panel rather than a list. It shows the current status (enabled/disabled), has a checkbox to toggle the experimental flag, and a dropdown for the display mode. An info section explains the lead/teammate/task-board architecture for anyone unfamiliar with the feature.

**The Settings view** lets you configure the Claude CLI path and test the connection.

### The chat bubble

In the bottom-right corner there is a chat bubble powered by the Claude Code CLI (`claude --print`). This is the fastest way to create components if you already know what you want. Type something like:

- "Make a skill that deploys to staging with a rollback plan"
- "Create a read-only agent for security reviews that only uses Read, Grep, and Glob"
- "What is the difference between a skill and an agent?"

For creation requests, the assistant generates the component and writes it directly to disk in your current scope. It shows up in the relevant view immediately. For questions, it explains the concepts in plain text.

The chat bubble is context-aware -- it knows which view you are on and which scope is active, so it creates components in the right place.

## Installation

### Pre-built binaries (recommended)

Download the latest release from the [GitHub releases page](https://github.com/dcaponi/claude-manager/releases):

- **macOS**: `Claude-Manager.dmg` (universal binary, works on Intel and Apple Silicon)
- **Windows**: `Claude-Manager-Setup.exe`

No Node.js or other dependencies required. Download, install, run.

### As a Claude Code skill

If you already use Claude Code, you can install Claude Manager as a skill:

```
/claude-manager
```

The skill detects your platform, downloads the appropriate binary, and launches the app.

### From source

```bash
git clone https://github.com/dcaponi/claude-manager.git
cd claude-manager
npm install
npm run dev
```

This starts Vite for the renderer process and Electron for the main process. The app opens at `http://localhost:5173` and hot-reloads on changes.

To build distributable binaries:

```bash
npm run build          # current platform
npm run build:mac      # macOS .dmg and .zip
npm run build:win      # Windows .exe installer and .zip
npm run build:all      # both platforms
```

## How it works under the hood

There is no sync layer or database. Claude Manager reads and writes the same files that Claude Code reads:

```
~/.claude/
  skills/           <-- Skills view reads/writes here
  agents/           <-- Agents view reads/writes here
  plugins/          <-- Plugins view reads here
  settings.json     <-- Teams view reads/writes here
```

Skills are stored as `SKILL.md` files with YAML frontmatter. Agents are stored as single `.md` files with the same frontmatter convention. Plugins are directory trees with a `.claude-plugin/plugin.json` manifest. Agent team configuration lives in `settings.json` as environment variables and mode flags.

When you edit a skill in Claude Manager and then switch to Claude Code, it sees the change immediately because it is reading the same file. When Claude Code creates a skill (maybe via the chat bubble's CLI call), Claude Manager picks it up on the next refresh. Both tools are just filesystem readers and writers.

The chat assistant calls `claude --print --output-format text` with a system prompt that includes creation instructions. When the response contains a JSON block with component data, the app parses it and writes the file. This means the chat bubble works as well as Claude Code itself does -- it is using the same model underneath.

## Try it out

The extension system is one of the most useful parts of Claude Code and one of the least accessible. If you have ever written a SKILL.md file by hand and gotten the frontmatter wrong, or forgotten whether agents go in `~/.claude/agents/` or `~/.claude/skills/agents/`, or wanted to try agent teams but did not feel like editing settings.json by hand, this is what Claude Manager is for.

The repo is at [github.com/dcaponi/claude-manager](https://github.com/dcaponi/claude-manager). Grab a binary from the releases page or clone and build from source. Issues and pull requests are welcome -- especially if you have ideas for plugin marketplace integration, better agent team visualization, or support for hooks.

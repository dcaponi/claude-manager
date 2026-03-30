# Claude Manager Redesign: Plugin-Centric Architecture

## Overview

Redesign the Claude Manager Electron app to use the established Claude Code file system conventions for plugins, skills, agents, MCP servers, and marketplaces. The current implementation uses incorrect paths and data structures. The redesigned app serves three purposes:

1. **View and manage** existing skills, agents, and plugins (third-party are read-only with uninstall; owned are fully editable)
2. **Flatten marketplaces** into a searchable list of plugins, with the chatbot recommending existing plugins before users create duplicates
3. **CRUD own plugins** on owned marketplaces, including a publish workflow that scaffolds plugin structure and pushes via git

## Data Model

### Marketplace

A catalog of plugins backed by a git repo.

- **Source of truth:** `~/.claude/plugins/known_marketplaces.json`
- **Cloned at:** `~/.claude/plugins/marketplaces/<name>/`
- **Catalog:** `<marketplace>/.claude-plugin/marketplace.json`
- **Owned flag:** Stored in `~/.claude/claude-manager-config.json` under `ownedMarketplaces` array to distinguish user-owned (read-write) from subscribed (read-only)

### Plugin

The distribution unit. Groups skills, agents, hooks, and MCP servers.

- **Installation tracking:** `~/.claude/plugins/installed_plugins.json` (version 2 format)
- **Enabled/disabled state:** `~/.claude/settings.json` -> `enabledPlugins` map (key format: `"plugin-name@marketplace-name": true/false`)
- **Installed location:** `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`
- **Internal structure:**
  ```
  plugin-name/
  ├── .claude-plugin/
  │   └── plugin.json        # name, description, version, author
  ├── skills/
  │   └── skill-name/
  │       └── SKILL.md       # YAML frontmatter + markdown body
  ├── agents/
  │   └── agent-name.md      # YAML frontmatter + markdown body
  ├── hooks/
  │   └── hooks.json
  └── .mcp.json               # plugin-bundled MCP servers
  ```

### Virtual "Local" Plugin

Groups standalone skills and agents that are not part of any plugin.

- **Personal skills:** `~/.claude/skills/<name>/SKILL.md`
- **Project skills:** `.claude/skills/<name>/SKILL.md`
- **Personal agents:** `~/.claude/agents/<name>.md`
- **Project agents:** `.claude/agents/<name>.md`
- Displayed in the UI as a pseudo-plugin called "Local" with scope labels (personal/project)
- Items here are fully editable and can be packaged into a real plugin via the publish wizard

### MCP Server

External service connections from three sources:

- **Global:** `~/.claude/.mcp.json` -> `mcpServers` object
- **Project:** `.mcp.json` -> `mcpServers` object
- **Plugin-bundled:** `<plugin-install-path>/.mcp.json` -> `mcpServers` object

### SKILL.md Format

```yaml
---
name: skill-name                    # lowercase, hyphens only
description: |                      # when to use (not what it does)
  Use when [conditions]. Provides [capability].
disable-model-invocation: false     # true = user-only invocation
model: sonnet | haiku | opus        # optional model override
allowed-tools: [Read, Grep, Glob]   # optional tool restrictions
---

Markdown body with skill instructions...
```

### Agent .md Format

```yaml
---
name: agent-name
description: |
  When Claude should delegate to this agent
tools: Read, Grep, Glob, Bash       # tool restrictions
model: inherit | sonnet | opus
---

System prompt markdown body...
```

## Navigation & Views

### Top-Level Navigation

Sidebar nav with five sections: **Plugins** (default), **Marketplaces**, **MCP Servers**, **Chat**, **Settings**

### Plugins View (Main View)

A flat, searchable, filterable list of all plugins.

**List controls:**
- Search box: searches plugin names, descriptions, skill names, agent names
- Marketplace filter: dropdown of known marketplaces + "Local"
- Status filter: All / Installed / Available / Local
- "New Plugin" button: opens package & publish wizard

**List rows:** Each plugin shows:
- Plugin name
- Marketplace source badge
- Status indicator (installed/available/local)
- Description snippet
- Skill + agent count
- Enabled/disabled state (for installed plugins)

**Plugin detail view** (click to open):

Header section:
- Plugin name, version, description, author
- Marketplace source
- Enabled/disabled toggle (for installed)
- Install/uninstall button (for marketplace plugins)
- "Publish Changes" button (for owned plugins with edits)

Tabbed content:
- **Skills tab:** List of skills with name + description. Click to view full SKILL.md content. For owned/local plugins, click to edit with markdown editor.
- **Agents tab:** Same pattern for agent .md files.
- **Hooks tab:** Shows hooks.json config. Read-only for third-party, editable for owned.
- **MCP Servers tab:** Shows plugin-bundled MCP servers. Read-only for third-party, editable for owned.

**Editability rules:**
- Third-party installed plugins: read-only content viewer, install/uninstall/enable/disable only
- Owned plugins (on owned marketplace): full CRUD on all contents
- Local virtual plugin: full CRUD, plus "Package as Plugin" action on individual items

### Marketplaces View

List of known marketplaces.

**Each row shows:** name, source repo URL, owned/subscribed badge, plugin count, last updated timestamp

**Actions:**
- "Add Marketplace": enter GitHub `owner/repo` or git URL
- "Create Marketplace": wizard to scaffold a new marketplace (see Publish Workflow)
- Per-marketplace: update (git pull), remove, toggle owned/subscribed
- Expand marketplace to see its plugin catalog (links to Plugins view filtered by that marketplace)

### MCP Servers View

Unified list of all MCP servers from all sources.

**Each row shows:** server name, type (stdio/sse), source label (Global / Project / `<plugin-name>`), config summary (command + args or URL)

**Actions:**
- Global and project servers: add, edit, delete (same as current functionality)
- Plugin-bundled servers: read-only, source badge links to parent plugin detail view

### Chat View

Existing chat interface with enhanced plugin awareness.

**Enhancement:** Before sending the user's message to Claude, the app prepends a compact plugin catalog index. When the bot recommends an available-but-not-installed plugin, the response includes an actionable "Install" button.

### Settings View

- Claude CLI path configuration (existing)
- Project path selector (existing)
- App preferences

## Package & Publish Workflow

### Entry Points

1. "New Plugin" button in Plugins view
2. "Package as Plugin" action on items in the Local virtual plugin
3. Chat bot suggests it when user creates a skill and wants to share it

### Wizard Steps

**Step 1: Select Contents**
- Checkboxes for all local skills and agents (personal + project scope)
- Option to create new skills/agents inline
- Selected items will be copied into the plugin structure

**Step 2: Plugin Metadata**
- Name (kebab-case, validated: lowercase + hyphens only)
- Description
- Version (defaults to `1.0.0`)
- Author name and email (remembered from last publish)
- License (optional, dropdown of SPDX identifiers)

**Step 3: Choose Destination**
- List of marketplaces marked as "owned"
- "Create New Marketplace" option:
  - Name (kebab-case)
  - GitHub repo (owner/repo)
  - App runs: create repo (or verify existing), scaffold `.claude-plugin/marketplace.json`, git init, add remote
  - New marketplace is automatically marked as "owned"
- For existing marketplace: shows preview of where the plugin will appear in the catalog

**Step 4: Review & Publish**
- Directory structure preview:
  ```
  my-plugin/
  ├── .claude-plugin/
  │   └── plugin.json
  ├── skills/
  │   └── selected-skill/
  │       └── SKILL.md
  └── agents/
      └── selected-agent.md
  ```
- Preview of the `marketplace.json` entry to be added
- "Publish" button executes:
  1. Scaffold plugin directory in marketplace repo
  2. Copy skill/agent content
  3. Write `plugin.json`
  4. Update `marketplace.json` with new plugin entry (relative path source)
  5. `git add`, `git commit`, `git push` via system git

**Error handling:**
- Git push failure (auth/network): surface error message, suggest checking git credentials
- Plugin name conflict: warn before overwriting, offer to rename

### Updating Published Plugins

When editing skills/agents in an owned plugin:
- A "Publish Changes" button appears in the plugin detail header
- Clicking it prompts for version bump (major/minor/patch)
- Updates `plugin.json` version, commits, and pushes

## Backend Architecture (main.js)

### New Core Functions

```javascript
// Reading the real file system conventions
readInstalledPlugins()
// Reads ~/.claude/plugins/installed_plugins.json
// Returns: { "plugin@marketplace": [{ scope, installPath, version, ... }] }

readEnabledPlugins()
// Reads ~/.claude/settings.json -> enabledPlugins
// Returns: { "plugin@marketplace": boolean }

readKnownMarketplaces()
// Reads ~/.claude/plugins/known_marketplaces.json
// Returns: { "name": { source, installLocation, lastUpdated } }

readMarketplaceCatalog(marketplacePath)
// Reads <marketplace>/.claude-plugin/marketplace.json
// Returns: { name, owner, plugins: [...] }

scanPluginContents(pluginPath)
// Scans a plugin install dir for skills, agents, hooks, MCP servers
// Returns: { skills: [...], agents: [...], hooks: {...}, mcpServers: {...} }
```

### Main Aggregation Functions

```javascript
listAllPlugins(projectPath)
// 1. Read installed plugins from installed_plugins.json
// 2. Read enabled state from settings.json -> enabledPlugins
// 3. For each installed plugin, scanPluginContents on its cache dir
// 4. Read all marketplace catalogs for available-but-not-installed plugins
// 5. Gather local standalone skills from ~/.claude/skills/ + .claude/skills/
// 6. Gather local standalone agents from ~/.claude/agents/ + .claude/agents/
// 7. Group local items under virtual "Local" plugin
// 8. Return unified list with source, status, editability metadata

listAllMcpServers(projectPath)
// 1. Read global from ~/.claude/.mcp.json
// 2. Read project from .mcp.json
// 3. Read plugin-bundled from each installed plugin's .mcp.json
// 4. Return unified list with source labels
```

### Modified Functions

- `listSkills` / `listAgents` become internal helpers called by `listAllPlugins`, no longer primary API
- `saveSkill` / `saveAgent` write to `~/.claude/skills/` or `~/.claude/agents/` for local items; for owned plugins, write to the plugin's cache directory (edits are local until explicitly published via "Publish Changes")
- `deleteSkill` / `deleteAgent` same split by ownership

### New Publishing Functions

```javascript
scaffoldPlugin(name, meta, skills, agents)
// Creates plugin directory structure with plugin.json, copies skill/agent files

addPluginToMarketplace(marketplaceName, pluginDir)
// Updates marketplace.json with new plugin entry using relative path source

publishToMarketplace(marketplaceName)
// Runs git add, git commit, git push on the marketplace repo using system git

createMarketplace(name, githubRepo)
// Scaffolds .claude-plugin/marketplace.json, initializes git, adds remote

installPlugin(pluginId, marketplace)
// Copies plugin from marketplace to cache, updates installed_plugins.json,
// adds entry to enabledPlugins in settings.json

uninstallPlugin(pluginId, marketplace)
// Removes from cache, removes from installed_plugins.json,
// removes from enabledPlugins in settings.json
```

### IPC API Surface

```javascript
// Plugins
'plugins:listAll'       (projectPath)                    // replaces plugins:list
'plugins:get'           (pluginId, marketplace)          // full detail with contents
'plugins:install'       (pluginId, marketplace)
'plugins:uninstall'     (pluginId, marketplace)
'plugins:enable'        (pluginId, marketplace)
'plugins:disable'       (pluginId, marketplace)
'plugins:scaffold'      (name, meta, skills, agents)
'plugins:publish'       (marketplaceName)

// Marketplaces
'marketplaces:list'     ()
'marketplaces:add'      (source)
'marketplaces:remove'   (name)
'marketplaces:create'   (name, repo)
'marketplaces:setOwned' (name, owned)
'marketplaces:update'   (name)                           // git pull

// MCP Servers
'mcp:listAll'           (projectPath)                    // replaces mcp:list, includes plugin sources
'mcp:save'              (scope, projectPath, id, config) // unchanged for global/project
'mcp:delete'            (scope, projectPath, id)         // unchanged for global/project

// Skills & Agents (local + owned plugin items)
'skills:save'           (scope, projectPath, id, meta, body)
'skills:delete'         (scope, projectPath, id)
'agents:save'           (scope, projectPath, id, meta, body)
'agents:delete'         (scope, projectPath, id)

// Chat
'chat:send'             (message, projectPath)           // enhanced with plugin context

// Settings & CLI
'settings:get'          (projectPath)
'settings:save'         (scope, projectPath, settings)
'claude:getPath'        ()
'claude:setPath'        (path)
'claude:test'           (customPath)
'dialog:openDirectory'  ()
```

## Chat Bot Enhancement

### Plugin-Aware Context Injection

Before sending the user's message to Claude via `claude --print`, the app:

1. Calls `listAllPlugins()` to get the full plugin catalog
2. Builds a compact index (names + one-line descriptions only)
3. Prepends as context:

```
You are a Claude Code assistant in the Claude Manager app. The user has access to these plugins:

[INSTALLED]
- superpowers@claude-plugins-official: Brainstorming, TDD, debugging workflows
  skills: brainstorming, test-driven-development, systematic-debugging, ...
- chrome-devtools-mcp@claude-plugins-official: Chrome DevTools integration
  skills: chrome-devtools, a11y-debugging, debug-optimize-lcp

[AVAILABLE (not installed)]
- frontend-design@claude-plugins-official: Frontend design workflows
- hookify@claude-plugins-official: Hook management utilities
...

If the user asks for a capability that matches an existing plugin, recommend it
before suggesting they build something new. If recommending an uninstalled plugin,
offer to install it.
```

4. Sends combined prompt via `claude --print --output-format text`

### Performance

- Plugin index is cached in memory and rebuilt only when `installed_plugins.json` or marketplace dirs change (file watcher)
- Index is compact: names + one-line descriptions, not full SKILL.md content
- For large catalogs (50+ plugins), pre-filter to most relevant matches using keyword overlap with the user's message before injecting

## Authentication

The app uses **system git** for all marketplace operations. No tokens are stored in the app.

- Push/pull operations shell out to `git` and rely on whatever credentials the user has configured (SSH keys, `gh auth`, credential helpers, macOS Keychain)
- If `git push` works in the user's terminal, it works in the app
- Auth failures surface the git error message and suggest the user check their git credentials

## Key Constraints

- **Read-only for third-party plugins:** Users can view all content but cannot modify third-party plugin files
- **Plugin is the distribution unit:** Skills and agents cannot be distributed standalone; they must be wrapped in a plugin to share via marketplaces
- **Namespace convention:** Plugin skills are invoked as `/plugin-name:skill-name`; local skills as `/skill-name`
- **Version tracking:** Plugin versions come from `plugin.json`, cached at `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`
- **No app-managed auth:** Git credentials are the user's responsibility

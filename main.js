const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const os = require('os');
const GLOBAL_CLAUDE_DIR = path.join(os.homedir(), '.claude');
const GLOBAL_SKILLS_DIR = path.join(GLOBAL_CLAUDE_DIR, 'skills');
const GLOBAL_AGENTS_DIR = path.join(GLOBAL_CLAUDE_DIR, 'agents');
const GLOBAL_SETTINGS_PATH = path.join(GLOBAL_CLAUDE_DIR, 'settings.json');
const APP_CONFIG_PATH = path.join(GLOBAL_CLAUDE_DIR, 'claude-manager-config.json');
const INSTALLED_PLUGINS_PATH = path.join(GLOBAL_CLAUDE_DIR, 'plugins', 'installed_plugins.json');
const KNOWN_MARKETPLACES_PATH = path.join(GLOBAL_CLAUDE_DIR, 'plugins', 'known_marketplaces.json');
const MARKETPLACES_DIR = path.join(GLOBAL_CLAUDE_DIR, 'plugins', 'marketplaces');
const PLUGINS_CACHE_DIR = path.join(GLOBAL_CLAUDE_DIR, 'plugins', 'cache');

function getAppConfig() {
  if (fs.existsSync(APP_CONFIG_PATH)) {
    try { return JSON.parse(fs.readFileSync(APP_CONFIG_PATH, 'utf-8')); } catch (e) {}
  }
  return {};
}

function saveAppConfig(config) {
  ensureDir(path.dirname(APP_CONFIG_PATH));
  fs.writeFileSync(APP_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function resolveClaudePath() {
  const config = getAppConfig();
  if (config.claudePath) return config.claudePath;
  // Auto-detect common locations
  const candidates = [
    path.join(os.homedir(), '.local', 'bin', 'claude'),
    '/usr/local/bin/claude',
    // Windows
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'claude', 'claude.exe'),
    path.join(os.homedir(), '.claude', 'local', 'claude'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'claude'; // fallback to PATH
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      meta[key] = val;
    }
  });
  return { meta, body: match[2] };
}

function buildFrontmatter(meta, body) {
  const lines = Object.entries(meta)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

// ── Plugin Discovery ──

function readInstalledPlugins() {
  if (!fs.existsSync(INSTALLED_PLUGINS_PATH)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(INSTALLED_PLUGINS_PATH, 'utf-8'));
    return data.plugins || {};
  } catch (e) {
    return {};
  }
}

function readEnabledPlugins() {
  if (!fs.existsSync(GLOBAL_SETTINGS_PATH)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(GLOBAL_SETTINGS_PATH, 'utf-8'));
    return data.enabledPlugins || {};
  } catch (e) {
    return {};
  }
}

function readKnownMarketplaces() {
  if (!fs.existsSync(KNOWN_MARKETPLACES_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(KNOWN_MARKETPLACES_PATH, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function readMarketplaceCatalog(marketplacePath) {
  const catalogPath = path.join(marketplacePath, '.claude-plugin', 'marketplace.json');
  if (!fs.existsSync(catalogPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function scanPluginContents(pluginPath) {
  if (!fs.existsSync(pluginPath)) {
    return { skills: [], agents: [], hooks: null, mcpServers: {}, meta: {} };
  }

  // Read plugin metadata
  let meta = {};
  const pluginJsonPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');
  if (fs.existsSync(pluginJsonPath)) {
    try { meta = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8')); } catch (e) {}
  }

  // Scan skills: skills/*/SKILL.md (new format) and commands/*.md (legacy)
  const skills = [];
  const skillsDir = path.join(pluginPath, 'skills');
  if (fs.existsSync(skillsDir)) {
    try {
      for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          const { meta: sm, body } = parseFrontmatter(fs.readFileSync(skillFile, 'utf-8'));
          skills.push({ id: entry.name, ...sm, body, filePath: skillFile });
        }
      }
    } catch (e) {}
  }
  // Legacy: commands/*.md
  const commandsDir = path.join(pluginPath, 'commands');
  if (fs.existsSync(commandsDir)) {
    try {
      for (const f of fs.readdirSync(commandsDir).filter(n => n.endsWith('.md'))) {
        const id = f.replace('.md', '');
        if (skills.find(s => s.id === id)) continue; // skip if already found in skills/
        const filePath = path.join(commandsDir, f);
        const { meta: sm, body } = parseFrontmatter(fs.readFileSync(filePath, 'utf-8'));
        skills.push({ id, ...sm, body, filePath, legacy: true });
      }
    } catch (e) {}
  }

  // Scan agents: agents/*.md
  const agents = [];
  const agentsDir = path.join(pluginPath, 'agents');
  if (fs.existsSync(agentsDir)) {
    try {
      for (const f of fs.readdirSync(agentsDir).filter(n => n.endsWith('.md'))) {
        const id = f.replace('.md', '');
        const filePath = path.join(agentsDir, f);
        const { meta: am, body } = parseFrontmatter(fs.readFileSync(filePath, 'utf-8'));
        agents.push({ id, ...am, body, filePath });
      }
    } catch (e) {}
  }

  // Read hooks
  let hooks = null;
  const hooksFile = path.join(pluginPath, 'hooks', 'hooks.json');
  if (fs.existsSync(hooksFile)) {
    try { hooks = JSON.parse(fs.readFileSync(hooksFile, 'utf-8')); } catch (e) {}
  }

  // Read MCP servers from .mcp.json
  let mcpServers = {};
  const mcpFile = path.join(pluginPath, '.mcp.json');
  if (fs.existsSync(mcpFile)) {
    try { mcpServers = JSON.parse(fs.readFileSync(mcpFile, 'utf-8')); } catch (e) {}
  }

  return { skills, agents, hooks, mcpServers, meta };
}

function listAllPlugins(projectPath) {
  const appConfig = getAppConfig();
  const ownedMarketplaces = new Set(appConfig.ownedMarketplaces || []);

  const installedPlugins = readInstalledPlugins();
  const enabledPlugins = readEnabledPlugins();
  const knownMarketplaces = readKnownMarketplaces();

  const results = [];
  const seenKeys = new Set();

  // Process installed plugins
  for (const [key, installations] of Object.entries(installedPlugins)) {
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    // Parse key: "plugin-name@marketplace-name"
    const atIdx = key.lastIndexOf('@');
    const pluginName = atIdx > -1 ? key.slice(0, atIdx) : key;
    const marketplace = atIdx > -1 ? key.slice(atIdx + 1) : null;

    // Pick the most relevant installation (prefer user scope, then first)
    const installList = Array.isArray(installations) ? installations : [installations];
    const userInstall = installList.find(i => i.scope === 'user') || installList[0];
    const installPath = userInstall ? userInstall.installPath : null;

    const contents = installPath ? scanPluginContents(installPath) : { skills: [], agents: [], hooks: null, mcpServers: {}, meta: {} };

    const isEnabled = enabledPlugins[key] !== undefined ? enabledPlugins[key] : true;
    const isEditable = marketplace ? ownedMarketplaces.has(marketplace) : false;

    results.push({
      id: pluginName,
      key,
      name: contents.meta.name || pluginName,
      description: contents.meta.description || '',
      version: userInstall ? userInstall.version : null,
      author: contents.meta.author || null,
      marketplace,
      status: 'installed',
      enabled: isEnabled,
      editable: isEditable,
      scope: userInstall ? userInstall.scope : 'user',
      installPath,
      skills: contents.skills,
      agents: contents.agents,
      hooks: contents.hooks,
      mcpServers: contents.mcpServers,
      meta: contents.meta,
    });
  }

  // Process marketplace catalogs for available-but-not-installed plugins
  for (const [mpName, mpInfo] of Object.entries(knownMarketplaces)) {
    const mpPath = mpInfo.installLocation;
    const catalog = readMarketplaceCatalog(mpPath);
    if (!catalog || !Array.isArray(catalog.plugins)) continue;

    for (const plugin of catalog.plugins) {
      const pluginId = plugin.name;
      const pluginKey = `${pluginId}@${mpName}`;
      if (seenKeys.has(pluginKey)) continue; // already in installed list
      seenKeys.add(pluginKey);

      const isEditable = ownedMarketplaces.has(mpName);

      results.push({
        id: pluginId,
        key: pluginKey,
        name: plugin.name,
        description: plugin.description || '',
        version: null,
        author: plugin.author || null,
        marketplace: mpName,
        status: 'available',
        enabled: false,
        editable: isEditable,
        scope: null,
        installPath: null,
        skills: [],
        agents: [],
        hooks: null,
        mcpServers: {},
        meta: plugin,
      });
    }
  }

  // Gather local standalone skills and agents under virtual "Local" plugin
  const localSkillsDirs = [GLOBAL_SKILLS_DIR];
  if (projectPath) localSkillsDirs.push(path.join(projectPath, '.claude', 'skills'));

  const localAgentsDirs = [GLOBAL_AGENTS_DIR];
  if (projectPath) localAgentsDirs.push(path.join(projectPath, '.claude', 'agents'));

  const localSkills = [];
  for (const dir of localSkillsDirs) {
    if (!fs.existsSync(dir)) continue;
    const scope = dir === GLOBAL_SKILLS_DIR ? 'global' : 'project';
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const skillFile = path.join(dir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          const { meta: sm, body } = parseFrontmatter(fs.readFileSync(skillFile, 'utf-8'));
          localSkills.push({ id: entry.name, ...sm, body, scope, filePath: skillFile });
        }
      }
    } catch (e) {}
  }

  const localAgents = [];
  for (const dir of localAgentsDirs) {
    if (!fs.existsSync(dir)) continue;
    const scope = dir === GLOBAL_AGENTS_DIR ? 'global' : 'project';
    try {
      for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.md'))) {
        const id = f.replace('.md', '');
        const filePath = path.join(dir, f);
        const { meta: am, body } = parseFrontmatter(fs.readFileSync(filePath, 'utf-8'));
        localAgents.push({ id, ...am, body, scope, filePath });
      }
    } catch (e) {}
  }

  if (localSkills.length > 0 || localAgents.length > 0) {
    results.push({
      id: '__local__',
      key: '__local__',
      name: 'Local',
      description: 'Standalone local skills and agents not part of any plugin',
      version: null,
      author: null,
      marketplace: null,
      status: 'local',
      enabled: true,
      editable: true,
      scope: 'local',
      installPath: null,
      skills: localSkills,
      agents: localAgents,
      hooks: null,
      mcpServers: {},
      meta: {},
    });
  }

  return results;
}

function listAllMcpServers(projectPath) {
  const results = [];

  // Helper to add servers from a config file
  const addServersFromFile = (filePath, source, sourceLabel, editable) => {
    if (!fs.existsSync(filePath)) return;
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const servers = raw.mcpServers || raw;
      if (typeof servers !== 'object') return;
      for (const [id, cfg] of Object.entries(servers)) {
        results.push({
          id,
          type: cfg.url ? 'sse' : 'stdio',
          source,
          sourceLabel,
          editable,
          filePath,
          ...cfg,
        });
      }
    } catch (e) {}
  };

  // Global .mcp.json
  addServersFromFile(path.join(GLOBAL_CLAUDE_DIR, '.mcp.json'), 'global', 'Global', true);

  // Project .mcp.json
  if (projectPath) {
    addServersFromFile(path.join(projectPath, '.mcp.json'), 'project', 'Project', true);
  }

  // Plugin-bundled .mcp.json files from installed plugins
  const installedPlugins = readInstalledPlugins();
  for (const [key, installations] of Object.entries(installedPlugins)) {
    const installList = Array.isArray(installations) ? installations : [installations];
    const userInstall = installList.find(i => i.scope === 'user') || installList[0];
    if (!userInstall || !userInstall.installPath) continue;

    const mcpFile = path.join(userInstall.installPath, '.mcp.json');
    const atIdx = key.lastIndexOf('@');
    const pluginName = atIdx > -1 ? key.slice(0, atIdx) : key;
    addServersFromFile(mcpFile, 'plugin', `Plugin: ${pluginName}`, false);
  }

  return results;
}

// ── Skills ──

function listSkills(scope, projectPath) {
  const baseDir = scope === 'global' ? GLOBAL_SKILLS_DIR : path.join(projectPath, '.claude', 'skills');
  if (!fs.existsSync(baseDir)) return [];
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => {
      const skillFile = path.join(baseDir, e.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) return null;
      const content = fs.readFileSync(skillFile, 'utf-8');
      const { meta, body } = parseFrontmatter(content);
      return { id: e.name, ...meta, body, scope, filePath: skillFile };
    })
    .filter(Boolean);
}

function getSkill(scope, projectPath, id) {
  const baseDir = scope === 'global' ? GLOBAL_SKILLS_DIR : path.join(projectPath, '.claude', 'skills');
  const skillFile = path.join(baseDir, id, 'SKILL.md');
  if (!fs.existsSync(skillFile)) return null;
  const content = fs.readFileSync(skillFile, 'utf-8');
  const { meta, body } = parseFrontmatter(content);
  return { id, ...meta, body, scope, filePath: skillFile };
}

function saveSkill(scope, projectPath, id, meta, body) {
  const baseDir = scope === 'global' ? GLOBAL_SKILLS_DIR : path.join(projectPath, '.claude', 'skills');
  const skillDir = path.join(baseDir, id);
  ensureDir(skillDir);
  const content = buildFrontmatter(meta, body);
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content, 'utf-8');
  return { id, ...meta, body, scope };
}

function deleteSkill(scope, projectPath, id) {
  const baseDir = scope === 'global' ? GLOBAL_SKILLS_DIR : path.join(projectPath, '.claude', 'skills');
  const skillDir = path.join(baseDir, id);
  if (fs.existsSync(skillDir)) fs.rmSync(skillDir, { recursive: true });
  return true;
}

// ── Agents ──

function listAgents(scope, projectPath) {
  const baseDir = scope === 'global' ? GLOBAL_AGENTS_DIR : path.join(projectPath, '.claude', 'agents');
  if (!fs.existsSync(baseDir)) return [];
  const entries = fs.readdirSync(baseDir).filter(f => f.endsWith('.md'));
  return entries.map(f => {
    const content = fs.readFileSync(path.join(baseDir, f), 'utf-8');
    const { meta, body } = parseFrontmatter(content);
    const id = f.replace('.md', '');
    return { id, ...meta, body, scope, filePath: path.join(baseDir, f) };
  });
}

function getAgent(scope, projectPath, id) {
  const baseDir = scope === 'global' ? GLOBAL_AGENTS_DIR : path.join(projectPath, '.claude', 'agents');
  const agentFile = path.join(baseDir, `${id}.md`);
  if (!fs.existsSync(agentFile)) return null;
  const content = fs.readFileSync(agentFile, 'utf-8');
  const { meta, body } = parseFrontmatter(content);
  return { id, ...meta, body, scope, filePath: agentFile };
}

function saveAgent(scope, projectPath, id, meta, body) {
  const baseDir = scope === 'global' ? GLOBAL_AGENTS_DIR : path.join(projectPath, '.claude', 'agents');
  ensureDir(baseDir);
  const content = buildFrontmatter(meta, body);
  fs.writeFileSync(path.join(baseDir, `${id}.md`), content, 'utf-8');
  return { id, ...meta, body, scope };
}

function deleteAgent(scope, projectPath, id) {
  const baseDir = scope === 'global' ? GLOBAL_AGENTS_DIR : path.join(projectPath, '.claude', 'agents');
  const agentFile = path.join(baseDir, `${id}.md`);
  if (fs.existsSync(agentFile)) fs.unlinkSync(agentFile);
  return true;
}

// ── Plugins ──

function listPlugins(projectPath) {
  const results = [];
  // Check project .claude/settings.json for plugin references
  const settingsPaths = [GLOBAL_SETTINGS_PATH];
  if (projectPath) {
    settingsPaths.push(path.join(projectPath, '.claude', 'settings.json'));
  }
  for (const sp of settingsPaths) {
    if (fs.existsSync(sp)) {
      try {
        const settings = JSON.parse(fs.readFileSync(sp, 'utf-8'));
        if (settings.plugins) {
          for (const plugin of settings.plugins) {
            results.push({
              id: plugin.name || plugin,
              name: plugin.name || plugin,
              source: plugin.source || 'unknown',
              enabled: plugin.enabled !== false,
              scope: sp === GLOBAL_SETTINGS_PATH ? 'global' : 'project',
              settingsPath: sp,
            });
          }
        }
      } catch (e) { /* ignore parse errors */ }
    }
  }
  // Also scan for local plugin directories
  const pluginDirs = [];
  if (projectPath) {
    const localPlugins = path.join(projectPath, '.claude', 'plugins');
    if (fs.existsSync(localPlugins)) {
      pluginDirs.push(...fs.readdirSync(localPlugins, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => ({ dir: path.join(localPlugins, e.name), scope: 'project' })));
    }
  }
  const globalPlugins = path.join(GLOBAL_CLAUDE_DIR, 'plugins');
  if (fs.existsSync(globalPlugins)) {
    pluginDirs.push(...fs.readdirSync(globalPlugins, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => ({ dir: path.join(globalPlugins, e.name), scope: 'global' })));
  }
  for (const { dir, scope } of pluginDirs) {
    const pluginJson = path.join(dir, '.claude-plugin', 'plugin.json');
    let meta = {};
    if (fs.existsSync(pluginJson)) {
      try { meta = JSON.parse(fs.readFileSync(pluginJson, 'utf-8')); } catch (e) {}
    }
    // Gather plugin skills
    const skillsDir = path.join(dir, 'skills');
    const skills = [];
    if (fs.existsSync(skillsDir)) {
      for (const s of fs.readdirSync(skillsDir, { withFileTypes: true }).filter(e => e.isDirectory())) {
        const sf = path.join(skillsDir, s.name, 'SKILL.md');
        if (fs.existsSync(sf)) {
          const { meta: sm, body } = parseFrontmatter(fs.readFileSync(sf, 'utf-8'));
          skills.push({ id: s.name, ...sm, body });
        }
      }
    }
    const existing = results.find(r => r.id === path.basename(dir));
    if (existing) {
      existing.meta = meta;
      existing.skills = skills;
      existing.dirPath = dir;
    } else {
      results.push({
        id: path.basename(dir),
        name: meta.name || path.basename(dir),
        description: meta.description || '',
        source: 'local',
        enabled: true,
        scope,
        meta,
        skills,
        dirPath: dir,
      });
    }
  }
  return results;
}

// ── MCP Servers ──

function getMcpPath(scope, projectPath) {
  if (scope === 'global') return path.join(GLOBAL_CLAUDE_DIR, '.mcp.json');
  return path.join(projectPath, '.mcp.json');
}

function readMcpConfig(scope, projectPath) {
  const filePath = getMcpPath(scope, projectPath);
  if (!fs.existsSync(filePath)) return { mcpServers: {} };
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return data.mcpServers ? data : { mcpServers: data };
  } catch (e) {
    return { mcpServers: {} };
  }
}

function writeMcpConfig(scope, projectPath, config) {
  const filePath = getMcpPath(scope, projectPath);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}

function listMcpServers(scope, projectPath) {
  const config = readMcpConfig(scope, projectPath);
  const servers = config.mcpServers || {};
  return Object.entries(servers).map(([id, cfg]) => ({
    id,
    command: cfg.command || '',
    args: cfg.args || [],
    env: cfg.env || {},
    url: cfg.url || '',
    type: cfg.url ? 'sse' : 'stdio',
    scope,
    filePath: getMcpPath(scope, projectPath),
  }));
}

function saveMcpServer(scope, projectPath, id, serverConfig) {
  const config = readMcpConfig(scope, projectPath);
  if (!config.mcpServers) config.mcpServers = {};
  const entry = {};
  if (serverConfig.type === 'sse' && serverConfig.url) {
    entry.url = serverConfig.url;
  } else {
    entry.command = serverConfig.command;
    entry.args = serverConfig.args || [];
  }
  if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
    entry.env = serverConfig.env;
  }
  config.mcpServers[id] = entry;
  writeMcpConfig(scope, projectPath, config);
  return { id, ...entry, scope };
}

function deleteMcpServer(scope, projectPath, id) {
  const config = readMcpConfig(scope, projectPath);
  if (config.mcpServers) {
    delete config.mcpServers[id];
  }
  writeMcpConfig(scope, projectPath, config);
  return true;
}

// ── Agent Teams (settings) ──

function getSettings(projectPath) {
  const result = { global: {}, project: {} };
  if (fs.existsSync(GLOBAL_SETTINGS_PATH)) {
    try { result.global = JSON.parse(fs.readFileSync(GLOBAL_SETTINGS_PATH, 'utf-8')); } catch (e) {}
  }
  if (projectPath) {
    const pp = path.join(projectPath, '.claude', 'settings.json');
    if (fs.existsSync(pp)) {
      try { result.project = JSON.parse(fs.readFileSync(pp, 'utf-8')); } catch (e) {}
    }
  }
  return result;
}

function saveSettings(scope, projectPath, settings) {
  const filePath = scope === 'global' ? GLOBAL_SETTINGS_PATH : path.join(projectPath, '.claude', 'settings.json');
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
  return true;
}

// ── Chat with Claude Code ──

function chatWithClaude(message, projectPath, customClaudePath) {
  return new Promise((resolve, reject) => {
    const bin = customClaudePath || resolveClaudePath();
    const args = ['--print', '--output-format', 'text', message];
    const proc = spawn(bin, args, {
      cwd: projectPath || os.homedir(),
      env: { ...process.env },
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr || `Exit code ${code}`));
    });
    proc.on('error', reject);
  });
}

// ── IPC Handlers ──

function registerIPC() {
  // Skills
  ipcMain.handle('skills:list', (_, scope, projectPath) => listSkills(scope, projectPath));
  ipcMain.handle('skills:get', (_, scope, projectPath, id) => getSkill(scope, projectPath, id));
  ipcMain.handle('skills:save', (_, scope, projectPath, id, meta, body) => saveSkill(scope, projectPath, id, meta, body));
  ipcMain.handle('skills:delete', (_, scope, projectPath, id) => deleteSkill(scope, projectPath, id));

  // Agents
  ipcMain.handle('agents:list', (_, scope, projectPath) => listAgents(scope, projectPath));
  ipcMain.handle('agents:get', (_, scope, projectPath, id) => getAgent(scope, projectPath, id));
  ipcMain.handle('agents:save', (_, scope, projectPath, id, meta, body) => saveAgent(scope, projectPath, id, meta, body));
  ipcMain.handle('agents:delete', (_, scope, projectPath, id) => deleteAgent(scope, projectPath, id));

  // Plugins
  ipcMain.handle('plugins:list', (_, projectPath) => listPlugins(projectPath));
  ipcMain.handle('plugins:listAll', (_, projectPath) => listAllPlugins(projectPath));
  ipcMain.handle('mcp:listAll', (_, projectPath) => listAllMcpServers(projectPath));

  // MCP Servers
  ipcMain.handle('mcp:list', (_, scope, projectPath) => listMcpServers(scope, projectPath));
  ipcMain.handle('mcp:save', (_, scope, projectPath, id, config) => saveMcpServer(scope, projectPath, id, config));
  ipcMain.handle('mcp:delete', (_, scope, projectPath, id) => deleteMcpServer(scope, projectPath, id));

  // Settings / Agent Teams
  ipcMain.handle('settings:get', (_, projectPath) => getSettings(projectPath));
  ipcMain.handle('settings:save', (_, scope, projectPath, settings) => saveSettings(scope, projectPath, settings));

  // Chat
  ipcMain.handle('chat:send', async (_, message, projectPath) => {
    try {
      return { ok: true, response: await chatWithClaude(message, projectPath) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  // Claude CLI connection
  ipcMain.handle('claude:getPath', () => {
    const config = getAppConfig();
    return config.claudePath || '';
  });

  ipcMain.handle('claude:setPath', (_, newPath) => {
    const config = getAppConfig();
    if (newPath) {
      config.claudePath = newPath;
    } else {
      delete config.claudePath;
    }
    saveAppConfig(config);
    return true;
  });

  ipcMain.handle('claude:test', async (_, customPath) => {
    return new Promise((resolve) => {
      const bin = customPath || resolveClaudePath();
      const proc = spawn(bin, ['--version'], {
        cwd: os.homedir(),
        env: { ...process.env },
        timeout: 10000,
      });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', d => { stdout += d.toString(); });
      proc.stderr.on('data', d => { stderr += d.toString(); });
      proc.on('close', code => {
        if (code === 0) {
          resolve({ ok: true, version: stdout.trim(), path: bin });
        } else {
          resolve({ ok: false, error: stderr.trim() || `Exit code ${code}` });
        }
      });
      proc.on('error', (e) => {
        resolve({ ok: false, error: `Could not find Claude CLI at "${bin}". ${e.message}` });
      });
    });
  });

  // Dialog
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });
}

// ── App ──

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV !== 'production' && !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  registerIPC();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

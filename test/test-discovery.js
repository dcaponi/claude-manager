/**
 * test-discovery.js
 *
 * Validates that the new plugin discovery functions can read real data
 * from the Claude Code file system.
 *
 * Run with: node test/test-discovery.js
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// ── Replicate the constants from main.js ──
const GLOBAL_CLAUDE_DIR = path.join(os.homedir(), '.claude');
const GLOBAL_SKILLS_DIR = path.join(GLOBAL_CLAUDE_DIR, 'skills');
const GLOBAL_AGENTS_DIR = path.join(GLOBAL_CLAUDE_DIR, 'agents');
const GLOBAL_SETTINGS_PATH = path.join(GLOBAL_CLAUDE_DIR, 'settings.json');
const APP_CONFIG_PATH = path.join(GLOBAL_CLAUDE_DIR, 'claude-manager-config.json');
const INSTALLED_PLUGINS_PATH = path.join(GLOBAL_CLAUDE_DIR, 'plugins', 'installed_plugins.json');
const KNOWN_MARKETPLACES_PATH = path.join(GLOBAL_CLAUDE_DIR, 'plugins', 'known_marketplaces.json');
const MARKETPLACES_DIR = path.join(GLOBAL_CLAUDE_DIR, 'plugins', 'marketplaces');
const PLUGINS_CACHE_DIR = path.join(GLOBAL_CLAUDE_DIR, 'plugins', 'cache');

// ── Minimal stubs of functions from main.js needed for testing ──

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

function getAppConfig() {
  if (fs.existsSync(APP_CONFIG_PATH)) {
    try { return JSON.parse(fs.readFileSync(APP_CONFIG_PATH, 'utf-8')); } catch (e) {}
  }
  return {};
}

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

  let meta = {};
  const pluginJsonPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');
  if (fs.existsSync(pluginJsonPath)) {
    try { meta = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8')); } catch (e) {}
  }

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
  const commandsDir = path.join(pluginPath, 'commands');
  if (fs.existsSync(commandsDir)) {
    try {
      for (const f of fs.readdirSync(commandsDir).filter(n => n.endsWith('.md'))) {
        const id = f.replace('.md', '');
        if (skills.find(s => s.id === id)) continue;
        const filePath = path.join(commandsDir, f);
        const { meta: sm, body } = parseFrontmatter(fs.readFileSync(filePath, 'utf-8'));
        skills.push({ id, ...sm, body, filePath, legacy: true });
      }
    } catch (e) {}
  }

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

  let hooks = null;
  const hooksFile = path.join(pluginPath, 'hooks', 'hooks.json');
  if (fs.existsSync(hooksFile)) {
    try { hooks = JSON.parse(fs.readFileSync(hooksFile, 'utf-8')); } catch (e) {}
  }

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

  for (const [key, installations] of Object.entries(installedPlugins)) {
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const atIdx = key.lastIndexOf('@');
    const pluginName = atIdx > -1 ? key.slice(0, atIdx) : key;
    const marketplace = atIdx > -1 ? key.slice(atIdx + 1) : null;

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

  for (const [mpName, mpInfo] of Object.entries(knownMarketplaces)) {
    const mpPath = mpInfo.installLocation;
    const catalog = readMarketplaceCatalog(mpPath);
    if (!catalog || !Array.isArray(catalog.plugins)) continue;

    for (const plugin of catalog.plugins) {
      const pluginId = plugin.name;
      const pluginKey = `${pluginId}@${mpName}`;
      if (seenKeys.has(pluginKey)) continue;
      seenKeys.add(pluginKey);

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
        editable: ownedMarketplaces.has(mpName),
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

// ── Test helpers ──

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

function section(name) {
  console.log(`\n== ${name} ==`);
}

// ── Tests ──

section('File existence checks');
assert(fs.existsSync(INSTALLED_PLUGINS_PATH), `installed_plugins.json exists at ${INSTALLED_PLUGINS_PATH}`);
assert(fs.existsSync(GLOBAL_SETTINGS_PATH), `settings.json exists at ${GLOBAL_SETTINGS_PATH}`);
assert(fs.existsSync(KNOWN_MARKETPLACES_PATH), `known_marketplaces.json exists at ${KNOWN_MARKETPLACES_PATH}`);
assert(fs.existsSync(MARKETPLACES_DIR), `marketplaces dir exists at ${MARKETPLACES_DIR}`);
assert(fs.existsSync(PLUGINS_CACHE_DIR), `cache dir exists at ${PLUGINS_CACHE_DIR}`);

section('readInstalledPlugins()');
const installed = readInstalledPlugins();
assert(typeof installed === 'object', 'returns an object');
const installedKeys = Object.keys(installed);
assert(installedKeys.length > 0, `has at least one installed plugin (found ${installedKeys.length})`);
for (const key of installedKeys) {
  const atIdx = key.lastIndexOf('@');
  assert(atIdx > -1, `key "${key}" contains "@" separator`);
}
console.log(`  INFO: installed plugin keys: ${installedKeys.join(', ')}`);

section('readEnabledPlugins()');
const enabled = readEnabledPlugins();
assert(typeof enabled === 'object', 'returns an object');
const enabledKeys = Object.keys(enabled);
console.log(`  INFO: enabledPlugins keys: ${enabledKeys.join(', ')}`);

section('readKnownMarketplaces()');
const marketplaces = readKnownMarketplaces();
assert(typeof marketplaces === 'object', 'returns an object');
const mpKeys = Object.keys(marketplaces);
assert(mpKeys.length > 0, `has at least one marketplace (found ${mpKeys.length})`);
console.log(`  INFO: marketplace keys: ${mpKeys.join(', ')}`);
for (const [name, info] of Object.entries(marketplaces)) {
  assert(typeof info.installLocation === 'string', `marketplace "${name}" has installLocation`);
}

section('readMarketplaceCatalog()');
for (const [name, info] of Object.entries(marketplaces)) {
  const catalog = readMarketplaceCatalog(info.installLocation);
  if (catalog) {
    assert(typeof catalog === 'object', `marketplace "${name}" catalog is an object`);
    const hasPlugins = Array.isArray(catalog.plugins);
    assert(hasPlugins, `marketplace "${name}" catalog has plugins array (${hasPlugins ? catalog.plugins.length + ' plugins' : 'missing'})`);
    if (hasPlugins) {
      console.log(`  INFO: "${name}" catalog has ${catalog.plugins.length} plugins`);
    }
  } else {
    console.log(`  INFO: marketplace "${name}" has no .claude-plugin/marketplace.json (skipping)`);
  }
}

section('scanPluginContents()');
for (const [key, installations] of Object.entries(installed)) {
  const installList = Array.isArray(installations) ? installations : [installations];
  const userInstall = installList.find(i => i.scope === 'user') || installList[0];
  if (!userInstall || !userInstall.installPath) continue;

  const contents = scanPluginContents(userInstall.installPath);
  assert(Array.isArray(contents.skills), `plugin "${key}" scanPluginContents returns skills array`);
  assert(Array.isArray(contents.agents), `plugin "${key}" scanPluginContents returns agents array`);
  assert(typeof contents.meta === 'object', `plugin "${key}" scanPluginContents returns meta object`);
  console.log(`  INFO: "${key}" has ${contents.skills.length} skills, ${contents.agents.length} agents, hooks=${!!contents.hooks}, mcpServers=${Object.keys(contents.mcpServers).length}`);
  break; // test one as representative sample
}

section('listAllPlugins()');
const allPlugins = listAllPlugins(null);
assert(Array.isArray(allPlugins), 'returns an array');
assert(allPlugins.length > 0, `has at least one plugin entry (found ${allPlugins.length})`);

const installedEntries = allPlugins.filter(p => p.status === 'installed');
const availableEntries = allPlugins.filter(p => p.status === 'available');
const localEntry = allPlugins.find(p => p.status === 'local');

assert(installedEntries.length > 0, `has at least one installed entry (found ${installedEntries.length})`);
assert(availableEntries.length >= 0, `available entries count is a non-negative number (${availableEntries.length})`);

// Validate shape of installed entries
for (const p of installedEntries) {
  assert(typeof p.id === 'string', `installed plugin "${p.key}" has string id`);
  assert(typeof p.key === 'string', `installed plugin "${p.key}" has string key`);
  assert(p.key.includes('@'), `installed plugin "${p.key}" key contains "@"`);
  assert(typeof p.name === 'string', `installed plugin "${p.key}" has string name`);
  assert(p.status === 'installed', `installed plugin "${p.key}" has status "installed"`);
  assert(typeof p.enabled === 'boolean', `installed plugin "${p.key}" has boolean enabled`);
  assert(typeof p.editable === 'boolean', `installed plugin "${p.key}" has boolean editable`);
  assert(Array.isArray(p.skills), `installed plugin "${p.key}" has skills array`);
  assert(Array.isArray(p.agents), `installed plugin "${p.key}" has agents array`);
}

console.log(`\n  INFO: ${installedEntries.length} installed, ${availableEntries.length} available, local=${!!localEntry}`);
for (const p of installedEntries) {
  console.log(`    - [${p.status}] ${p.key} enabled=${p.enabled} skills=${p.skills.length} agents=${p.agents.length}`);
}

section('Summary');
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}

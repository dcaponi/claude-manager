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

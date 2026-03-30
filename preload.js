const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Plugins (unified)
  listAllPlugins: (projectPath) => ipcRenderer.invoke('plugins:listAll', projectPath),
  enablePlugin: (pluginKey) => ipcRenderer.invoke('plugins:enable', pluginKey),
  disablePlugin: (pluginKey) => ipcRenderer.invoke('plugins:disable', pluginKey),
  uninstallPlugin: (pluginKey) => ipcRenderer.invoke('plugins:uninstall', pluginKey),
  scaffoldPlugin: (name, meta, skills, agents) => ipcRenderer.invoke('plugins:scaffold', name, meta, skills, agents),
  addPluginToMarketplace: (mpName, pluginName, tempDir) => ipcRenderer.invoke('plugins:addToMarketplace', mpName, pluginName, tempDir),
  publishPlugin: (mpName, message) => ipcRenderer.invoke('plugins:publish', mpName, message),

  // Marketplaces
  listMarketplaces: () => ipcRenderer.invoke('marketplaces:list'),
  createMarketplace: (name, repo) => ipcRenderer.invoke('marketplaces:create', name, repo),
  removeMarketplace: (name) => ipcRenderer.invoke('marketplaces:remove', name),
  setMarketplaceOwned: (name, owned) => ipcRenderer.invoke('marketplaces:setOwned', name, owned),
  updateMarketplace: (name) => ipcRenderer.invoke('marketplaces:update', name),

  // Skills (local CRUD)
  saveSkill: (scope, projectPath, id, meta, body) => ipcRenderer.invoke('skills:save', scope, projectPath, id, meta, body),
  deleteSkill: (scope, projectPath, id) => ipcRenderer.invoke('skills:delete', scope, projectPath, id),

  // Agents (local CRUD)
  saveAgent: (scope, projectPath, id, meta, body) => ipcRenderer.invoke('agents:save', scope, projectPath, id, meta, body),
  deleteAgent: (scope, projectPath, id) => ipcRenderer.invoke('agents:delete', scope, projectPath, id),

  // MCP Servers
  listAllMcp: (projectPath) => ipcRenderer.invoke('mcp:listAll', projectPath),
  saveMcp: (scope, projectPath, id, config) => ipcRenderer.invoke('mcp:save', scope, projectPath, id, config),
  deleteMcp: (scope, projectPath, id) => ipcRenderer.invoke('mcp:delete', scope, projectPath, id),

  // Settings
  getSettings: (projectPath) => ipcRenderer.invoke('settings:get', projectPath),
  saveSettings: (scope, projectPath, settings) => ipcRenderer.invoke('settings:save', scope, projectPath, settings),

  // Chat
  chatSend: (message, projectPath) => ipcRenderer.invoke('chat:send', message, projectPath),

  // Claude CLI connection
  getClaudePath: () => ipcRenderer.invoke('claude:getPath'),
  setClaudePath: (p) => ipcRenderer.invoke('claude:setPath', p),
  testClaude: (customPath) => ipcRenderer.invoke('claude:test', customPath),

  // Dialog
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
});

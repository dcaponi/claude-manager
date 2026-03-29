const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Skills
  listSkills: (scope, projectPath) => ipcRenderer.invoke('skills:list', scope, projectPath),
  getSkill: (scope, projectPath, id) => ipcRenderer.invoke('skills:get', scope, projectPath, id),
  saveSkill: (scope, projectPath, id, meta, body) => ipcRenderer.invoke('skills:save', scope, projectPath, id, meta, body),
  deleteSkill: (scope, projectPath, id) => ipcRenderer.invoke('skills:delete', scope, projectPath, id),

  // Agents
  listAgents: (scope, projectPath) => ipcRenderer.invoke('agents:list', scope, projectPath),
  getAgent: (scope, projectPath, id) => ipcRenderer.invoke('agents:get', scope, projectPath, id),
  saveAgent: (scope, projectPath, id, meta, body) => ipcRenderer.invoke('agents:save', scope, projectPath, id, meta, body),
  deleteAgent: (scope, projectPath, id) => ipcRenderer.invoke('agents:delete', scope, projectPath, id),

  // Plugins
  listPlugins: (projectPath) => ipcRenderer.invoke('plugins:list', projectPath),

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

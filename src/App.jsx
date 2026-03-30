import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import PluginsView from './views/PluginsView.jsx';
import MarketplacesView from './views/MarketplacesView.jsx';
import McpView from './views/McpView.jsx';
import SettingsView from './views/SettingsView.jsx';
import ChatBubble from './components/ChatBubble.jsx';

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    background: 'var(--bg-primary)',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  titleBar: {
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 500,
    WebkitAppRegion: 'drag',
    paddingLeft: 80,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 32,
    WebkitAppRegion: 'no-drag',
  },
};

export default function App() {
  const [view, setView] = useState('plugins');
  const [projectPath, setProjectPath] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const handlePickProject = async () => {
    const dir = await window.api.openDirectory();
    if (dir) setProjectPath(dir);
  };

  const viewTitles = {
    plugins: 'Plugins',
    marketplaces: 'Marketplaces',
    mcp: 'MCP Servers',
    settings: 'Settings',
  };

  return (
    <div style={styles.container}>
      <Sidebar
        view={view}
        setView={setView}
        projectPath={projectPath}
        onPickProject={handlePickProject}
      />
      <div style={styles.main}>
        <div style={styles.titleBar}>
          Claude Manager — {viewTitles[view]}
        </div>
        <div style={styles.content}>
          {view === 'plugins' && (
            <PluginsView projectPath={projectPath} refreshKey={refreshKey} onRefresh={refresh} />
          )}
          {view === 'marketplaces' && (
            <MarketplacesView refreshKey={refreshKey} onRefresh={refresh} />
          )}
          {view === 'mcp' && (
            <McpView projectPath={projectPath} refreshKey={refreshKey} onRefresh={refresh} />
          )}
          {view === 'settings' && (
            <SettingsView projectPath={projectPath} />
          )}
        </div>
      </div>
      <ChatBubble projectPath={projectPath} onRefresh={refresh} currentView={view} />
    </div>
  );
}

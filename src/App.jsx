import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import SkillsView from './views/SkillsView.jsx';
import AgentsView from './views/AgentsView.jsx';
import PluginsView from './views/PluginsView.jsx';
import TeamsView from './views/TeamsView.jsx';
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
  const [view, setView] = useState('skills');
  const [scope, setScope] = useState('global');
  const [projectPath, setProjectPath] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const handlePickProject = async () => {
    const dir = await window.api.openDirectory();
    if (dir) setProjectPath(dir);
  };

  const viewTitles = {
    skills: 'Skills',
    agents: 'Agents',
    plugins: 'Plugins',
    teams: 'Agent Teams',
    settings: 'Settings',
  };

  return (
    <div style={styles.container}>
      <Sidebar
        view={view}
        setView={setView}
        scope={scope}
        setScope={setScope}
        projectPath={projectPath}
        onPickProject={handlePickProject}
      />
      <div style={styles.main}>
        <div style={styles.titleBar}>
          Claude Manager — {viewTitles[view]} ({scope === 'global' ? 'Global' : projectPath || 'No Project'})
        </div>
        <div style={styles.content}>
          {view === 'skills' && (
            <SkillsView scope={scope} projectPath={projectPath} refreshKey={refreshKey} onRefresh={refresh} />
          )}
          {view === 'agents' && (
            <AgentsView scope={scope} projectPath={projectPath} refreshKey={refreshKey} onRefresh={refresh} />
          )}
          {view === 'plugins' && (
            <PluginsView projectPath={projectPath} refreshKey={refreshKey} />
          )}
          {view === 'teams' && (
            <TeamsView scope={scope} projectPath={projectPath} refreshKey={refreshKey} onRefresh={refresh} />
          )}
          {view === 'settings' && (
            <SettingsView projectPath={projectPath} />
          )}
        </div>
      </div>
      <ChatBubble scope={scope} projectPath={projectPath} onRefresh={refresh} currentView={view} />
    </div>
  );
}

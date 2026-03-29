import React from 'react';

const styles = {
  sidebar: {
    width: 240,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    WebkitAppRegion: 'no-drag',
  },
  logo: {
    padding: '24px 20px 16px',
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-0.3px',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingTop: 46,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
  },
  section: {
    padding: '8px 12px',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
    padding: '12px 8px 6px',
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'var(--accent-light)' : 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  }),
  scopeToggle: {
    display: 'flex',
    margin: '0 12px',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    border: '1px solid var(--border)',
  },
  scopeBtn: (active) => ({
    flex: 1,
    padding: '6px 0',
    fontSize: 11,
    fontWeight: 600,
    textAlign: 'center',
    cursor: 'pointer',
    border: 'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.15s',
  }),
  projectPath: {
    margin: '8px 12px',
    padding: '8px 10px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    fontSize: 11,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  spacer: { flex: 1 },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid var(--border)',
    fontSize: 11,
    color: 'var(--text-muted)',
  },
};

const NAV = [
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'agents', label: 'Agents', icon: '🤖' },
  { id: 'mcp', label: 'MCP Servers', icon: '🔌' },
  { id: 'plugins', label: 'Plugins', icon: '🧩' },
  { id: 'teams', label: 'Agent Teams', icon: '👥' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ view, setView, scope, setScope, projectPath, onPickProject }) {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>C</div>
        Claude Manager
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Scope</div>
        <div style={styles.scopeToggle}>
          <button style={styles.scopeBtn(scope === 'global')} onClick={() => setScope('global')}>
            Global
          </button>
          <button style={styles.scopeBtn(scope === 'project')} onClick={() => setScope('project')}>
            Project
          </button>
        </div>
        {scope === 'project' && (
          <div style={styles.projectPath} onClick={onPickProject} title={projectPath || 'Click to select project'}>
            📁 {projectPath ? projectPath.split('/').pop() : 'Select project...'}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Components</div>
        {NAV.map(item => (
          <button
            key={item.id}
            style={styles.navItem(view === item.id)}
            onClick={() => setView(item.id)}
            onMouseEnter={e => {
              if (view !== item.id) e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={e => {
              if (view !== item.id) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div style={styles.spacer} />
      <div style={styles.footer}>
        Claude Code Extension Manager
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 },
  section: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: 'var(--accent)',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: 14,
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  checkboxHint: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
  },
  saveBtn: {
    padding: '10px 24px',
    borderRadius: 'var(--radius)',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  statusBadge: (active) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: active ? 'rgba(87,171,90,0.15)' : 'var(--bg-tertiary)',
    color: active ? 'var(--success)' : 'var(--text-muted)',
    border: `1px solid ${active ? 'rgba(87,171,90,0.3)' : 'var(--border)'}`,
  }),
  dot: (active) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: active ? 'var(--success)' : 'var(--text-muted)',
  }),
  infoBox: {
    padding: '16px 20px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  infoItem: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    padding: '4px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  infoBullet: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--accent)',
    flexShrink: 0,
  },
  savedMsg: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
    fontSize: 13,
    color: 'var(--success)',
    fontWeight: 500,
  },
};

export default function TeamsView({ scope, projectPath, refreshKey, onRefresh }) {
  const [settings, setSettings] = useState({ global: {}, project: {} });
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [teammateMode, setTeammateMode] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSettings(); }, [scope, projectPath, refreshKey]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await window.api.getSettings(projectPath);
      setSettings(result);
      const s = scope === 'global' ? result.global : result.project;
      const env = s.env || {};
      setTeamsEnabled(env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === '1');
      setTeammateMode(s.teammateMode || '');
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const current = scope === 'global' ? { ...settings.global } : { ...settings.project };
    if (!current.env) current.env = {};

    if (teamsEnabled) {
      current.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
    } else {
      delete current.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
    }

    if (teammateMode) {
      current.teammateMode = teammateMode;
    } else {
      delete current.teammateMode;
    }

    // Clean up empty env
    if (Object.keys(current.env).length === 0) delete current.env;

    await window.api.saveSettings(scope, projectPath, current);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onRefresh();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Agent Teams</div>
          <div style={styles.subtitle}>
            Experimental multi-agent collaboration — configure in {scope === 'global' ? '~/.claude/' : '.claude/'}settings.json
          </div>
        </div>
        <div style={styles.statusBadge(teamsEnabled)}>
          <div style={styles.dot(teamsEnabled)} />
          {teamsEnabled ? 'Teams Enabled' : 'Teams Disabled'}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Enable Agent Teams</div>
        <div style={styles.sectionDesc}>
          Agent teams allow multiple Claude instances to work together on tasks, sharing a task board and communicating laterally.
        </div>

        <div style={styles.fieldGroup}>
          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={teamsEnabled}
              onChange={e => setTeamsEnabled(e.target.checked)}
            />
            <div>
              <div style={styles.checkboxLabel}>Enable CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS</div>
              <div style={styles.checkboxHint}>
                Sets the environment variable to "1" in {scope} settings. This is an experimental feature.
              </div>
            </div>
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Teammate Display Mode</label>
          <select
            style={styles.select}
            value={teammateMode}
            onChange={e => setTeammateMode(e.target.value)}
          >
            <option value="">Default (in-process, cycle with Shift+Down)</option>
            <option value="tmux">tmux (split panes, each teammate in own pane)</option>
          </select>
        </div>

        <div>
          <button
            style={styles.saveBtn}
            onClick={handleSave}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            Save Settings
          </button>
          {saved && <span style={styles.savedMsg}>✓ Saved</span>}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>How Agent Teams Work</div>
        <div style={styles.infoBox}>
          <div style={styles.infoTitle}>Architecture</div>
          <ul style={styles.infoList}>
            <li style={styles.infoItem}><div style={styles.infoBullet} /> <strong>Lead</strong> — The main session that orchestrates work and creates tasks</li>
            <li style={styles.infoItem}><div style={styles.infoBullet} /> <strong>Teammates</strong> — Independent Claude instances that claim and work on tasks</li>
            <li style={styles.infoItem}><div style={styles.infoBullet} /> <strong>Task Board</strong> — Shared task list visible to all team members</li>
            <li style={styles.infoItem}><div style={styles.infoBullet} /> <strong>Messaging</strong> — Teammates can message each other directly (unlike subagents)</li>
          </ul>
        </div>

        <div style={{ ...styles.infoBox, marginTop: 12 }}>
          <div style={styles.infoTitle}>Capabilities</div>
          <ul style={styles.infoList}>
            <li style={styles.infoItem}><div style={styles.infoBullet} /> Claim tasks from the shared board</li>
            <li style={styles.infoItem}><div style={styles.infoBullet} /> Message teammates directly for coordination</li>
            <li style={styles.infoItem}><div style={styles.infoBullet} /> Work in parallel on independent tasks</li>
            <li style={styles.infoItem}><div style={styles.infoBullet} /> Each teammate runs as a full Claude Code instance</li>
          </ul>
        </div>

        <div style={{ ...styles.infoBox, marginTop: 12 }}>
          <div style={styles.infoTitle}>Display Modes</div>
          <ul style={styles.infoList}>
            <li style={styles.infoItem}><div style={styles.infoBullet} /> <strong>In-process</strong> — Multiple instances in one terminal; cycle with Shift+Down</li>
            <li style={styles.infoItem}><div style={styles.infoBullet} /> <strong>tmux</strong> — Each teammate gets its own tmux pane for visual separation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

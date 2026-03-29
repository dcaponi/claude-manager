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
  sectionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  inputRow: {
    display: 'flex',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'SF Mono, Consolas, monospace',
    outline: 'none',
  },
  btn: (variant) => ({
    padding: '8px 16px',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s',
    ...(variant === 'primary' ? {
      background: 'var(--accent)',
      color: '#fff',
    } : {
      background: 'var(--bg-tertiary)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border)',
    }),
  }),
  statusBox: (ok) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    background: ok === true ? 'rgba(87,171,90,0.1)' : ok === false ? 'rgba(229,83,75,0.1)' : 'var(--bg-tertiary)',
    border: `1px solid ${ok === true ? 'rgba(87,171,90,0.3)' : ok === false ? 'rgba(229,83,75,0.3)' : 'var(--border)'}`,
    marginTop: 12,
  }),
  statusDot: (ok) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: ok === true ? 'var(--success)' : ok === false ? 'var(--danger)' : 'var(--text-muted)',
    flexShrink: 0,
  }),
  statusText: {
    fontSize: 13,
    color: 'var(--text-primary)',
  },
  statusDetail: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  pathsGrid: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gap: '8px 12px',
    marginTop: 12,
  },
  pathLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  pathValue: {
    fontSize: 12,
    fontFamily: 'SF Mono, Consolas, monospace',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  hint: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 6,
  },
};

export default function SettingsView({ projectPath }) {
  const [claudePath, setClaudePath] = useState('');
  const [status, setStatus] = useState(null); // null = untested, true = ok, false = failed
  const [statusMsg, setStatusMsg] = useState('');
  const [version, setVersion] = useState('');
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSavedPath();
    testConnection();
  }, []);

  const loadSavedPath = async () => {
    try {
      const result = await window.api.getClaudePath();
      if (result) setClaudePath(result);
    } catch (e) {}
  };

  const testConnection = async (customPath) => {
    setTesting(true);
    try {
      const result = await window.api.testClaude(customPath || undefined);
      if (result.ok) {
        setStatus(true);
        setVersion(result.version);
        setStatusMsg(`Connected — Claude Code ${result.version}`);
      } else {
        setStatus(false);
        setStatusMsg(result.error);
      }
    } catch (e) {
      setStatus(false);
      setStatusMsg(e.message);
    }
    setTesting(false);
  };

  const handleSave = async () => {
    await window.api.setClaudePath(claudePath.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    testConnection(claudePath.trim());
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Settings</div>
          <div style={styles.subtitle}>Configure your Claude Code connection and app preferences</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Claude Code Connection</div>
        <div style={styles.sectionDesc}>
          The app uses the Claude Code CLI for the chat assistant. Verify your connection below.
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Claude CLI Path (optional override)</label>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              value={claudePath}
              onChange={e => setClaudePath(e.target.value)}
              placeholder="Leave blank for auto-detect (e.g. ~/.local/bin/claude)"
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              style={styles.btn('primary')}
              onClick={handleSave}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
          <div style={styles.hint}>
            Only set this if auto-detection doesn't find your Claude CLI. Common paths: ~/.local/bin/claude, /usr/local/bin/claude
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <button
            style={styles.btn(testing ? 'secondary' : 'primary')}
            onClick={() => testConnection(claudePath.trim())}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          <div style={styles.statusBox(status)}>
            <div style={styles.statusDot(status)} />
            <div>
              <div style={styles.statusText}>
                {status === null ? 'Not tested yet' : status ? 'Connected' : 'Connection Failed'}
              </div>
              <div style={styles.statusDetail}>{statusMsg}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Detected Paths</div>
        <div style={styles.sectionDesc}>
          Where Claude Manager reads and writes component files.
        </div>
        <div style={styles.pathsGrid}>
          <div style={styles.pathLabel}>Global Config</div>
          <div style={styles.pathValue}>~/.claude/</div>
          <div style={styles.pathLabel}>Global Skills</div>
          <div style={styles.pathValue}>~/.claude/skills/</div>
          <div style={styles.pathLabel}>Global Agents</div>
          <div style={styles.pathValue}>~/.claude/agents/</div>
          <div style={styles.pathLabel}>Global Settings</div>
          <div style={styles.pathValue}>~/.claude/settings.json</div>
          {projectPath && (
            <>
              <div style={styles.pathLabel}>Project Skills</div>
              <div style={styles.pathValue}>{projectPath}/.claude/skills/</div>
              <div style={styles.pathLabel}>Project Agents</div>
              <div style={styles.pathValue}>{projectPath}/.claude/agents/</div>
              <div style={styles.pathLabel}>Project Settings</div>
              <div style={styles.pathValue}>{projectPath}/.claude/settings.json</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

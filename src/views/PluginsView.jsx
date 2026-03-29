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
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  empty: { textAlign: 'center', padding: 60, color: 'var(--text-muted)' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, marginBottom: 8 },
  emptyHint: { fontSize: 12, color: 'var(--text-muted)' },
  card: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    transition: 'border-color 0.15s',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    cursor: 'pointer',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'var(--tag-orange)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  desc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginTop: 2,
  },
  tags: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
    marginLeft: 12,
  },
  tag: (bg, color) => ({
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    background: bg,
    color: color,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }),
  expandIcon: (expanded) => ({
    fontSize: 10,
    color: 'var(--text-muted)',
    transition: 'transform 0.2s',
    transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
    marginLeft: 8,
    flexShrink: 0,
  }),
  content: (expanded) => ({
    maxHeight: expanded ? 2000 : 0,
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
  }),
  contentInner: {
    padding: '0 20px 16px',
    borderTop: '1px solid var(--border)',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: 12,
    marginBottom: 6,
  },
  skillCard: {
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  skillDesc: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginTop: 2,
  },
  skillBody: {
    fontSize: 11,
    fontFamily: 'SF Mono, Consolas, monospace',
    color: 'var(--text-muted)',
    marginTop: 6,
    padding: '6px 10px',
    background: 'var(--bg-primary)',
    borderRadius: 4,
    maxHeight: 100,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
  },
  pathInfo: {
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    fontSize: 11,
    fontFamily: 'SF Mono, Consolas, monospace',
    color: 'var(--text-muted)',
  },
  installHint: {
    marginTop: 20,
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
  },
  installTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  installCode: {
    padding: '8px 12px',
    borderRadius: 4,
    background: 'var(--bg-primary)',
    fontSize: 12,
    fontFamily: 'SF Mono, Consolas, monospace',
    color: 'var(--tag-blue-text)',
    marginTop: 4,
  },
};

export default function PluginsView({ projectPath, refreshKey }) {
  const [plugins, setPlugins] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPlugins(); }, [projectPath, refreshKey]);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const result = await window.api.listPlugins(projectPath);
      setPlugins(result || []);
    } catch (e) {
      console.error('Failed to load plugins:', e);
      setPlugins([]);
    }
    setLoading(false);
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Plugins</div>
          <div style={styles.subtitle}>
            Installed Claude Code plugins with bundled skills, agents, and hooks
          </div>
        </div>
      </div>

      {loading ? (
        <div style={styles.empty}><div>Loading...</div></div>
      ) : plugins.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🧩</div>
          <div style={styles.emptyText}>No plugins found</div>
          <div style={styles.emptyHint}>Install plugins via the Claude Code CLI</div>
        </div>
      ) : (
        <div style={styles.list}>
          {plugins.map(plugin => (
            <div
              key={plugin.id}
              style={styles.card}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={styles.cardHeader} onClick={() => toggleExpand(plugin.id)}>
                <div style={styles.headerLeft}>
                  <div style={styles.icon}>🧩</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.name}>{plugin.name || plugin.id}</div>
                    <div style={styles.desc}>{plugin.description || `Source: ${plugin.source}`}</div>
                  </div>
                </div>
                <div style={styles.tags}>
                  <span style={styles.tag(
                    plugin.scope === 'global' ? 'var(--tag-blue)' : 'var(--tag-green)',
                    plugin.scope === 'global' ? 'var(--tag-blue-text)' : 'var(--tag-green-text)'
                  )}>
                    {plugin.scope}
                  </span>
                  <span style={styles.tag(
                    plugin.enabled ? 'var(--tag-green)' : 'var(--tag-orange)',
                    plugin.enabled ? 'var(--tag-green-text)' : 'var(--tag-orange-text)'
                  )}>
                    {plugin.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <span style={styles.expandIcon(expanded[plugin.id])}>▼</span>
              </div>

              <div style={styles.content(expanded[plugin.id])}>
                <div style={styles.contentInner}>
                  {plugin.dirPath && (
                    <>
                      <div style={styles.sectionLabel}>Directory</div>
                      <div style={styles.pathInfo}>{plugin.dirPath}</div>
                    </>
                  )}

                  {plugin.skills && plugin.skills.length > 0 && (
                    <>
                      <div style={styles.sectionLabel}>Plugin Skills ({plugin.skills.length})</div>
                      {plugin.skills.map(skill => (
                        <div key={skill.id} style={styles.skillCard}>
                          <div style={styles.skillName}>
                            {plugin.id}:{skill.id}
                          </div>
                          <div style={styles.skillDesc}>{skill.description || 'No description'}</div>
                          {skill.body && <div style={styles.skillBody}>{skill.body}</div>}
                        </div>
                      ))}
                    </>
                  )}

                  {plugin.meta && Object.keys(plugin.meta).length > 0 && (
                    <>
                      <div style={styles.sectionLabel}>Plugin Config</div>
                      <div style={styles.pathInfo}>{JSON.stringify(plugin.meta, null, 2)}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.installHint}>
        <div style={styles.installTitle}>Installing Plugins</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Use the Claude Code CLI to install plugins:
        </div>
        <div style={styles.installCode}>/plugin install plugin-name@source</div>
        <div style={{ ...styles.installCode, marginTop: 6 }}>/plugin marketplace add https://github.com/org/repo.git</div>
      </div>
    </div>
  );
}

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
  createBtn: {
    padding: '10px 20px',
    borderRadius: 'var(--radius)',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s',
  },
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
    background: 'rgba(56,139,253,0.13)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  name: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  desc: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
  tags: { display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 },
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
  actions: { display: 'flex', gap: 4, marginLeft: 12, flexShrink: 0 },
  actionBtn: (variant) => ({
    padding: '5px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.15s',
    background: 'transparent',
    borderColor: variant === 'delete' ? 'var(--danger)' : 'var(--accent)',
    color: variant === 'delete' ? 'var(--danger)' : 'var(--accent)',
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
    maxHeight: expanded ? 1000 : 0,
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
  codeBlock: {
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    fontSize: 12,
    fontFamily: 'SF Mono, Consolas, monospace',
    color: 'var(--text-secondary)',
    whiteSpace: 'pre-wrap',
  },
  envGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: 4,
    marginTop: 4,
  },
  envKey: {
    padding: '4px 8px',
    borderRadius: 4,
    background: 'var(--bg-tertiary)',
    fontSize: 11,
    fontFamily: 'SF Mono, Consolas, monospace',
    fontWeight: 600,
    color: 'var(--tag-blue-text)',
  },
  envVal: {
    padding: '4px 8px',
    borderRadius: 4,
    background: 'var(--bg-tertiary)',
    fontSize: 11,
    fontFamily: 'SF Mono, Consolas, monospace',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  // Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    width: 600,
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: { fontSize: 16, fontWeight: 700 },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
  },
  modalBody: { padding: 24, overflow: 'auto', flex: 1 },
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
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
  },
  hint: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4 },
  typeToggle: {
    display: 'flex',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    marginBottom: 16,
  },
  typeBtn: (active) => ({
    flex: 1,
    padding: '8px 0',
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'center',
    cursor: 'pointer',
    border: 'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.15s',
  }),
  envRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 6,
  },
  envInput: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: 'SF Mono, Consolas, monospace',
    outline: 'none',
  },
  removeEnvBtn: {
    padding: '6px 10px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--danger)',
    background: 'transparent',
    color: 'var(--danger)',
    fontSize: 12,
    cursor: 'pointer',
  },
  addEnvBtn: {
    padding: '6px 14px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    marginTop: 4,
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
  },
  btn: (variant) => ({
    padding: '8px 20px',
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
};

function McpEditorModal({ item, onSave, onClose }) {
  const isEditing = !!item;
  const [id, setId] = useState(item?.id || '');
  const [type, setType] = useState(item?.type || 'stdio');
  const [command, setCommand] = useState(item?.command || '');
  const [args, setArgs] = useState(item?.args?.join(' ') || '');
  const [url, setUrl] = useState(item?.url || '');
  const [envPairs, setEnvPairs] = useState(() => {
    const env = item?.env || {};
    const pairs = Object.entries(env).map(([k, v]) => ({ key: k, value: v }));
    return pairs.length > 0 ? pairs : [{ key: '', value: '' }];
  });

  const addEnv = () => setEnvPairs(prev => [...prev, { key: '', value: '' }]);
  const removeEnv = (idx) => setEnvPairs(prev => prev.filter((_, i) => i !== idx));
  const updateEnv = (idx, field, val) => {
    setEnvPairs(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const handleSave = () => {
    if (!id.trim()) return;
    const cleanId = id.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const env = {};
    envPairs.forEach(p => {
      if (p.key.trim()) env[p.key.trim()] = p.value;
    });
    const config = {
      type,
      command: type === 'stdio' ? command : '',
      args: type === 'stdio' ? args.split(/\s+/).filter(Boolean) : [],
      url: type === 'sse' ? url : '',
      env,
    };
    onSave(cleanId, config);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>{isEditing ? 'Edit' : 'Add'} MCP Server</div>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Server Name / ID</label>
            <input
              style={styles.input}
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="censys, filesystem, github, etc."
              disabled={isEditing}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={styles.hint}>This is how you reference this server in skills and Claude Code.</div>
          </div>

          <div style={styles.typeToggle}>
            <button style={styles.typeBtn(type === 'stdio')} onClick={() => setType('stdio')}>
              stdio (local command)
            </button>
            <button style={styles.typeBtn(type === 'sse')} onClick={() => setType('sse')}>
              SSE (remote URL)
            </button>
          </div>

          {type === 'stdio' ? (
            <>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Command</label>
                <input
                  style={styles.input}
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  placeholder="npx, node, python, docker, etc."
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div style={styles.hint}>The executable to run. Usually npx, node, python, or a binary path.</div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Arguments</label>
                <input
                  style={styles.input}
                  value={args}
                  onChange={e => setArgs(e.target.value)}
                  placeholder="-y @censys/mcp-server"
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div style={styles.hint}>Space-separated arguments passed to the command.</div>
              </div>
            </>
          ) : (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Server URL</label>
              <input
                style={styles.input}
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://mcp.example.com/sse"
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={styles.hint}>The SSE endpoint URL for the remote MCP server.</div>
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Environment Variables</label>
            {envPairs.map((pair, idx) => (
              <div key={idx} style={styles.envRow}>
                <input
                  style={styles.envInput}
                  value={pair.key}
                  onChange={e => updateEnv(idx, 'key', e.target.value)}
                  placeholder="CENSYS_API_KEY"
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <input
                  style={styles.envInput}
                  value={pair.value}
                  onChange={e => updateEnv(idx, 'value', e.target.value)}
                  placeholder="your-api-key-here"
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                {envPairs.length > 1 && (
                  <button style={styles.removeEnvBtn} onClick={() => removeEnv(idx)}>x</button>
                )}
              </div>
            ))}
            <button style={styles.addEnvBtn} onClick={addEnv}>+ Add Variable</button>
            <div style={styles.hint}>API keys and secrets the MCP server needs. These are passed as environment variables.</div>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.btn('secondary')} onClick={onClose}>Cancel</button>
          <button
            style={styles.btn('primary')}
            onClick={handleSave}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            {isEditing ? 'Save Changes' : 'Add Server'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function McpView({ projectPath, refreshKey, onRefresh }) {
  const [servers, setServers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadServers(); }, [projectPath, refreshKey]);

  const loadServers = async () => {
    setLoading(true);
    try {
      const result = await window.api.listAllMcp(projectPath);
      setServers(result || []);
    } catch (e) {
      console.error('Failed to load MCP servers:', e);
      setServers([]);
    }
    setLoading(false);
  };

  const handleSave = async (id, config) => {
    const scope = editing?.item?.source === 'project' ? 'project' : 'global';
    await window.api.saveMcp(scope, projectPath, id, config);
    setEditing(null);
    loadServers();
    onRefresh();
  };

  const handleDelete = async (server) => {
    if (!confirm(`Remove MCP server "${server.id}"?`)) return;
    const scope = server.source === 'project' ? 'project' : 'global';
    await window.api.deleteMcp(scope, projectPath, server.id);
    loadServers();
    onRefresh();
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>MCP Servers</div>
          <div style={styles.subtitle}>
            All Model Context Protocol connections — global, project, and plugin-bundled
          </div>
        </div>
        <button
          style={styles.createBtn}
          onClick={() => setEditing({})}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          + Add Server
        </button>
      </div>

      {loading ? (
        <div style={styles.empty}><div>Loading...</div></div>
      ) : servers.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🔌</div>
          <div style={styles.emptyText}>No MCP servers configured</div>
          <div style={styles.emptyHint}>
            Add an MCP server to give Claude Code access to external tools and APIs.
            <br />For example: Censys, GitHub, filesystem, databases, Slack, and more.
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {servers.map(server => (
            <div
              key={server.id}
              style={styles.card}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={styles.cardHeader} onClick={() => toggleExpand(server.id)}>
                <div style={styles.headerLeft}>
                  <div style={styles.icon}>🔌</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.name}>{server.id}</div>
                    <div style={styles.desc}>
                      {server.type === 'sse' ? server.url : `${server.command} ${(server.args || []).join(' ')}`}
                    </div>
                  </div>
                </div>
                <div style={styles.tags}>
                  <span style={styles.tag(
                    server.scope === 'global' ? 'var(--tag-blue)' : 'var(--tag-green)',
                    server.scope === 'global' ? 'var(--tag-blue-text)' : 'var(--tag-green-text)'
                  )}>
                    {server.sourceLabel || server.scope}
                  </span>
                  <span style={styles.tag(
                    server.type === 'sse' ? 'var(--tag-orange)' : 'var(--tag-blue)',
                    server.type === 'sse' ? 'var(--tag-orange-text)' : 'var(--tag-blue-text)'
                  )}>
                    {server.type}
                  </span>
                </div>
                {server.editable !== false && (
                  <div style={styles.actions}>
                    <button
                      style={styles.actionBtn('edit')}
                      onClick={e => { e.stopPropagation(); setEditing({ item: server }); }}
                    >
                      Edit
                    </button>
                    <button
                      style={styles.actionBtn('delete')}
                      onClick={e => { e.stopPropagation(); handleDelete(server); }}
                    >
                      Delete
                    </button>
                  </div>
                )}
                <span style={styles.expandIcon(expanded[server.id])}>▼</span>
              </div>

              <div style={styles.content(expanded[server.id])}>
                <div style={styles.contentInner}>
                  {server.type === 'stdio' && (
                    <>
                      <div style={styles.sectionLabel}>Command</div>
                      <div style={styles.codeBlock}>
                        {server.command} {(server.args || []).join(' ')}
                      </div>
                    </>
                  )}
                  {server.type === 'sse' && (
                    <>
                      <div style={styles.sectionLabel}>URL</div>
                      <div style={styles.codeBlock}>{server.url}</div>
                    </>
                  )}

                  {server.env && Object.keys(server.env).length > 0 && (
                    <>
                      <div style={styles.sectionLabel}>Environment Variables</div>
                      <div style={styles.envGrid}>
                        {Object.entries(server.env).map(([k, v]) => (
                          <React.Fragment key={k}>
                            <div style={styles.envKey}>{k}</div>
                            <div style={styles.envVal}>
                              {v.length > 8 ? v.slice(0, 4) + '...' + v.slice(-4) : v}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </>
                  )}

                  <div style={styles.sectionLabel}>Config File</div>
                  <div style={styles.codeBlock}>{server.filePath}</div>

                  <div style={styles.sectionLabel}>Usage in Skills</div>
                  <div style={{ ...styles.codeBlock, color: 'var(--tag-green-text)' }}>
                    Reference this MCP server in a skill prompt to give Claude access to its tools.
                    {'\n'}The server "{server.id}" will be available when Claude Code runs in this scope.
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <McpEditorModal
          item={editing.item || null}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

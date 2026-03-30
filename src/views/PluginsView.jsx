import React, { useState, useEffect } from 'react';
import EditorModal from '../components/EditorModal.jsx';

const SKILL_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', placeholder: 'Deploy to Production' },
  { key: 'description', label: 'Description', type: 'text', placeholder: 'Description' },
  {
    key: 'disable-model-invocation',
    label: 'Invocation Control',
    type: 'checkbox',
    checkboxLabel: 'Disable model invocation',
    hint: 'When checked, only users can invoke via slash command',
  },
];

const AGENT_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', placeholder: 'DB Optimizer' },
  { key: 'description', label: 'Description', type: 'text', placeholder: 'Description' },
  { key: 'tools', label: 'Allowed Tools', type: 'text', placeholder: 'Read, Grep, Glob, Bash' },
  {
    key: 'model',
    label: 'Model',
    type: 'select',
    options: [
      { value: 'opus', label: 'Opus' },
      { value: 'sonnet', label: 'Sonnet' },
      { value: 'haiku', label: 'Haiku' },
    ],
  },
];

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
  controlsRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: 180,
    padding: '8px 14px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
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
    gap: 12,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  pluginIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'var(--tag-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  pluginName: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  pluginDesc: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
  tags: { display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' },
  tag: (bg, color) => ({
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    background: bg,
    color: color,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  }),
  cardActions: {
    display: 'flex',
    gap: 6,
    padding: '0 20px 12px',
    borderTop: 'none',
  },
  actionBtn: (variant) => ({
    padding: '5px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.15s',
    background: 'transparent',
    borderColor: variant === 'danger' ? 'var(--danger)' : variant === 'primary' ? 'var(--accent)' : 'var(--border)',
    color: variant === 'danger' ? 'var(--danger)' : variant === 'primary' ? 'var(--accent)' : 'var(--text-secondary)',
  }),
  expandIcon: (expanded) => ({
    fontSize: 10,
    color: 'var(--text-muted)',
    transition: 'transform 0.2s',
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
    flexShrink: 0,
  }),
  expandedContent: (expanded) => ({
    maxHeight: expanded ? 3000 : 0,
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
  }),
  expandedInner: {
    borderTop: '1px solid var(--border)',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    padding: '0 20px',
    gap: 4,
  },
  tab: (active) => ({
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: active ? 'var(--accent)' : 'transparent',
    transition: 'all 0.15s',
    marginBottom: -1,
  }),
  tabContent: {
    padding: '16px 20px',
  },
  itemRow: {
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    marginBottom: 8,
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  itemRowHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  itemDesc: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 },
  itemBody: {
    fontSize: 11,
    fontFamily: 'SF Mono, Consolas, monospace',
    color: 'var(--text-muted)',
    marginTop: 8,
    padding: '8px 10px',
    background: 'var(--bg-primary)',
    borderRadius: 4,
    maxHeight: 120,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
  },
  itemActions: {
    display: 'flex',
    gap: 4,
    flexShrink: 0,
  },
  smallBtn: (variant) => ({
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid',
    background: 'transparent',
    borderColor: variant === 'danger' ? 'var(--danger)' : 'var(--accent)',
    color: variant === 'danger' ? 'var(--danger)' : 'var(--accent)',
    transition: 'all 0.15s',
  }),
  countBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  emptyTab: {
    textAlign: 'center',
    padding: '24px 0',
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 8,
  },
};

function PluginItemRow({ item, isLocal, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={styles.itemRow}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={styles.itemRowHeader} onClick={() => setExpanded(v => !v)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.itemName}>{item.name || item.id}</div>
          {item.description && <div style={styles.itemDesc}>{item.description}</div>}
        </div>
        <div style={styles.itemActions} onClick={e => e.stopPropagation()}>
          {isLocal && onEdit && (
            <button style={styles.smallBtn('edit')} onClick={onEdit}>Edit</button>
          )}
          {isLocal && onDelete && (
            <button style={styles.smallBtn('danger')} onClick={onDelete}>Delete</button>
          )}
        </div>
        <span style={styles.expandIcon(expanded)}>▼</span>
      </div>
      {expanded && item.body && (
        <div style={styles.itemBody}>{item.body}</div>
      )}
    </div>
  );
}

function PluginCard({ plugin, projectPath, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('skills');
  const [editing, setEditing] = useState(null); // { type: 'skill'|'agent', item: {} | null }
  const [acting, setActing] = useState(false);

  const isInstalled = plugin.status === 'installed' || plugin.installed;
  const isLocal = plugin.source === 'local' || plugin.isLocal;

  const counts = {
    skills: (plugin.skills || []).length,
    agents: (plugin.agents || []).length,
    mcp: (plugin.mcpServers || []).length,
    hooks: (plugin.hooks || []).length,
  };

  const handleEnable = async (e) => {
    e.stopPropagation();
    setActing(true);
    try { await window.api.enablePlugin(plugin.key || plugin.id); onRefresh(); }
    catch (err) { console.error(err); }
    setActing(false);
  };

  const handleDisable = async (e) => {
    e.stopPropagation();
    setActing(true);
    try { await window.api.disablePlugin(plugin.key || plugin.id); onRefresh(); }
    catch (err) { console.error(err); }
    setActing(false);
  };

  const handleUninstall = async (e) => {
    e.stopPropagation();
    if (!confirm(`Uninstall plugin "${plugin.name || plugin.id}"?`)) return;
    setActing(true);
    try { await window.api.uninstallPlugin(plugin.key || plugin.id); onRefresh(); }
    catch (err) { console.error(err); }
    setActing(false);
  };

  const handleSaveSkill = async (id, meta, body) => {
    await window.api.saveSkill('global', projectPath, id, meta, body);
    setEditing(null);
    onRefresh();
  };

  const handleSaveAgent = async (id, meta, body) => {
    await window.api.saveAgent('global', projectPath, id, meta, body);
    setEditing(null);
    onRefresh();
  };

  const handleDeleteSkill = async (item) => {
    if (!confirm(`Delete skill "${item.name || item.id}"?`)) return;
    await window.api.deleteSkill('global', projectPath, item.id);
    onRefresh();
  };

  const handleDeleteAgent = async (item) => {
    if (!confirm(`Delete agent "${item.name || item.id}"?`)) return;
    await window.api.deleteAgent('global', projectPath, item.id);
    onRefresh();
  };

  const statusColor = isInstalled
    ? (plugin.enabled ? ['var(--tag-green)', 'var(--tag-green-text)'] : ['var(--tag-orange)', 'var(--tag-orange-text)'])
    : ['var(--bg-tertiary)', 'var(--text-muted)'];

  const statusLabel = isInstalled ? (plugin.enabled ? 'Enabled' : 'Disabled') : 'Available';

  return (
    <>
      <div
        style={styles.card}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={styles.cardHeader} onClick={() => setExpanded(v => !v)}>
          <div style={styles.headerLeft}>
            <div style={styles.pluginIcon}>🧩</div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.pluginName}>{plugin.name || plugin.id}</div>
              <div style={styles.pluginDesc}>{plugin.description || plugin.source || ''}</div>
            </div>
          </div>

          <div style={styles.tags}>
            {counts.skills > 0 && (
              <span style={styles.countBadge}>⚡ {counts.skills}</span>
            )}
            {counts.agents > 0 && (
              <span style={styles.countBadge}>🤖 {counts.agents}</span>
            )}
            {plugin.marketplace && (
              <span style={styles.tag('var(--tag-blue)', 'var(--tag-blue-text)')}>
                {plugin.marketplace}
              </span>
            )}
            {isLocal && (
              <span style={styles.tag('var(--tag-orange)', 'var(--tag-orange-text)')}>Local</span>
            )}
            <span style={styles.tag(statusColor[0], statusColor[1])}>
              {statusLabel}
            </span>
          </div>

          <span style={styles.expandIcon(expanded)}>▼</span>
        </div>

        {isInstalled && (
          <div style={styles.cardActions}>
            {plugin.enabled ? (
              <button
                style={styles.actionBtn('secondary')}
                disabled={acting}
                onClick={handleDisable}
              >
                Disable
              </button>
            ) : (
              <button
                style={styles.actionBtn('primary')}
                disabled={acting}
                onClick={handleEnable}
              >
                Enable
              </button>
            )}
            <button
              style={styles.actionBtn('danger')}
              disabled={acting}
              onClick={handleUninstall}
            >
              Uninstall
            </button>
          </div>
        )}

        <div style={styles.expandedContent(expanded)}>
          <div style={styles.expandedInner}>
            <div style={styles.tabs}>
              {['skills', 'agents', 'mcp', 'hooks'].map(tab => (
                <button
                  key={tab}
                  style={styles.tab(activeTab === tab)}
                  onClick={e => { e.stopPropagation(); setActiveTab(tab); }}
                >
                  {tab === 'mcp' ? 'MCP Servers' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {counts[tab] > 0 && ` (${counts[tab]})`}
                </button>
              ))}
            </div>

            <div style={styles.tabContent}>
              {activeTab === 'skills' && (
                <>
                  {isLocal && (
                    <button
                      style={{ ...styles.actionBtn('primary'), marginBottom: 12, fontSize: 12 }}
                      onClick={() => setEditing({ type: 'skill', item: null })}
                    >
                      + New Skill
                    </button>
                  )}
                  {(plugin.skills || []).length === 0 ? (
                    <div style={styles.emptyTab}>No skills in this plugin</div>
                  ) : (
                    (plugin.skills || []).map(skill => (
                      <PluginItemRow
                        key={skill.id}
                        item={skill}
                        isLocal={isLocal}
                        onEdit={() => setEditing({ type: 'skill', item: skill })}
                        onDelete={() => handleDeleteSkill(skill)}
                      />
                    ))
                  )}
                </>
              )}

              {activeTab === 'agents' && (
                <>
                  {isLocal && (
                    <button
                      style={{ ...styles.actionBtn('primary'), marginBottom: 12, fontSize: 12 }}
                      onClick={() => setEditing({ type: 'agent', item: null })}
                    >
                      + New Agent
                    </button>
                  )}
                  {(plugin.agents || []).length === 0 ? (
                    <div style={styles.emptyTab}>No agents in this plugin</div>
                  ) : (
                    (plugin.agents || []).map(agent => (
                      <PluginItemRow
                        key={agent.id}
                        item={agent}
                        isLocal={isLocal}
                        onEdit={() => setEditing({ type: 'agent', item: agent })}
                        onDelete={() => handleDeleteAgent(agent)}
                      />
                    ))
                  )}
                </>
              )}

              {activeTab === 'mcp' && (
                (plugin.mcpServers || []).length === 0 ? (
                  <div style={styles.emptyTab}>No MCP servers in this plugin</div>
                ) : (
                  (plugin.mcpServers || []).map((server, i) => (
                    <div key={server.id || i} style={styles.itemRow}>
                      <div style={styles.itemName}>🔌 {server.id || server.name}</div>
                      {server.command && (
                        <div style={styles.itemDesc}>{server.command} {(server.args || []).join(' ')}</div>
                      )}
                      {server.url && (
                        <div style={styles.itemDesc}>{server.url}</div>
                      )}
                    </div>
                  ))
                )
              )}

              {activeTab === 'hooks' && (
                (plugin.hooks || []).length === 0 ? (
                  <div style={styles.emptyTab}>No hooks in this plugin</div>
                ) : (
                  (plugin.hooks || []).map((hook, i) => (
                    <div key={i} style={styles.itemRow}>
                      <div style={styles.itemName}>{hook.event || hook.type || 'Hook'}</div>
                      {hook.command && <div style={styles.itemDesc}>{hook.command}</div>}
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && editing.type === 'skill' && (
        <EditorModal
          type="Skill"
          item={editing.item || null}
          scope="global"
          fields={SKILL_FIELDS}
          onSave={handleSaveSkill}
          onClose={() => setEditing(null)}
        />
      )}
      {editing && editing.type === 'agent' && (
        <EditorModal
          type="Agent"
          item={editing.item || null}
          scope="global"
          fields={AGENT_FIELDS}
          onSave={handleSaveAgent}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

export default function PluginsView({ projectPath, refreshKey, onRefresh }) {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [editing, setEditing] = useState(null); // top-level new skill modal

  useEffect(() => { loadPlugins(); }, [projectPath, refreshKey]);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const result = await window.api.listAllPlugins(projectPath);
      setPlugins(result || []);
    } catch (e) {
      console.error('Failed to load plugins:', e);
      setPlugins([]);
    }
    setLoading(false);
  };

  const handleSaveSkill = async (id, meta, body) => {
    await window.api.saveSkill('global', projectPath, id, meta, body);
    setEditing(null);
    loadPlugins();
    onRefresh();
  };

  const marketplaces = [...new Set(plugins.map(p => p.marketplace).filter(Boolean))];

  const filtered = plugins.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      if (!(p.name || p.id || '').toLowerCase().includes(q) &&
          !(p.description || '').toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'all') {
      const isInstalled = p.status === 'installed' || p.installed;
      const isLocal = p.source === 'local' || p.isLocal;
      if (statusFilter === 'installed' && !isInstalled) return false;
      if (statusFilter === 'available' && isInstalled) return false;
      if (statusFilter === 'local' && !isLocal) return false;
    }
    if (marketplaceFilter !== 'all' && p.marketplace !== marketplaceFilter) return false;
    return true;
  });

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Plugins</div>
          <div style={styles.subtitle}>
            All plugins with their bundled skills, agents, MCP servers, and hooks
          </div>
        </div>
        <button
          style={styles.createBtn}
          onClick={() => setEditing({ type: 'skill', item: null })}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          + New Skill
        </button>
      </div>

      <div style={styles.controlsRow}>
        <input
          style={styles.searchInput}
          placeholder="Search plugins..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <select
          style={styles.filterSelect}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="installed">Installed</option>
          <option value="available">Available</option>
          <option value="local">Local</option>
        </select>
        {marketplaces.length > 0 && (
          <select
            style={styles.filterSelect}
            value={marketplaceFilter}
            onChange={e => setMarketplaceFilter(e.target.value)}
          >
            <option value="all">All Marketplaces</option>
            {marketplaces.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={styles.empty}><div>Loading...</div></div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🧩</div>
          <div style={styles.emptyText}>
            {search || statusFilter !== 'all' ? 'No plugins match your filters' : 'No plugins found'}
          </div>
          <div style={styles.emptyHint}>
            {search ? 'Try a different search' : 'Add a marketplace or install plugins via the Claude Code CLI'}
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map(plugin => (
            <PluginCard
              key={plugin.key || plugin.id}
              plugin={plugin}
              projectPath={projectPath}
              onRefresh={() => { loadPlugins(); onRefresh(); }}
            />
          ))}
        </div>
      )}

      {editing && editing.type === 'skill' && (
        <EditorModal
          type="Skill"
          item={editing.item || null}
          scope="global"
          fields={SKILL_FIELDS}
          onSave={handleSaveSkill}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

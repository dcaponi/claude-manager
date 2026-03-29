import React, { useState, useEffect } from 'react';
import ComponentCard from '../components/ComponentCard.jsx';
import EditorModal from '../components/EditorModal.jsx';

const AGENT_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', placeholder: 'DB Optimizer' },
  { key: 'description', label: 'Description', type: 'text', placeholder: 'PostgreSQL performance specialist' },
  {
    key: 'tools',
    label: 'Allowed Tools',
    type: 'text',
    placeholder: 'Read, Grep, Glob, Bash',
    hint: 'Comma-separated list of tools this agent can use (e.g., Read, Grep, Glob, Bash, Edit, Write)',
  },
  {
    key: 'model',
    label: 'Model',
    type: 'select',
    options: [
      { value: 'opus', label: 'Opus — most capable' },
      { value: 'sonnet', label: 'Sonnet — balanced' },
      { value: 'haiku', label: 'Haiku — fastest' },
    ],
  },
  {
    key: 'memory',
    label: 'Memory Scope',
    type: 'select',
    options: [
      { value: 'user', label: 'User — ~/.claude/agent-memory/' },
      { value: 'project', label: 'Project — .claude/agent-memory/' },
      { value: 'local', label: 'Local — .claude/agent-memory-local/' },
    ],
  },
  {
    key: 'isolation',
    label: 'Isolation',
    type: 'select',
    options: [
      { value: 'worktree', label: 'Worktree — isolated git worktree copy' },
    ],
    hint: 'Run the agent in an isolated git worktree to prevent interference',
  },
  {
    key: 'disable-model-invocation',
    label: 'Invocation Control',
    type: 'checkbox',
    checkboxLabel: 'Disable model invocation',
    hint: 'When checked, this agent can only be invoked explicitly by name',
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
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  empty: { textAlign: 'center', padding: 60, color: 'var(--text-muted)' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, marginBottom: 8 },
  emptyHint: { fontSize: 12, color: 'var(--text-muted)' },
  searchRow: { display: 'flex', gap: 12, marginBottom: 20 },
  searchInput: {
    flex: 1, padding: '8px 14px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  },
};

export default function AgentsView({ scope, projectPath, refreshKey, onRefresh }) {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAgents(); }, [scope, projectPath, refreshKey]);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const result = await window.api.listAgents(scope, projectPath);
      setAgents(result || []);
    } catch (e) {
      console.error('Failed to load agents:', e);
      setAgents([]);
    }
    setLoading(false);
  };

  const handleSave = async (id, meta, body) => {
    await window.api.saveAgent(scope, projectPath, id, meta, body);
    setEditing(null);
    loadAgents();
    onRefresh();
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete agent "${item.name || item.id}"?`)) return;
    await window.api.deleteAgent(scope, projectPath, item.id);
    loadAgents();
    onRefresh();
  };

  const filtered = agents.filter(a =>
    !search || (a.name || a.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Agents</div>
          <div style={styles.subtitle}>
            Specialized subagents — {scope === 'global' ? '~/.claude/agents/' : '.claude/agents/'}
          </div>
        </div>
        <button
          style={styles.createBtn}
          onClick={() => setEditing({})}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          + New Agent
        </button>
      </div>

      {agents.length > 0 && (
        <div style={styles.searchRow}>
          <input
            style={styles.searchInput}
            placeholder="Search agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      )}

      {loading ? (
        <div style={styles.empty}><div style={styles.emptyText}>Loading...</div></div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🤖</div>
          <div style={styles.emptyText}>{search ? 'No agents match your search' : 'No agents found'}</div>
          <div style={styles.emptyHint}>{search ? 'Try a different search term' : `Create your first ${scope} agent to get started`}</div>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map(agent => (
            <ComponentCard
              key={agent.id}
              item={agent}
              type="agent"
              icon="🤖"
              iconColor="var(--tag-green)"
              onEdit={() => setEditing({ item: agent })}
              onDelete={() => handleDelete(agent)}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditorModal
          type="Agent"
          item={editing.item || null}
          scope={scope}
          fields={AGENT_FIELDS}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

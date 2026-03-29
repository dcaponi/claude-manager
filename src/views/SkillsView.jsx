import React, { useState, useEffect } from 'react';
import ComponentCard from '../components/ComponentCard.jsx';
import EditorModal from '../components/EditorModal.jsx';

const SKILL_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', placeholder: 'Deploy to Production' },
  { key: 'description', label: 'Description', type: 'text', placeholder: 'Deploys the application to the production environment' },
  {
    key: 'disable-model-invocation',
    label: 'Invocation Control',
    type: 'checkbox',
    checkboxLabel: 'Disable model invocation',
    hint: 'When checked, only users can invoke this skill via slash command — the model cannot trigger it automatically',
  },
  {
    key: 'context',
    label: 'Context Mode',
    type: 'select',
    options: [
      { value: 'fork', label: 'Fork — runs in a forked context' },
    ],
  },
  {
    key: 'agent',
    label: 'Agent',
    type: 'select',
    options: [
      { value: 'Explore', label: 'Explore — fast codebase exploration' },
      { value: 'Plan', label: 'Plan — architecture planning' },
    ],
    hint: 'Optionally delegate this skill to a specific agent type',
  },
  {
    key: 'memory',
    label: 'Memory Scope',
    type: 'select',
    options: [
      { value: 'user', label: 'User — persists in ~/.claude/' },
      { value: 'project', label: 'Project — persists in .claude/' },
      { value: 'local', label: 'Local — not version-controlled' },
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
  title: {
    fontSize: 24,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginTop: 4,
  },
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  empty: {
    textAlign: 'center',
    padding: 60,
    color: 'var(--text-muted)',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  searchRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    padding: '8px 14px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
  },
};

export default function SkillsView({ scope, projectPath, refreshKey, onRefresh }) {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {item} = editing
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, [scope, projectPath, refreshKey]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const result = await window.api.listSkills(scope, projectPath);
      setSkills(result || []);
    } catch (e) {
      console.error('Failed to load skills:', e);
      setSkills([]);
    }
    setLoading(false);
  };

  const handleSave = async (id, meta, body) => {
    await window.api.saveSkill(scope, projectPath, id, meta, body);
    setEditing(null);
    loadSkills();
    onRefresh();
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete skill "${item.name || item.id}"?`)) return;
    await window.api.deleteSkill(scope, projectPath, item.id);
    loadSkills();
    onRefresh();
  };

  const filtered = skills.filter(s =>
    !search || (s.name || s.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Skills</div>
          <div style={styles.subtitle}>
            Slash-command invocable prompts — {scope === 'global' ? '~/.claude/skills/' : '.claude/skills/'}
          </div>
        </div>
        <button
          style={styles.createBtn}
          onClick={() => setEditing({})}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          + New Skill
        </button>
      </div>

      {skills.length > 0 && (
        <div style={styles.searchRow}>
          <input
            style={styles.searchInput}
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      )}

      {loading ? (
        <div style={styles.empty}>
          <div style={styles.emptyText}>Loading...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>⚡</div>
          <div style={styles.emptyText}>
            {search ? 'No skills match your search' : 'No skills found'}
          </div>
          <div style={styles.emptyHint}>
            {search ? 'Try a different search term' : `Create your first ${scope} skill to get started`}
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map(skill => (
            <ComponentCard
              key={skill.id}
              item={skill}
              type="skill"
              icon="⚡"
              iconColor="var(--accent-light)"
              onEdit={() => setEditing({ item: skill })}
              onDelete={() => handleDelete(skill)}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditorModal
          type="Skill"
          item={editing.item || null}
          scope={scope}
          fields={SKILL_FIELDS}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

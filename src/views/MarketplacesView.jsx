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
  cardInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    gap: 12,
  },
  cardLeft: {
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
    fontSize: 18,
    flexShrink: 0,
  },
  name: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  source: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tags: { display: 'flex', gap: 6, flexShrink: 0 },
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
  actions: { display: 'flex', gap: 6, flexShrink: 0 },
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
    width: 500,
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
  modalBody: { padding: 24 },
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
    boxSizing: 'border-box',
  },
  hint: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4 },
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

function CreateMarketplaceModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [repo, setRepo] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !repo.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), repo.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>Create Marketplace</div>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <div style={styles.modalBody}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-plugins"
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={styles.hint}>A short identifier for this marketplace.</div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>GitHub Repository</label>
            <input
              style={styles.input}
              value={repo}
              onChange={e => setRepo(e.target.value)}
              placeholder="https://github.com/org/repo.git"
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={styles.hint}>The Git repository URL for this marketplace.</div>
          </div>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.btn('secondary')} onClick={onClose}>Cancel</button>
          <button
            style={styles.btn('primary')}
            onClick={handleSave}
            disabled={saving || !name.trim() || !repo.trim()}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            {saving ? 'Creating...' : 'Create Marketplace'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacesView({ refreshKey, onRefresh }) {
  const [marketplaces, setMarketplaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [acting, setActing] = useState({});

  useEffect(() => { loadMarketplaces(); }, [refreshKey]);

  const loadMarketplaces = async () => {
    setLoading(true);
    try {
      const result = await window.api.listMarketplaces();
      setMarketplaces(result || []);
    } catch (e) {
      console.error('Failed to load marketplaces:', e);
      setMarketplaces([]);
    }
    setLoading(false);
  };

  const setActingFor = (name, val) => setActing(prev => ({ ...prev, [name]: val }));

  const handleToggleOwned = async (marketplace) => {
    const name = marketplace.name;
    setActingFor(name, true);
    try {
      await window.api.setMarketplaceOwned(name, !marketplace.owned);
      loadMarketplaces();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
    setActingFor(name, false);
  };

  const handleUpdate = async (marketplace) => {
    const name = marketplace.name;
    setActingFor(name, true);
    try {
      await window.api.updateMarketplace(name);
      loadMarketplaces();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
    setActingFor(name, false);
  };

  const handleRemove = async (marketplace) => {
    if (!confirm(`Remove marketplace "${marketplace.name}"?`)) return;
    const name = marketplace.name;
    setActingFor(name, true);
    try {
      await window.api.removeMarketplace(name);
      loadMarketplaces();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
    setActingFor(name, false);
  };

  const handleCreate = async (name, repo) => {
    await window.api.createMarketplace(name, repo);
    setCreating(false);
    loadMarketplaces();
    onRefresh();
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Marketplaces</div>
          <div style={styles.subtitle}>
            Plugin repositories — subscribe to install plugins from the community
          </div>
        </div>
        <button
          style={styles.createBtn}
          onClick={() => setCreating(true)}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          + Create Marketplace
        </button>
      </div>

      {loading ? (
        <div style={styles.empty}><div>Loading...</div></div>
      ) : marketplaces.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🏪</div>
          <div style={styles.emptyText}>No marketplaces configured</div>
          <div style={styles.emptyHint}>
            Create a marketplace to publish your own plugins, or subscribe to a community repository.
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {marketplaces.map(marketplace => (
            <div
              key={marketplace.name}
              style={styles.card}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={styles.cardInner}>
                <div style={styles.cardLeft}>
                  <div style={styles.icon}>🏪</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.name}>{marketplace.name}</div>
                    <div style={styles.source}>{marketplace.source?.repo || marketplace.source?.url || marketplace.installLocation || ''}</div>
                  </div>
                </div>

                <div style={styles.tags}>
                  {marketplace.owned && (
                    <span style={styles.tag('var(--tag-green)', 'var(--tag-green-text)')}>Owned</span>
                  )}
                  {marketplace.subscribed && !marketplace.owned && (
                    <span style={styles.tag('var(--tag-blue)', 'var(--tag-blue-text)')}>Subscribed</span>
                  )}
                  {marketplace.pluginCount != null && (
                    <span style={styles.tag('var(--bg-tertiary)', 'var(--text-secondary)')}>
                      {marketplace.pluginCount} plugins
                    </span>
                  )}
                </div>

                <div style={styles.actions}>
                  <button
                    style={styles.actionBtn('secondary')}
                    disabled={acting[marketplace.name]}
                    onClick={() => handleToggleOwned(marketplace)}
                  >
                    {marketplace.owned ? 'Unmark Owned' : 'Mark Owned'}
                  </button>
                  <button
                    style={styles.actionBtn('primary')}
                    disabled={acting[marketplace.name]}
                    onClick={() => handleUpdate(marketplace)}
                  >
                    Update
                  </button>
                  <button
                    style={styles.actionBtn('danger')}
                    disabled={acting[marketplace.name]}
                    onClick={() => handleRemove(marketplace)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateMarketplaceModal
          onSave={handleCreate}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

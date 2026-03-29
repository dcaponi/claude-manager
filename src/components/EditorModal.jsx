import React, { useState, useEffect } from 'react';

const styles = {
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
    width: 640,
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
  },
  body: {
    padding: 24,
    overflow: 'auto',
    flex: 1,
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
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: 'SF Mono, Consolas, monospace',
    lineHeight: 1.6,
    outline: 'none',
    resize: 'vertical',
    minHeight: 160,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: 'var(--accent)',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: 13,
    color: 'var(--text-primary)',
  },
  checkboxDesc: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  footer: {
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
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  hint: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
};

export default function EditorModal({ type, item, scope, onSave, onClose, fields }) {
  const defaultMeta = {};
  fields.forEach(f => {
    if (f.type === 'checkbox') defaultMeta[f.key] = false;
    else defaultMeta[f.key] = '';
  });

  const [id, setId] = useState('');
  const [meta, setMeta] = useState(defaultMeta);
  const [body, setBody] = useState('');
  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setId(item.id);
      const m = {};
      fields.forEach(f => {
        m[f.key] = item[f.key] !== undefined ? item[f.key] : (f.type === 'checkbox' ? false : '');
      });
      setMeta(m);
      setBody(item.body || '');
    }
  }, [item]);

  const handleSave = () => {
    if (!id.trim()) return;
    const cleanId = id.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    onSave(cleanId, meta, body);
  };

  const updateMeta = (key, value) => setMeta(prev => ({ ...prev, [key]: value }));

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>{isEditing ? 'Edit' : 'Create'} {type}</div>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div style={styles.body}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>ID / Slug</label>
            <input
              style={styles.input}
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder={`my-${type.toLowerCase()}`}
              disabled={isEditing}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            {!isEditing && <div style={styles.hint}>Lowercase with hyphens. This becomes the invocation name.</div>}
          </div>

          {fields.map(field => (
            <div key={field.key} style={styles.fieldGroup}>
              <label style={styles.label}>{field.label}</label>
              {field.type === 'checkbox' ? (
                <div style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={!!meta[field.key]}
                    onChange={e => updateMeta(field.key, e.target.checked)}
                  />
                  <div>
                    <div style={styles.checkboxLabel}>{field.checkboxLabel || field.label}</div>
                    {field.hint && <div style={styles.checkboxDesc}>{field.hint}</div>}
                  </div>
                </div>
              ) : field.type === 'select' ? (
                <select
                  style={styles.input}
                  value={meta[field.key] || ''}
                  onChange={e => updateMeta(field.key, e.target.value)}
                >
                  <option value="">— None —</option>
                  {field.options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    style={styles.input}
                    value={meta[field.key] || ''}
                    onChange={e => updateMeta(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  {field.hint && <div style={styles.hint}>{field.hint}</div>}
                </>
              )}
            </div>
          ))}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Prompt / Body</label>
            <textarea
              style={styles.textarea}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={`Write the ${type.toLowerCase()} prompt here...`}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.btn('secondary')} onClick={onClose}>Cancel</button>
          <button
            style={styles.btn('primary')}
            onClick={handleSave}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            {isEditing ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

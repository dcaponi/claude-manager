import React, { useState } from 'react';

const styles = {
  card: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    transition: 'border-color 0.15s',
  },
  header: {
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
  icon: (color) => ({
    width: 36,
    height: 36,
    borderRadius: 8,
    background: color || 'var(--accent-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  }),
  name: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  description: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
  actions: {
    display: 'flex',
    gap: 4,
    marginLeft: 12,
    flexShrink: 0,
  },
  actionBtn: (variant) => ({
    padding: '5px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.15s',
    ...(variant === 'edit' ? {
      background: 'transparent',
      borderColor: 'var(--accent)',
      color: 'var(--accent)',
    } : variant === 'delete' ? {
      background: 'transparent',
      borderColor: 'var(--danger)',
      color: 'var(--danger)',
    } : {
      background: 'transparent',
      borderColor: 'var(--border)',
      color: 'var(--text-secondary)',
    }),
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
  invokeInfo: {
    margin: '12px 0',
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    fontSize: 12,
    fontFamily: 'SF Mono, Consolas, monospace',
    color: 'var(--tag-blue-text)',
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: 12,
    marginBottom: 6,
  },
  prompt: {
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    fontSize: 12,
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    whiteSpace: 'pre-wrap',
    fontFamily: 'SF Mono, Consolas, monospace',
    maxHeight: 300,
    overflow: 'auto',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 8,
    marginTop: 8,
  },
  metaItem: {
    padding: '6px 10px',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    fontSize: 11,
  },
  metaKey: {
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  metaVal: {
    color: 'var(--text-primary)',
    marginLeft: 6,
  },
};

export default function ComponentCard({ item, icon, iconColor, type, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const scopeTag = item.scope === 'global'
    ? { bg: 'var(--tag-blue)', color: 'var(--tag-blue-text)', text: 'GLOBAL' }
    : { bg: 'var(--tag-green)', color: 'var(--tag-green-text)', text: 'PROJECT' };

  const metaEntries = Object.entries(item)
    .filter(([k]) => !['id', 'body', 'scope', 'filePath', 'name', 'description', 'settingsPath', 'dirPath', 'skills', 'meta', 'enabled', 'source'].includes(k))
    .filter(([, v]) => v !== undefined && v !== null && v !== '');

  const invokeText = type === 'skill' ? `/${item.id}` : type === 'agent' ? `Agent: ${item.id}` : item.id;

  return (
    <div
      style={styles.card}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={styles.header} onClick={() => setExpanded(!expanded)}>
        <div style={styles.headerLeft}>
          <div style={styles.icon(iconColor)}>{icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={styles.name}>{item.name || item.id}</div>
            <div style={styles.description}>{item.description || 'No description'}</div>
          </div>
        </div>
        <div style={styles.tags}>
          <span style={styles.tag(scopeTag.bg, scopeTag.color)}>{scopeTag.text}</span>
          {item['disable-model-invocation'] && (
            <span style={styles.tag('var(--tag-orange)', 'var(--tag-orange-text)')}>USER-ONLY</span>
          )}
        </div>
        <div style={styles.actions}>
          {onEdit && (
            <button style={styles.actionBtn('edit')} onClick={e => { e.stopPropagation(); onEdit(item); }}>
              Edit
            </button>
          )}
          {onDelete && (
            <button style={styles.actionBtn('delete')} onClick={e => { e.stopPropagation(); onDelete(item); }}>
              Delete
            </button>
          )}
        </div>
        <span style={styles.expandIcon(expanded)}>▼</span>
      </div>

      <div style={styles.content(expanded)}>
        <div style={styles.contentInner}>
          <div style={styles.promptLabel}>Invoke</div>
          <div style={styles.invokeInfo}>{invokeText}</div>

          {metaEntries.length > 0 && (
            <>
              <div style={styles.promptLabel}>Metadata</div>
              <div style={styles.metaGrid}>
                {metaEntries.map(([k, v]) => (
                  <div key={k} style={styles.metaItem}>
                    <span style={styles.metaKey}>{k}:</span>
                    <span style={styles.metaVal}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {item.body && (
            <>
              <div style={styles.promptLabel}>Prompt / Content</div>
              <div style={styles.prompt}>{item.body}</div>
            </>
          )}

          {item.filePath && (
            <>
              <div style={styles.promptLabel}>File Path</div>
              <div style={{ ...styles.invokeInfo, color: 'var(--text-muted)' }}>{item.filePath}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

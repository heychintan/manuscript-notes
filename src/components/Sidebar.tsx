'use client'

import { useRef } from 'react'
import { Plus, Search, Pin, Trash2, BookText } from 'lucide-react'
import { Note } from '@/types'

interface Props {
  notes: Note[]
  activeId: string | null
  searchQuery: string
  onSearch: (q: string) => void
  onCreate: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function extractPreview(content: string): string {
  if (!content) return ''
  try {
    const doc = JSON.parse(content)
    const texts: string[] = []
    function walk(node: Record<string, unknown>) {
      if (node.type === 'text' && typeof node.text === 'string') texts.push(node.text)
      if (Array.isArray(node.content)) (node.content as Record<string, unknown>[]).forEach(walk)
    }
    walk(doc)
    return texts.join(' ').slice(0, 100)
  } catch {
    return content.slice(0, 100)
  }
}

export default function Sidebar({ notes, activeId, searchQuery, onSearch, onCreate, onSelect, onDelete, onTogglePin }: Props) {
  const searchRef = useRef<HTMLInputElement>(null)

  const pinned = notes.filter(n => n.isPinned)
  const unpinned = notes.filter(n => !n.isPinned)

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('Delete this note?')) onDelete(id)
  }

  const handlePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onTogglePin(id)
  }

  const renderNote = (note: Note) => {
    const preview = extractPreview(note.content)
    return (
      <div
        key={note.id}
        className={`note-item ${note.id === activeId ? 'active' : ''}`}
        onClick={() => onSelect(note.id)}
      >
        <div className={`note-item-title ${!note.title ? 'untitled' : ''}`}>
          {note.title || 'Untitled note'}
        </div>
        {preview && (
          <div className="note-item-preview">{preview}</div>
        )}
        <div className="note-item-meta">
          <span className="note-time">{relativeTime(note.updatedAt)}</span>
          {note.tags.slice(0, 2).map(tag => (
            <span key={tag} className="note-tag">{tag}</span>
          ))}
        </div>
        <div className="note-item-actions">
          <button
            className={`action-btn ${note.isPinned ? 'pinned' : ''}`}
            onClick={e => handlePin(e, note.id)}
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin />
          </button>
          <button
            className="action-btn danger"
            onClick={e => handleDelete(e, note.id)}
            title="Delete"
          >
            <Trash2 />
          </button>
        </div>
      </div>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="app-wordmark">
          <BookText size={16} />
          Manuscript
        </span>
        <button className="btn-new" onClick={onCreate} title="New note (⌘N)">
          <Plus />
          New
        </button>
      </div>

      <div className="search-wrap">
        <div className="search-box">
          <Search />
          <input
            ref={searchRef}
            className="search-input"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="note-count">
        {notes.length} {notes.length === 1 ? 'note' : 'notes'}
      </div>

      <div className="notes-list">
        {notes.length === 0 && (
          <div className="no-results">No notes yet</div>
        )}

        {notes.length > 0 && pinned.length > 0 && (
          <>
            <div className="note-section-label">
              <Pin size={11} />
              Pinned
            </div>
            {pinned.map(renderNote)}
          </>
        )}

        {notes.length > 0 && unpinned.length > 0 && (
          <>
            {pinned.length > 0 && (
              <div className="note-section-label" style={{ marginTop: '8px' }}>Notes</div>
            )}
            {unpinned.map(renderNote)}
          </>
        )}

        {searchQuery && notes.length === 0 && (
          <div className="no-results">No notes match "{searchQuery}"</div>
        )}
      </div>
    </aside>
  )
}

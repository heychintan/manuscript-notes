'use client'

import { useEffect, useCallback } from 'react'
import { useNotes } from '@/hooks/useNotes'
import Sidebar from '@/components/Sidebar'
import NoteEditor from '@/components/NoteEditor'
import EmptyState from '@/components/EmptyState'

export default function Home() {
  const {
    hydrated,
    filteredNotes,
    activeNote,
    searchQuery,
    saveStatus,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    selectNote,
    setSearchQuery,
  } = useNotes()

  const handleCreate = useCallback(() => {
    createNote()
  }, [createNote])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        handleCreate()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleCreate])

  if (!hydrated) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Loading…
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        notes={filteredNotes}
        activeId={activeNote?.id ?? null}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onCreate={handleCreate}
        onSelect={selectNote}
        onDelete={deleteNote}
        onTogglePin={togglePin}
      />

      {activeNote ? (
        <NoteEditor
          key={activeNote.id}
          note={activeNote}
          saveStatus={saveStatus}
          onUpdate={patch => updateNote(activeNote.id, patch)}
        />
      ) : (
        <EmptyState onCreate={handleCreate} />
      )}
    </div>
  )
}

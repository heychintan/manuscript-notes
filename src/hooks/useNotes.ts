'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Note, NoteUpdate } from '@/types'

const STORAGE_KEY = 'manuscript-notes-v1'
const ACTIVE_KEY = 'manuscript-active-v1'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    tags: [],
    isPinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    wordCount: 0,
    ...overrides,
  }
}

const WELCOME_CONTENT = JSON.stringify({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'A place for your thoughts.' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Manuscript is a minimal, distraction-free writing environment built around typography. Every note is saved automatically.' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Try ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
        { type: 'text', text: ', ' },
        { type: 'text', marks: [{ type: 'italic' }], text: 'italic' },
        { type: 'text', text: ', ' },
        { type: 'text', marks: [{ type: 'highlight' }], text: 'highlighted text' },
        { type: 'text', text: ', and more using the toolbar above.' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '⌘N — new note' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '⌘F — search notes' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Select text — inline formatting menu' }] }] },
      ],
    },
  ],
})

const TASKS_CONTENT = JSON.stringify({
  type: 'doc',
  content: [
    {
      type: 'taskList',
      content: [
        { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Visit the farmers market' }] }] },
        { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Read the new novel on the shelf' }] }] },
        { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Fix the kitchen shelf' }] }] },
        { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Long walk by the river' }] }] },
      ],
    },
  ],
})

function getDefaults(): Note[] {
  const now = Date.now()
  return [
    makeNote({
      title: 'Welcome to Manuscript',
      content: WELCOME_CONTENT,
      tags: ['welcome'],
      wordCount: 62,
      createdAt: now - 86400000,
      updatedAt: now - 3600000,
    }),
    makeNote({
      title: 'Weekend checklist',
      content: TASKS_CONTENT,
      tags: ['personal'],
      wordCount: 18,
      createdAt: now - 7200000,
      updatedAt: now - 1800000,
    }),
  ]
}

function loadNotes(): Note[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return getDefaults()
}

export type SaveStatus = 'idle' | 'saving' | 'saved'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = loadNotes()
    setNotes(loaded)
    const savedId = localStorage.getItem(ACTIVE_KEY)
    const firstId = savedId && loaded.find(n => n.id === savedId) ? savedId : loaded[0]?.id ?? null
    setActiveNoteId(firstId)
    setHydrated(true)
  }, [])

  const persist = useCallback((updated: Note[]) => {
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {}
      setSaveStatus('saved')
      if (statusRef.current) clearTimeout(statusRef.current)
      statusRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
    }, 600)
  }, [])

  const createNote = useCallback((): string => {
    const note = makeNote()
    setNotes(prev => {
      const updated = [note, ...prev]
      persist(updated)
      return updated
    })
    setActiveNoteId(note.id)
    localStorage.setItem(ACTIVE_KEY, note.id)
    return note.id
  }, [persist])

  const updateNote = useCallback((id: string, patch: NoteUpdate) => {
    setNotes(prev => {
      const updated = prev.map(n =>
        n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
      )
      persist(updated)
      return updated
    })
  }, [persist])

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id)
      persist(updated)
      return updated
    })
    setActiveNoteId(prev => {
      if (prev !== id) return prev
      const remaining = notes.filter(n => n.id !== id)
      const next = remaining[0]?.id ?? null
      if (next) localStorage.setItem(ACTIVE_KEY, next)
      else localStorage.removeItem(ACTIVE_KEY)
      return next
    })
  }, [notes, persist])

  const togglePin = useCallback((id: string) => {
    setNotes(prev => {
      const updated = prev.map(n =>
        n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n
      )
      persist(updated)
      return updated
    })
  }, [persist])

  const selectNote = useCallback((id: string) => {
    setActiveNoteId(id)
    localStorage.setItem(ACTIVE_KEY, id)
  }, [])

  const filteredNotes = notes
    .filter(n => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        n.title.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q)) ||
        ((() => {
          try { return JSON.stringify(JSON.parse(n.content)).toLowerCase().includes(q) } catch { return n.content.toLowerCase().includes(q) }
        })())
      )
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })

  const activeNote = notes.find(n => n.id === activeNoteId) ?? null

  return {
    hydrated,
    notes,
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
  }
}

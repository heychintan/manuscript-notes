'use client'

import { BookOpen, Plus } from 'lucide-react'

interface Props {
  onCreate: () => void
}

export default function EmptyState({ onCreate }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <BookOpen />
      </div>
      <h2>Nothing here yet</h2>
      <p>Create your first note and start writing. Your notes are saved locally in your browser.</p>
      <button className="empty-cta" onClick={onCreate}>
        <Plus />
        New note
      </button>
    </div>
  )
}

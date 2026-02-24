export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  isPinned: boolean
  createdAt: number
  updatedAt: number
  wordCount: number
}

export type NoteUpdate = Partial<Omit<Note, 'id' | 'createdAt'>>

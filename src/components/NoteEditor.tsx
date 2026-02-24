'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextStyle from '@tiptap/extension-text-style'
import Link from '@tiptap/extension-link'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Highlighter, Quote, List, ListOrdered, CheckSquare,
  Minus, Link as LinkIcon, Undo2, Redo2, X
} from 'lucide-react'
import { Note, NoteUpdate } from '@/types'
import { SaveStatus } from '@/hooks/useNotes'

interface Props {
  note: Note
  saveStatus: SaveStatus
  onUpdate: (patch: NoteUpdate) => void
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function NoteEditor({ note, saveStatus, onUpdate }: Props) {
  const [title, setTitle] = useState(note.title)
  const [tags, setTags] = useState<string[]>(note.tags)
  const [tagInput, setTagInput] = useState('')
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  const initialContent = useMemo(() => {
    if (!note.content) return ''
    try { return JSON.parse(note.content) } catch { return note.content }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight,
      TextStyle,
      Placeholder.configure({
        placeholder: 'Begin writing…',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      const content = JSON.stringify(editor.getJSON())
      const wordCount = countWords(editor.getText())
      onUpdate({ content, wordCount })
    },
  })

  // Focus title on mount if empty
  useEffect(() => {
    if (!note.title && titleRef.current) {
      titleRef.current.focus()
    }
  }, [note.title])

  // Sync title changes (debounced)
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setTitle(val)
    if (titleTimer.current) clearTimeout(titleTimer.current)
    titleTimer.current = setTimeout(() => onUpdate({ title: val }), 400)
  }, [onUpdate])

  // Auto-resize title textarea
  const resizeTitle = useCallback(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [])

  useEffect(() => { resizeTitle() }, [title, resizeTitle])

  // Tag management
  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!tag || tags.includes(tag)) return
    const updated = [...tags, tag]
    setTags(updated)
    onUpdate({ tags: updated })
    setTagInput('')
  }, [tags, onUpdate])

  const removeTag = useCallback((tag: string) => {
    const updated = tags.filter(t => t !== tag)
    setTags(updated)
    onUpdate({ tags: updated })
  }, [tags, onUpdate])

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }, [tagInput, tags, addTag, removeTag])

  // Heading select value
  const getHeadingValue = () => {
    if (!editor) return 'p'
    if (editor.isActive('heading', { level: 1 })) return 'h1'
    if (editor.isActive('heading', { level: 2 })) return 'h2'
    if (editor.isActive('heading', { level: 3 })) return 'h3'
    return 'p'
  }

  const setHeading = (val: string) => {
    if (!editor) return
    if (val === 'p') editor.chain().focus().setParagraph().run()
    else editor.chain().focus().toggleHeading({ level: parseInt(val[1]) as 1 | 2 | 3 }).run()
  }

  const setLink = () => {
    if (!editor) return
    const prev = editor.getAttributes('link').href || ''
    const url = window.prompt('URL:', prev)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  if (!editor) return null

  return (
    <div className="editor-area">
      {/* Toolbar */}
      <div className="toolbar">
        <select
          className="tb-heading-select"
          value={getHeadingValue()}
          onChange={e => setHeading(e.target.value)}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="toolbar-divider" />

        <button className={`tb-btn ${editor.isActive('bold') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (⌘B)">
          <Bold />
        </button>
        <button className={`tb-btn ${editor.isActive('italic') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (⌘I)">
          <Italic />
        </button>
        <button className={`tb-btn ${editor.isActive('underline') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (⌘U)">
          <UnderlineIcon />
        </button>
        <button className={`tb-btn ${editor.isActive('strike') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough />
        </button>

        <div className="toolbar-divider" />

        <button className={`tb-btn ${editor.isActive('code') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
          <Code />
        </button>
        <button className={`tb-btn ${editor.isActive('highlight') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
          <Highlighter />
        </button>
        <button className={`tb-btn ${editor.isActive('blockquote') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
          <Quote />
        </button>
        <button className={`tb-btn ${editor.isActive('codeBlock') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>&lt;/&gt;</span>
        </button>

        <div className="toolbar-divider" />

        <button className={`tb-btn ${editor.isActive('bulletList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <List />
        </button>
        <button className={`tb-btn ${editor.isActive('orderedList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list">
          <ListOrdered />
        </button>
        <button className={`tb-btn ${editor.isActive('taskList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task list">
          <CheckSquare />
        </button>

        <div className="toolbar-divider" />

        <button className="tb-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus />
        </button>
        <button className={`tb-btn ${editor.isActive('link') ? 'active' : ''}`} onClick={setLink} title="Link">
          <LinkIcon />
        </button>

        <div className="toolbar-divider" />

        <button className="tb-btn" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (⌘Z)">
          <Undo2 />
        </button>
        <button className="tb-btn" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (⌘⇧Z)">
          <Redo2 />
        </button>
      </div>

      {/* Content */}
      <div className="note-content">
        <div className="note-inner">
          <textarea
            ref={titleRef}
            className="note-title-input"
            placeholder="Untitled"
            value={title}
            onChange={handleTitleChange}
            onInput={resizeTitle}
            rows={1}
          />

          {/* Tags */}
          <div className="tags-row">
            {tags.map(tag => (
              <span key={tag} className="tag-chip">
                {tag}
                <button className="tag-chip-remove" onClick={() => removeTag(tag)} title="Remove tag">
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              className="tag-input"
              placeholder={tags.length === 0 ? '+ add tag' : '+ tag'}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput) addTag(tagInput) }}
            />
          </div>

          <div className="content-divider" />

          {/* Tiptap editor */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Bubble menu */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }} className="bubble-menu">
        <button className={`tb-btn ${editor.isActive('bold') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold />
        </button>
        <button className={`tb-btn ${editor.isActive('italic') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic />
        </button>
        <button className={`tb-btn ${editor.isActive('underline') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon />
        </button>
        <button className={`tb-btn ${editor.isActive('strike') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough />
        </button>
        <div className="toolbar-divider" style={{ height: 16 }} />
        <button className={`tb-btn ${editor.isActive('highlight') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter />
        </button>
        <button className={`tb-btn ${editor.isActive('code') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code />
        </button>
        <button className={`tb-btn ${editor.isActive('link') ? 'active' : ''}`} onClick={setLink}>
          <LinkIcon />
        </button>
      </BubbleMenu>

      {/* Status bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>{note.wordCount} {note.wordCount === 1 ? 'word' : 'words'}</span>
          <span>{editor.getText().length} chars</span>
        </div>
        <div className="status-right">
          <span className={`save-indicator ${saveStatus}`}>
            <span className={`save-dot ${saveStatus === 'saving' ? 'pulse' : ''}`} />
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

# Manuscript

A minimal, distraction-free notes app with a distinctive warm-dark aesthetic and a rich text editor built for writers.

![Manuscript Notes App](https://github.com/heychintan/manuscript-notes/raw/main/public/preview.png)

## Features

- **Rich text editor** — bold, italic, underline, strikethrough, highlight, inline code, blockquotes, code blocks, H1/H2/H3, bullet lists, ordered lists, task lists, horizontal rules, and links
- **Floating bubble menu** — select any text to instantly access inline formatting
- **Auto-save** — changes are debounced and persisted to `localStorage` automatically
- **Tags** — add and remove tags per note; type a tag and press Enter or comma to add
- **Search** — filters notes by title and tags in real time
- **Pin notes** — keep important notes at the top of the list
- **Keyboard shortcuts** — `⌘N` new note, `⌘B` bold, `⌘I` italic, and all standard Tiptap shortcuts
- **Relative timestamps** — notes show when they were last edited (just now, 2h ago, yesterday…)

## Design

The aesthetic is called **Manuscript** — warm dark backgrounds that feel like a dimly lit study, amber/gold accents, and a careful typographic stack:

| Role | Font |
|------|------|
| Note content & headings | [Fraunces](https://fonts.google.com/specimen/Fraunces) (variable optical-size serif) |
| UI chrome & labels | [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) |
| Code blocks & metadata | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) |

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [React 18](https://react.dev/)
- [Tiptap v2](https://tiptap.dev/) (ProseMirror-based rich text editor)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) (icons)
- TypeScript

All notes are stored in browser `localStorage` — no backend, no account required.

## Getting Started

```bash
git clone https://github.com/heychintan/manuscript-notes.git
cd manuscript-notes
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Design system, CSS variables, ProseMirror styles
│   ├── layout.tsx         # Font loading (Fraunces, Space Grotesk, JetBrains Mono)
│   └── page.tsx           # Root layout — wires Sidebar + NoteEditor
├── components/
│   ├── Sidebar.tsx        # Note list, search, pin/delete actions
│   ├── NoteEditor.tsx     # Tiptap editor, toolbar, tag input, status bar
│   └── EmptyState.tsx     # Shown when no note is selected
├── hooks/
│   └── useNotes.ts        # All note state, localStorage persistence, search
└── types/
    └── index.ts           # Note interface and types
```

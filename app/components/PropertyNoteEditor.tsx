'use client'

import {
  useEffect
} from 'react'

import {
  EditorContent,
  useEditor
} from '@tiptap/react'

import StarterKit
  from '@tiptap/starter-kit'

type PropertyNoteEditorProps = {
  value: string
  onChange: (
    value: string
  ) => void
  placeholder: string
  disabled?: boolean
}

export default function PropertyNoteEditor({
  value,
  onChange,
  placeholder,
  disabled = false
}: PropertyNoteEditorProps) {
  const editor =
    useEditor({
      extensions: [
        StarterKit
      ],

      content:
        value || '<p></p>',

      editable:
        !disabled,

      immediatelyRender:
        false,

      onUpdate({
        editor
      }) {
        onChange(
          editor.getHTML()
        )
      },

      editorProps: {
        attributes: {
          class:
            'property-note-editor',
          'data-placeholder':
            placeholder
        }
      }
    })

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.setEditable(
      !disabled
    )
  }, [
    editor,
    disabled
  ])

  useEffect(() => {
    if (
      !editor ||
      editor.getHTML() === value
    ) {
      return
    }

    editor.commands.setContent(
      value || '<p></p>',
      {
        emitUpdate: false
      }
    )
  }, [
    editor,
    value
  ])

  if (!editor) {
    return null
  }

  return (
    <div style={editorShell}>
      <div style={toolbar}>
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
          disabled={
            disabled ||
            !editor
              .can()
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
          style={{
            ...toolbarButton,
            ...(editor.isActive(
              'bold'
            )
              ? activeToolbarButton
              : {})
          }}
        >
          B
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
          disabled={disabled}
          style={{
            ...toolbarButton,
            ...(editor.isActive(
              'italic'
            )
              ? activeToolbarButton
              : {})
          }}
        >
          I
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 3
              })
              .run()
          }
          disabled={disabled}
          style={{
            ...toolbarButton,
            ...(editor.isActive(
              'heading',
              {
                level: 3
              }
            )
              ? activeToolbarButton
              : {})
          }}
        >
          H3
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
          disabled={disabled}
          style={{
            ...toolbarButton,
            ...(editor.isActive(
              'bulletList'
            )
              ? activeToolbarButton
              : {})
          }}
        >
          • List
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
          disabled={disabled}
          style={{
            ...toolbarButton,
            ...(editor.isActive(
              'orderedList'
            )
              ? activeToolbarButton
              : {})
          }}
        >
          1. List
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
          disabled={disabled}
          style={{
            ...toolbarButton,
            ...(editor.isActive(
              'blockquote'
            )
              ? activeToolbarButton
              : {})
          }}
        >
          Quote
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .undo()
              .run()
          }
          disabled={
            disabled ||
            !editor.can().undo()
          }
          style={toolbarButton}
        >
          Undo
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .redo()
              .run()
          }
          disabled={
            disabled ||
            !editor.can().redo()
          }
          style={toolbarButton}
        >
          Redo
        </button>
      </div>

      <EditorContent
        editor={editor}
      />

      <style jsx global>{`
        .property-note-editor {
          min-height: 110px;
          padding: 0.85rem;
          color: #fff;
          background: #111;
          outline: none;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .property-note-editor p {
          margin: 0 0 0.75rem;
        }

        .property-note-editor p:last-child {
          margin-bottom: 0;
        }

        .property-note-editor ul,
        .property-note-editor ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .property-note-editor blockquote {
          margin: 0.75rem 0;
          padding-left: 0.85rem;
          color: #aaa;
          border-left: 3px solid #c7a44b;
        }

        .property-note-editor h3 {
          margin: 0.75rem 0 0.5rem;
          color: #fff;
          font-size: 1.1rem;
        }

        .property-note-editor:empty::before {
          content: attr(data-placeholder);
          color: #666;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

const editorShell = {
  overflow: 'hidden',
  background: '#111',
  border: '1px solid #3a3a3a',
  borderRadius: '10px'
}

const toolbar = {
  display: 'flex',
  alignItems: 'center',
  gap: '.4rem',
  flexWrap: 'wrap' as const,
  padding: '.55rem',
  background: '#181818',
  borderBottom:
    '1px solid #333'
}

const toolbarButton = {
  minWidth: '2rem',
  padding: '.4rem .55rem',
  color: '#bbb',
  background: '#222',
  border: '1px solid #3a3a3a',
  borderRadius: '6px',
  fontFamily: 'inherit',
  fontSize: '.78rem',
  cursor: 'pointer'
}

const activeToolbarButton = {
  color: '#111',
  background: '#C7A44B',
  borderColor: '#C7A44B'
}
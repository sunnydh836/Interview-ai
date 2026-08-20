import React, { useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import '../style/editor.scss'

function cleanAndExtractHtml(rawHtml) {
    if (!rawHtml) return ''
    let clean = String(rawHtml).trim()

    // Detect if binary PDF content was passed (%PDF-1.4 ...)
    if (clean.includes('%PDF-')) {
        return '<h1>Resume Preview</h1><p>Binary PDF data detected. Generating clean HTML in editor...</p>'
    }

    // Strip markdown code fences if present (```html ... ```)
    clean = clean.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '')

    // Extract body inner HTML if <html> or <body> wrapper exists
    const bodyMatch = clean.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
        clean = bodyMatch[1]
    }

    // Strip out <head>, <script>, <style> blocks if present
    clean = clean.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

    return clean.trim()
}

const EditorToolbar = ({ editor }) => {
    if (!editor) return null

    const addLink = () => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('Enter URL:', previousUrl)

        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    return (
        <div className="editor-toolbar" role="toolbar" aria-label="Formatting options">
            <div className="toolbar-group">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                    title="Bold (Ctrl+B)"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                    title="Italic (Ctrl+I)"
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
                    title="Strikethrough"
                >
                    <s>S</s>
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                    title="Heading 2"
                >
                    H2
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
                    title="Heading 3"
                >
                    H3
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                    title="Bullet List"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                    title="Numbered List"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
                </button>
                <button
                    type="button"
                    onClick={addLink}
                    className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}
                    title="Add / Edit Link"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setColor('#2563eb').run()}
                    className="toolbar-color-dot"
                    style={{ backgroundColor: '#2563eb' }}
                    title="Blue text"
                />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setColor('#7c3aed').run()}
                    className="toolbar-color-dot"
                    style={{ backgroundColor: '#7c3aed' }}
                    title="Purple text"
                />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setColor('#059669').run()}
                    className="toolbar-color-dot"
                    style={{ backgroundColor: '#059669' }}
                    title="Green text"
                />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().unsetColor().run()}
                    className="toolbar-color-dot toolbar-color-dot--reset"
                    title="Default color"
                >
                    ×
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="toolbar-btn"
                    title="Undo (Ctrl+Z)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="toolbar-btn"
                    title="Redo (Ctrl+Y)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
                </button>
            </div>
        </div>
    )
}

const ResumeEditor = ({ initialContent, onContentChange, editorRef }) => {
    const formattedContent = useMemo(() => cleanAndExtractHtml(initialContent), [initialContent])

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3]
                }
            }),
            TextStyle,
            Color,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer'
                }
            })
        ],
        content: formattedContent || '<p>Loading resume editor...</p>',
        onUpdate: ({ editor }) => {
            if (onContentChange) {
                onContentChange(editor.getHTML())
            }
        }
    })

    useEffect(() => {
        if (editor && formattedContent) {
            editor.commands.setContent(formattedContent)
        }
    }, [editor, formattedContent])

    useEffect(() => {
        if (editorRef) {
            editorRef.current = editor
        }
    }, [editor, editorRef])

    return (
        <div className="resume-editor-container">
            <EditorToolbar editor={editor} />
            <div className="resume-paper-wrapper">
                <div className="resume-paper" id="resume-printable-area">
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    )
}

export default ResumeEditor

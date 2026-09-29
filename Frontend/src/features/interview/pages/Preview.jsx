import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router'
import html2pdf from 'html2pdf.js'
import { useInterview } from '../hooks/useInterview.js'
import ResumeEditor from '../components/ResumeEditor.jsx'
import '../style/preview.scss'

// ─── Loading Overlay ────────────────────────────────────────────────────────
const LoadingOverlay = () => (
    <div className="preview-loading">
        <div className="preview-loading__icon">
            <div className="preview-loading__ring" />
            <svg className="preview-spinner" viewBox="0 0 50 50" width="40" height="40" aria-hidden="true">
                <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="var(--accent-primary)" strokeLinecap="round" strokeDasharray="1, 150" strokeDashoffset="0" />
            </svg>
        </div>
        <div className="preview-loading__text">
            <p className="preview-loading__title">Generating Your Tailored Resume</p>
            <p className="preview-loading__sub">Our AI is drafting a personalized resume in the editor...</p>
        </div>
        <div className="preview-loading__steps">
            <div className="preview-loading__step">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                <span>Analyzing job description &amp; candidate profile</span>
            </div>
            <div className="preview-loading__step">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                <span>Formatting content &amp; ATS-friendly layout</span>
            </div>
            <div className="preview-loading__step">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                <span>Initializing TipTap editor</span>
            </div>
        </div>
    </div>
)

// ─── Error Overlay ──────────────────────────────────────────────────────────
const ErrorOverlay = ({ message, onRetry }) => (
    <div className="preview-error">
        <div className="preview-error__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        </div>
        <h2 className="preview-error__title">Failed to Load Resume Editor</h2>
        <p className="preview-error__message">{message || 'Something went wrong. Please try again.'}</p>
        <div className="preview-error__actions">
            <button onClick={onRetry} id="preview-retry-btn" className="preview-btn preview-btn--primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>Try Again</span>
            </button>
            <Link to="/" className="preview-btn preview-btn--ghost">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back to Dashboard</span>
            </Link>
        </div>
    </div>
)

// ─── Main Preview Page Component ─────────────────────────────────────────────
const Preview = () => {
    const { interviewId } = useParams()
    const { report, getReportById, loading: reportLoading, fetchResumeHtml } = useInterview()

    const [resumeHtml, setResumeHtml]       = useState('')
    const [isLoadingHtml, setIsLoadingHtml] = useState(false)
    const [isExporting, setIsExporting]     = useState(false)
    const [error, setError]                 = useState(null)
    const editorRef                         = useRef(null)

    // Load report metadata
    useEffect(() => {
        if (interviewId && (!report || (report._id && report._id !== interviewId))) {
            getReportById(interviewId).catch(() => setError('Failed to load interview report.'))
        }
    }, [interviewId, getReportById, report])

    // Fetch HTML for TipTap
    const loadResumeHtml = useCallback(async () => {
        if (!interviewId) return
        setError(null)
        setIsLoadingHtml(true)
        try {
            const html = await fetchResumeHtml(interviewId)
            setResumeHtml(html)
        } catch (err) {
            console.error('Fetch resume HTML error:', err)
            setError(err?.response?.data?.message || err?.message || 'Unable to generate resume content.')
        } finally {
            setIsLoadingHtml(false)
        }
    }, [interviewId, fetchResumeHtml])

    useEffect(() => {
        if (interviewId) {
            loadResumeHtml()
        }
    }, [interviewId])

    // Client-side PDF export via html2pdf.js
    const handleDownloadPdf = async () => {
        if (isExporting) return
        setIsExporting(true)
        try {
            const element = document.getElementById('resume-printable-area')
            if (!element) {
                alert('Resume content area not found.')
                return
            }

            const options = {
                margin:       [10, 12, 10, 12],
                filename:     `Resume_${report?.title ? report.title.replace(/\s+/g, '_') : 'Tailored'}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }

            await html2pdf().set(options).from(element).save()
        } catch (err) {
            console.error('PDF export error:', err)
            alert('Failed to generate PDF download. You can also try the Print button.')
        } finally {
            setIsExporting(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const pageTitle = report?.title || 'Interview Resume'
    const statusLabel = isLoadingHtml ? 'Generating resume...' : error ? 'Failed to load' : isExporting ? 'Exporting PDF...' : 'Editor Ready'
    const statusDotMod = isLoadingHtml || isExporting ? '--loading' : error ? '--error' : ''

    return (
        <div className="preview-page">

            {/* ── Toolbar ── */}
            <header className="preview-toolbar">
                <div className="preview-toolbar__left">
                    <Link
                        to={`/interview/${interviewId}`}
                        id="preview-back-btn"
                        className="preview-btn preview-btn--ghost"
                        aria-label="Back to Interview Report"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>Back</span>
                    </Link>

                    <div className="preview-toolbar__title-group">
                        <span className="preview-toolbar__label">TipTap Resume Editor</span>
                        <span className="preview-toolbar__title" title={pageTitle}>
                            {reportLoading ? 'Loading...' : pageTitle}
                        </span>
                    </div>

                    <span className="preview-toolbar__badge" aria-label="AI Generated">
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z" />
                        </svg>
                        TipTap Powered
                    </span>
                </div>

                <div className="preview-toolbar__actions">
                    {/* Reload */}
                    <button
                        onClick={loadResumeHtml}
                        id="preview-reload-btn"
                        className="preview-btn preview-btn--icon"
                        disabled={isLoadingHtml}
                        aria-label="Reload AI draft"
                        title="Reload AI draft"
                    >
                        {isLoadingHtml ? (
                            <svg className="preview-spinner" viewBox="0 0 50 50" width="16" height="16" aria-hidden="true">
                                <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="currentColor" strokeLinecap="round" strokeDasharray="1, 150" strokeDashoffset="0" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                            </svg>
                        )}
                    </button>

                    {/* Print */}
                    <button
                        onClick={handlePrint}
                        id="preview-print-btn"
                        className="preview-btn preview-btn--ghost"
                        disabled={isLoadingHtml || !resumeHtml}
                        title="Print / Save as PDF via Browser"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        <span>Print</span>
                    </button>

                    {/* Download PDF */}
                    <button
                        onClick={handleDownloadPdf}
                        id="preview-download-btn"
                        className="preview-btn preview-btn--primary"
                        disabled={isExporting || isLoadingHtml || !resumeHtml}
                        aria-busy={isExporting}
                    >
                        {isExporting ? (
                            <>
                                <svg className="preview-spinner" viewBox="0 0 50 50" width="15" height="15" aria-hidden="true">
                                    <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="currentColor" strokeLinecap="round" strokeDasharray="1, 150" strokeDashoffset="0" />
                                </svg>
                                <span>Generating PDF...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>Download PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* ── Editor Canvas Area ── */}
            <main className="preview-viewer" aria-label="Resume Editor Canvas">
                {isLoadingHtml && <LoadingOverlay />}
                {!isLoadingHtml && error && <ErrorOverlay message={error} onRetry={loadResumeHtml} />}
                {!isLoadingHtml && !error && (
                    <ResumeEditor
                        initialContent={resumeHtml}
                        onContentChange={(updatedHtml) => setResumeHtml(updatedHtml)}
                        editorRef={editorRef}
                    />
                )}
            </main>

            {/* ── Status Bar ── */}
            <footer className="preview-statusbar">
                <div className="preview-statusbar__left">
                    <span className={`preview-statusbar__dot${statusDotMod ? ' preview-statusbar__dot' + statusDotMod : ''}`} aria-hidden="true" />
                    <span>{statusLabel}</span>
                </div>
                <div className="preview-statusbar__right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Editable TipTap Editor · Client-Side PDF</span>
                </div>
            </footer>
        </div>
    )
}

export default Preview

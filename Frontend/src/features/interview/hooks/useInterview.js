import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useCallback } from "react"
import { InterviewContext } from "../interview.context"

export const useInterview = () => {
    const context = useContext(InterviewContext)

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, reportsLoading, setReportsLoading, report, setReport, reports, setReports } = context

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            }
        } catch (error) {
            console.log(error)
            throw error
        } finally {
            setLoading(false)
        }
        return null
    }, [setLoading, setReport])

    const getReportById = useCallback(async (interviewId) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            }
        } catch (error) {
            console.log(error)
            throw error
        } finally {
            setLoading(false)
        }
        return null
    }, [setLoading, setReport])

    const getReports = useCallback(async () => {
        setReportsLoading(true)
        try {
            const response = await getAllInterviewReports()
            if (response && response.interviewReports) {
                setReports(response.interviewReports)
                return response.interviewReports
            }
        } catch (error) {
            console.log(error)
            throw error
        } finally {
            setReportsLoading(false)
        }
        return []
    }, [setReportsLoading, setReports])

    const fetchResumeHtml = useCallback(async (interviewReportId) => {
        try {
            const response = await generateResumePdf({ interviewReportId })
            let htmlContent = ''
            if (typeof response === 'string') {
                htmlContent = response
            } else if (response && typeof response.html === 'string') {
                htmlContent = response.html
            } else if (response && response.data && typeof response.data.html === 'string') {
                htmlContent = response.data.html
            }

            if (htmlContent.includes('%PDF-')) {
                throw new Error("Received binary PDF data instead of HTML. Please try clicking 'Reload' to generate fresh HTML.")
            }

            return htmlContent || '<p>Resume generated. Click to edit content.</p>'
        } catch (error) {
            console.error("fetchResumeHtml error:", error)
            throw error
        }
    }, [])

    return {
        loading,
        reportsLoading,
        report,
        reports,
        generateReport,
        getReportById,
        getReports,
        fetchResumeHtml
    }
}

const pdfParse = require("pdf-parse")
const mongoose = require("mongoose")
const { generateInterviewReport, generateResumeHtml } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body

        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({
                message: "Job description is required."
            })
        }

        if (!req.file && (!selfDescription || !selfDescription.trim())) {
            return res.status(400).json({
                message: "Either a resume file or a self description is required."
            })
        }

        let resumeText = ""
        if (req.file) {
            try {
                const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
                resumeText = resumeContent.text || ""
            } catch (pdfError) {
                console.error("PDF Parsing error:", pdfError)
                return res.status(400).json({
                    message: "Failed to parse the uploaded resume. Please ensure it is a valid, uncorrupted PDF."
                })
            }
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            ...interViewReportByAi
        })

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Generate Interview Report Error:", error)

        if (error.name === 'AiServiceError' && error.status === 503) {
            return res.status(503).json({
                error: {
                    code: 'AI_SERVICE_UNAVAILABLE',
                    message: error.message
                }
            })
        }

        return res.status(500).json({
            message: error.message || "An error occurred while generating the interview plan."
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        if (!mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({
                message: "Invalid interview report ID format."
            })
        }

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id }).lean()

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Get Interview Report Error:", error)
        return res.status(500).json({
            message: "An error occurred while fetching the interview report."
        })
    }
}

/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")
            .lean()

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (error) {
        console.error("Get All Interview Reports Error:", error)
        return res.status(500).json({
            message: "An error occurred while fetching the interview reports."
        })
    }
}

/**
 * @description Controller to generate resume HTML based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        if (!mongoose.Types.ObjectId.isValid(interviewReportId)) {
            return res.status(400).json({
                message: "Invalid interview report ID format."
            })
        }

        const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found or unauthorized."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const htmlContent = await generateResumeHtml({
            resume: resume || "",
            jobDescription: jobDescription || "",
            selfDescription: selfDescription || ""
        })

        return res.status(200).json({
            message: "Resume HTML generated successfully.",
            html: htmlContent
        })
    } catch (error) {
        console.error("Generate Resume Error:", error)
        return res.status(500).json({
            message: "An error occurred while generating the resume."
        })
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
}

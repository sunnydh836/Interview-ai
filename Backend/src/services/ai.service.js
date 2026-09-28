const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

function parseJsonResponse(text) {
    if (!text) {
        throw new Error("Empty AI response received.");
    }

    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse raw JSON. Attempting regex extraction...", e);
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (innerError) {
                console.error("Regex JSON extraction also failed:", innerError);
            }
        }
        throw new Error("Failed to parse JSON response from Gemini AI.");
    }
}

class AiServiceError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'AiServiceError';
    }
}

async function withRetry(operation, maxRetries = 3) {
    let attempt = 1;
    while (attempt <= maxRetries) {
        try {
            return await operation();
        } catch (error) {
            const isTransient = error?.status === 503 || error?.status === 429;
            if (isTransient && attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt - 1) * 1500 + Math.random() * 500;
                console.warn(`Gemini API transient error (${error?.status}). Retrying in ${Math.round(waitTime)}ms (Attempt ${attempt} of ${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                attempt++;
            } else if (isTransient && attempt === maxRetries) {
                console.error(`Gemini API permanently failed after ${maxRetries} attempts.`);
                throw new AiServiceError("The AI service is temporarily busy. Please try again in a moment.", 503);
            } else {
                throw error;
            }
        }
    }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await withRetry(async () => {
        return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            }
        })
    });

    return parseJsonResponse(response.text)
}

async function generatePdfFromHtml(htmlContent) {
    let browser;

    try {
        console.log("PDF Generation: Launching Puppeteer browser...");
        console.log("PDF Generation Environment Info:", {
            PUPPETEER_SKIP_DOWNLOAD: process.env.PUPPETEER_SKIP_DOWNLOAD,
            NODE_ENV: process.env.NODE_ENV,
            cwd: process.cwd()
        });

        const launchOptions = {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu"
            ]
        };

        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        browser = await puppeteer.launch(launchOptions);

        console.log("PDF Generation: Puppeteer browser launched successfully.");
        const page = await browser.newPage();

        await page.setContent(htmlContent, {
            waitUntil: "networkidle0"
        });

        console.log("PDF Generation: Generating PDF buffer...");
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        });

        console.log("PDF Generation: PDF buffer generated successfully.");
        return pdfBuffer;

    } catch (error) {
        console.error("PDF Generation: PDF generation failed during Puppeteer execution. Details:", error);
        throw error;

    } finally {
        if (browser) {
            console.log("PDF Generation: Closing Puppeteer browser...");
            await browser.close();
        }
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                    Resume: ${resume}
                    Self Description: ${selfDescription}
                    Job Description: ${jobDescription}

                    the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                    The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                    The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                    you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                    
                    CRITICAL REQUIREMENT FOR LINKS AND CONTACT DETAILS:
                    All URLs (GitHub, LinkedIn, personal website, portfolio, etc.), email addresses, and phone numbers must be rendered as proper clickable HTML hyperlinks using anchor tags. Do not output these URLs/contact details as plain text. Ensure the style of anchor tags fits professional styling (e.g., color, underlinings, etc.) so they look professional and clean.
                    Use the following formatting exactly:
                    - GitHub: <a href="https://github.com/username">https://github.com/username</a>
                    - LinkedIn: <a href="https://linkedin.com/in/username">https://linkedin.com/in/username</a>
                    - Email: <a href="mailto:example@gmail.com">example@gmail.com</a>
                    - Phone: <a href="tel:+911234567890">+91 12345 67890</a>
                    
                    The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                    The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = parseJsonResponse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf, AiServiceError }
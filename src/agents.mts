import { Ollama } from "@langchain/ollama";
import axios from "axios";
import pdfParse from "pdf-parse";

const llm = new Ollama({ model: "gpt-oss:latest" });

// Extract job description using LLM context analysis
const extractJobDescriptionWithLLM = async (html: string): Promise<string> => {
    try {
        // Clean HTML by removing scripts, styles, and excessive whitespace
        const cleanHtml = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 20000); // Limit input size

        const prompt = `You are an expert at extracting job descriptions from web pages.

Analyze the following web page content and extract the main job description. Look for:
- Job responsibilities and requirements
- Key qualifications and skills needed
- Company information and role details
- Any specific duties or expectations

Ignore:
- Navigation menus
- Footer content
- Advertisements
- Application instructions
- Company policies

Web page content:
${cleanHtml}

Extract and return ONLY the job description text. If no clear job description is found, return "No job description found in the content."`;

        const response = await llm.invoke(prompt);
        const extractedText = response as string;

        // Clean up the response
        return extractedText.trim() || "No job description could be extracted from this page.";
    } catch (error) {
        console.error("Error extracting job description with LLM:", error);
        return "Error: Could not extract job description";
    }
};

// Simple functions instead of complex LangChain tools
const scrapeJobDescription = async (url: string): Promise<string> => {
    try {
        const response = await axios.get(url);
        return await extractJobDescriptionWithLLM(response.data);
    } catch (error) {
        console.error("Error scraping job description:", error);
        return "Error: Could not scrape job description";
    }
};

const parseCV = async (cvBuffer: Buffer): Promise<string> => {
    try {
        const data = await pdfParse(cvBuffer);
        return data.text;
    } catch (error) {
        console.error("Error parsing CV:", error);
        return "Error: Could not parse CV";
    }
};

// Simple workflow without complex agents
export const generateCoverLetter = async (jobUrl: string, cvBuffer: Buffer) => {
    try {
        console.log("Starting cover letter generation...");

        // Step 1: Scrape job description
        console.log("Scraping job description...");
        const jobDescription = await scrapeJobDescription(jobUrl);
        console.log("Job description scraped successfully");

        // Step 2: Parse CV with pdf-parse
        console.log("Parsing CV with pdf-parse...");
        const cvText = await parseCV(cvBuffer);
        console.log("CV parsed successfully");

        // Step 3: Generate cover letter using Ollama directly
        console.log("Generating cover letter...");
        const prompt = `You are an expert career coach and professional writer.

Using the following job description and CV, write a tailored, professional cover letter in English.

Job Description:
${jobDescription}

CV:
${cvText}

The cover letter should be:
- Concise (max 1 page)
- Formal yet engaging
- Highlight most relevant experiences and skills
- Clear structure: introduction, motivation, skills alignment, strong closing
- Confident, enthusiastic tone adapted to the company

Write the cover letter:`;

        const response = await llm.invoke(prompt);
        const coverLetter = response as string;

        console.log("Cover letter generated successfully");

        return {
            jobDescription,
            cvText,
            coverLetter
        };
    } catch (error) {
        console.error("Error in generateCoverLetter:", error);
        throw error;
    }
};

// Export individual functions for testing
export { scrapeJobDescription, parseCV };
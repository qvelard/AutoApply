import { Ollama } from "@langchain/ollama";
import { chromium } from "playwright";
import pdfParse from "pdf-parse";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

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

// Extract job description using Playwright for better rendering
const scrapeJobDescriptionWithPlaywright = async (url: string): Promise<string> => {
    let browser;
    try {
        console.log(`Launching browser to scrape: ${url}`);
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // Set user agent to avoid bot detection
        await page.context().setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });

        // Navigate to the page with timeout
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait a bit for dynamic content to load
        await page.waitForTimeout(2000);

        // Try to find job description content using common selectors
        const contentSelectors = [
            '[data-testid*="job-description"]',
            '[data-testid*="jobDescription"]',
            '.job-description',
            '.job-detail',
            '.job-content',
            '.description',
            '[class*="job-description"]',
            '[class*="jobDescription"]',
            'main',
            'article',
            '.content'
        ];

        let pageContent = '';
        for (const selector of contentSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    const text = await element.textContent();
                    if (text && text.length > 100) { // Only use if substantial content
                        pageContent = text;
                        console.log(`Found content using selector: ${selector}`);
                        break;
                    }
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Fallback: get all text content from body if no specific selector worked
        if (!pageContent) {
            pageContent = await page.evaluate(() => {
                // Remove script and style elements
                const scripts = document.querySelectorAll('script, style');
                scripts.forEach(script => script.remove());

                // Get text content
                return document.body.textContent || '';
            });
            console.log('Using fallback: extracted all body text');
        }

        console.log(`Extracted ${pageContent.length} characters from page`);

        // Use LLM to extract job description from the content
        return await extractJobDescriptionWithLLM(pageContent);

    } catch (error) {
        console.error("Error scraping with Playwright:", error);
        return "Error: Could not scrape job description";
    } finally {
        if (browser) {
            await browser.close();
        }
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

// Extract personal information from CV text using LLM
const extractPersonalInfo = async (cvText: string): Promise<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
}> => {
    try {
        const prompt = `You are an expert at extracting personal information from CV/resume text.

From the following CV text, extract the following information:
- First Name (Prénom)
- Last Name (Nom de famille)
- Email address
- Phone number (if available)
- Address (if available)

Return the information in JSON format with these exact keys: firstName, lastName, email, phone, address.
If any information is not found, use an empty string for that field.

CV Text:
${cvText.substring(0, 4000)}`; // Limit input size

        const response = await llm.invoke(prompt);
        const extractedText = response as string;

        // Try to parse JSON response
        try {
            const parsed = JSON.parse(extractedText);
            return {
                firstName: parsed.firstName || '',
                lastName: parsed.lastName || '',
                email: parsed.email || '',
                phone: parsed.phone || '',
                address: parsed.address || ''
            };
        } catch (parseError) {
            console.warn("Could not parse LLM response as JSON, using fallback extraction");
            // Fallback: extract using regex patterns
            return extractPersonalInfoFallback(cvText);
        }
    } catch (error) {
        console.error("Error extracting personal info:", error);
        return {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: ''
        };
    }
};

// Fallback function using regex patterns
const extractPersonalInfoFallback = (cvText: string) => {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    // More robust phone regex to handle various formats including French numbers
    const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?(\d{1,4})\)?[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})?[-.\s]?(\d{1,4})?\b/g;

    const email = emailRegex.exec(cvText)?.[0] || '';
    const phoneMatch = phoneRegex.exec(cvText);
    let phone = phoneMatch ? phoneMatch[0] : '';

    // Clean up phone number (remove extra spaces and normalize)
    phone = phone.replace(/\s+/g, ' ').trim();

    // Try to extract name (this is more complex, look for patterns at the top)
    const lines = cvText.split('\n').slice(0, 15); // First 15 lines for better coverage
    let firstName = '';
    let lastName = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.includes('@') && !phoneRegex.test(trimmed)) {
            // Remove phone numbers from the line if they're mixed with name
            let cleanLine = trimmed.replace(phoneRegex, '').trim();

            // Also try to remove email if it's on the same line
            cleanLine = cleanLine.replace(emailRegex, '').trim();

            const words = cleanLine.split(/\s+/).filter(word => word.length > 1); // Filter out single chars
            if (words.length >= 2) {
                firstName = words[0];
                lastName = words.slice(1).join(' ');
                // Clean up any remaining artifacts
                lastName = lastName.replace(/[^\w\s-]/g, '').trim();
                break;
            } else if (words.length === 1 && !firstName) {
                // If only one word found, check if it could be a first name
                firstName = words[0];
            }
        }
    }

    // If we didn't find a proper last name, try to split the first long word
    if (!lastName && firstName.includes('+')) {
        const parts = firstName.split('+');
        if (parts.length >= 2) {
            firstName = parts[0].trim();
            // The rest might be phone or other info, ignore for name
        }
    }

    return {
        firstName,
        lastName,
        email,
        phone,
        address: '' // Address extraction is complex, leave empty for fallback
    };
};

// Generate PDF from cover letter text with personal info
const generateCoverLetterPDF = (coverLetterText: string, personalInfo: any, jobTitle?: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Cover Letter',
                    Author: 'AutoApply AI',
                    Subject: jobTitle ? `Cover Letter for ${jobTitle}` : 'Cover Letter'
                }
            });

            const buffers: Buffer[] = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Add personal information header
            if (personalInfo.firstName || personalInfo.lastName) {
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .text(`${personalInfo.firstName} ${personalInfo.lastName}`.trim())
                   .moveDown(0.5);
            }

            if (personalInfo.address) {
                doc.fontSize(10)
                   .font('Helvetica')
                   .text(personalInfo.address)
                   .moveDown(0.5);
            }

            if (personalInfo.email || personalInfo.phone) {
                const contactInfo = [personalInfo.email, personalInfo.phone].filter(Boolean).join(' | ');
                doc.fontSize(10)
                   .font('Helvetica')
                   .text(contactInfo)
                   .moveDown(1);
            }

            // Add date
            const today = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.fontSize(11)
               .text(today, { align: 'right' })
               .moveDown(2);

            // Add cover letter content
            doc.fontSize(11)
               .font('Helvetica')
               .text(coverLetterText, {
                   align: 'left',
                   lineGap: 5
               });

            // Add footer
            doc.moveDown(2);
            doc.fontSize(9)
               .font('Helvetica-Oblique')
               .text('Generated by AutoApply AI', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

// Simple workflow without complex agents
export const generateCoverLetter = async (jobUrl: string, cvBuffer: Buffer): Promise<Buffer> => {
    try {
        console.log("Starting cover letter generation...");

        // Step 1: Scrape job description
        console.log("Scraping job description...");
        const jobDescription = await scrapeJobDescriptionWithPlaywright(jobUrl);
        console.log("Job description scraped successfully");

        // Step 2: Parse CV with pdf-parse
        console.log("Parsing CV with pdf-parse...");
        const cvText = await parseCV(cvBuffer);
        console.log("CV parsed successfully");

        // Step 3: Extract personal information from CV
        console.log("Extracting personal information from CV...");
        const personalInfo = await extractPersonalInfo(cvText);
        console.log("Personal info extracted:", personalInfo);

        // Step 4: Generate cover letter using Ollama directly
        console.log("Generating cover letter...");
        const prompt = `You are an expert career coach and professional writer.

Using the following job description and CV, write a tailored, professional cover letter in English.

Job Description:
${jobDescription}

CV:
${cvText}

Personal Information (use this for the letter header):
- Name: ${personalInfo.firstName} ${personalInfo.lastName}
- Email: ${personalInfo.email}
- Phone: ${personalInfo.phone}
- Address: ${personalInfo.address}

CRITICAL LENGTH CONSTRAINT: The cover letter MUST fit on a single A4 page. The header (name, contact info, date) will take approximately 40% of the page. You have only about 400-500 words maximum for the main content.

MOST IMPORTANT GUIDELINES: Don't use any * or ** or - or --

The cover letter should be:
- Formal yet engaging
- Highlight most relevant experiences and skills
- Clear structure: introduction, motivation, skills alignment, strong closing
- Confident, enthusiastic tone adapted to the company
- Include the candidate's contact information at the top

Write the cover letter content (without the header information, as it will be added to the PDF separately). Keep it brief - aim for 300-400 words maximum.`;

        const response = await llm.invoke(prompt);
        const coverLetterText = response as string;

        console.log("Cover letter text generated successfully");

        // Step 5: Generate PDF from the cover letter text with personal info
        console.log("Generating PDF...");
        const coverLetterPDF = await generateCoverLetterPDF(coverLetterText, personalInfo);
        console.log("PDF generated successfully");

        return coverLetterPDF;
    } catch (error) {
        console.error("Error in generateCoverLetter:", error);
        throw error;
    }
};

// Export individual functions for testing
export { scrapeJobDescriptionWithPlaywright, parseCV, generateCoverLetterPDF, extractPersonalInfo };

// Utility function to save PDF to file (optional)
export const saveCoverLetterPDF = async (pdfBuffer: Buffer, filename: string = 'cover_letter.pdf'): Promise<string> => {
    const outputPath = path.join(process.cwd(), filename);
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`PDF saved to: ${outputPath}`);
    return outputPath;
};
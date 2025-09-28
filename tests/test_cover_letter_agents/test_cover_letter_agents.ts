import { generateCoverLetter, extractPersonalInfo, parseCV, scrapeJobDescriptionWithPlaywright, generateCoverLetterPDF, saveCoverLetterPDF } from '../../src/cover_letter_agents';
import fs from 'fs';
import path from 'path';

// Version with mock job description for testing (only in test file)
const generateCoverLetterWithMockJob = async (jobDescription: string, cvBuffer: Buffer): Promise<Buffer> => {
    // Import Ollama for testing
    const { Ollama } = await import("@langchain/ollama");
    const llm = new Ollama({ model: "gpt-oss:latest" });

    try {
        console.log("Starting cover letter generation with mock job description...");

        // Step 1: Use provided mock job description
        console.log("Using mock job description");

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
- Highlight most relevant experiences and skills matching the job description
- Clear structure: introduction, motivation, skills alignment, strong closing
- Confident, enthusiastic tone adapted to the company

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
        console.error("Error in generateCoverLetterWithMockJob:", error);
        throw error;
    }
};

async function testCoverLetterAgents() {
    console.log('🚀 Starting Cover Letter Agents Tests...\n');

    try {
        // Test URLs for job descriptions (using real job sites)
        const testUrls = [
            'https://www.linkedin.com/jobs/search/?alertAction=viewjobs&currentJobId=4303969195&distance=50&expansionTypes=EXPAND_LOCATION_RADIUS%2CEXPAND_SEARCH_TIME_RANGE_7_DAYS&f_TPR=a1759001342-&f_WT=1&geoId=101240143&keywords=Ing%C3%A9nieur%20en%20apprentissage%20machine&origin=JOB_ALERT_SMART_EXPANSION_IN_APP_NOTIFICATION&originToLandingJobPostings=4303969195&savedSearchFullUrlEnabled=true&savedSearchId=7886856938&sortBy=R',
            'https://www.indeed.com/viewjob?jk=1234567890abcdef',
            'https://www.welcometothejungle.com/fr/companies/hermes/jobs/cdi-responsable-de-projets-creation-communication-h-f_pantin'
        ];

        // Use a sample URL for testing (we'll use a mock/test approach)
        const testJobUrl = 'https://example.com/job/software-engineer'; // This will fail but test error handling

        // Test CV parsing
        console.log('📄 Testing CV parsing...');
        const cvPath = path.join(process.cwd(), 'doc', 'cv1.pdf');
        if (!fs.existsSync(cvPath)) {
            console.error('❌ CV file not found:', cvPath);
            return;
        }

        const cvBuffer = fs.readFileSync(cvPath);
        console.log('✅ CV file loaded, size:', cvBuffer.length, 'bytes');

        const cvText = await parseCV(cvBuffer);
        console.log('✅ CV parsed successfully, text length:', cvText.length, 'characters');
        console.log('📝 CV preview:', cvText.substring(0, 200) + '...\n');

        // Test personal info extraction
        console.log('👤 Testing personal info extraction...');
        const personalInfo = await extractPersonalInfo(cvText);
        console.log('✅ Personal info extracted:');
        console.log('   - Name:', `${personalInfo.firstName} ${personalInfo.lastName}`.trim());
        console.log('   - Email:', personalInfo.email || 'Not found');
        console.log('   - Phone:', personalInfo.phone || 'Not found');
        console.log('   - Address:', personalInfo.address || 'Not found');
        console.log('');

        // Test job description scraping (with error handling)
        console.log('🌐 Testing job description scraping...');
        try {
            const jobDescription = await scrapeJobDescriptionWithPlaywright(testJobUrl);
            console.log('✅ Job description scraped successfully');
            console.log('📝 Job description preview:', jobDescription.substring(0, 200) + '...\n');
        } catch (error) {
            console.log('⚠️  Job scraping failed (expected for test URL):', (error as Error).message);
            console.log('   Using mock job description for PDF generation test...\n');

            // Test PDF generation with mock data
            console.log('📄 Testing PDF generation with mock data...');
            const mockCoverLetterText = `
Dear Hiring Manager,

I am writing to express my interest in the Software Engineer position at your company. With my background in web development and passion for creating innovative solutions, I am excited about the opportunity to contribute to your team.

Throughout my career, I have developed strong skills in JavaScript, TypeScript, and React, which align perfectly with the requirements of this role. I have successfully delivered multiple web applications and collaborated effectively with cross-functional teams.

I am particularly drawn to your company's innovative approach and would welcome the opportunity to discuss how my experience and enthusiasm can contribute to your continued success.

Thank you for considering my application. I look forward to the possibility of discussing this exciting opportunity with you.

Best regards,
${personalInfo.firstName} ${personalInfo.lastName}
            `;

            const pdfBuffer = await generateCoverLetterPDF(mockCoverLetterText, personalInfo, 'Software Engineer');
            console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');

            // Save the PDF for verification
            const outputPath = await saveCoverLetterPDF(pdfBuffer, 'test_cover_letter.pdf');
            console.log('✅ PDF saved to:', outputPath);
            console.log('');
        }

        // Test full pipeline with mock job description (real CV parsing, info extraction, and LLM generation)
        console.log('🔄 Testing full cover letter generation pipeline with mock job description...');
        try {
            const mockJobDescription = `
Senior Software Engineer Position at TechCorp

We are seeking a talented Senior Software Engineer to join our innovative team at TechCorp, a leading technology company focused on building scalable web applications and AI-powered solutions.

Key Responsibilities:
- Design and develop scalable web applications using modern technologies
- Collaborate with cross-functional teams including product, design, and QA
- Mentor junior developers and contribute to code review processes
- Optimize application performance and ensure high availability
- Participate in architectural decisions and technical planning

Requirements:
- 5+ years of experience in full-stack development
- Strong proficiency in JavaScript, TypeScript, and React
- Experience with Node.js, Express, and RESTful APIs
- Knowledge of cloud platforms (AWS, GCP, or Azure)
- Experience with databases (PostgreSQL, MongoDB)
- Familiarity with DevOps practices and CI/CD pipelines
- Excellent problem-solving skills and attention to detail

What We Offer:
- Competitive salary and equity package
- Comprehensive health and dental insurance
- Flexible working hours and remote work options
- Professional development budget
- Modern office with great amenities
- Opportunity to work on cutting-edge projects

TechCorp is committed to fostering an inclusive and innovative work environment where employees can grow professionally while contributing to meaningful projects that impact millions of users worldwide.
            `;

            const fullPdfBuffer = await generateCoverLetterWithMockJob(mockJobDescription, cvBuffer);
            console.log('✅ Full pipeline with mock job completed successfully');
            console.log('📄 Final PDF size:', fullPdfBuffer.length, 'bytes');

            const finalOutputPath = await saveCoverLetterPDF(fullPdfBuffer, path.join(process.cwd(), 'doc', 'full_cover_letter_mock.pdf'));
            console.log('✅ Final PDF saved to:', finalOutputPath);
        } catch (error) {
            console.log('❌ Full pipeline with mock job failed:', (error as Error).message);
        }

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        throw error;
    }
}

// Run the tests
testCoverLetterAgents().catch(console.error);
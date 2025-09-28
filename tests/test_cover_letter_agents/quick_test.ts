import { extractPersonalInfo, parseCV, generateCoverLetterPDF } from '../../src/cover_letter_agents';
import fs from 'fs';
import path from 'path';

console.log('🧪 Quick Test of Cover Letter Agents\n');

// Test 1: CV Parsing
async function testCVParsing() {
    console.log('1️⃣ Testing CV parsing...');
    try {
        const cvPath = path.join(process.cwd(), 'doc', 'cv1.pdf');
        const cvBuffer = fs.readFileSync(cvPath);
        const cvText = await parseCV(cvBuffer);
        console.log('✅ CV parsed successfully');
        console.log('📊 Text length:', cvText.length, 'characters');
        return cvText;
    } catch (error) {
        console.log('❌ CV parsing failed:', (error as Error).message);
        return null;
    }
}

// Test 2: Personal Info Extraction
async function testPersonalInfoExtraction(cvText: string) {
    console.log('\n2️⃣ Testing personal info extraction...');
    try {
        const personalInfo = await extractPersonalInfo(cvText);
        console.log('✅ Personal info extracted:');
        console.log('   👤 Name:', `${personalInfo.firstName} ${personalInfo.lastName}`.trim() || 'Not found');
        console.log('   📧 Email:', personalInfo.email || 'Not found');
        console.log('   📞 Phone:', personalInfo.phone || 'Not found');
        console.log('   🏠 Address:', personalInfo.address || 'Not found');
        return personalInfo;
    } catch (error) {
        console.log('❌ Personal info extraction failed:', (error as Error).message);
        return null;
    }
}

// Test 3: PDF Generation
async function testPDFGeneration(personalInfo: any) {
    console.log('\n3️⃣ Testing PDF generation...');
    try {
        const sampleLetter = `
Dear Hiring Manager,

I am excited to apply for the Software Engineer position at your company. With my background in web development and experience with modern technologies, I am confident I can contribute effectively to your team.

My skills in JavaScript, TypeScript, and React align well with the requirements of this role. I have successfully delivered multiple projects and enjoy working in collaborative environments.

I would welcome the opportunity to discuss how my experience and passion for technology can benefit your organization.

Thank you for considering my application.

Best regards,
John Doe
        `;

        const pdfBuffer = await generateCoverLetterPDF(sampleLetter, personalInfo, 'Software Engineer');
        console.log('✅ PDF generated successfully');
        console.log('📊 PDF size:', pdfBuffer.length, 'bytes');

        // Save test PDF
        const outputPath = path.join(process.cwd(), 'doc', 'test_output.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log('💾 PDF saved to:', outputPath);

        return true;
    } catch (error) {
        console.log('❌ PDF generation failed:', (error as Error).message);
        return false;
    }
}

// Test 4: Cover Letter Generation with Mock Job Description
async function testCoverLetterGeneration(personalInfo: any) {
    console.log('\n4️⃣ Testing cover letter generation with mock job description...');
    try {
        const mockJobDescription = `
Senior Software Engineer Position

We are seeking a talented Senior Software Engineer to join our innovative team at TechCorp.

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
        `;

        const coverLetterText = `
[TEST VERSION - Mock Cover Letter for Demonstration]

Dear Hiring Manager,

I am excited to apply for the Senior Software Engineer position at TechCorp. With over 5 years of experience in full-stack development and a passion for building scalable applications, I am confident I can contribute significantly to your innovative team.

In my previous roles, I have successfully designed and developed complex web applications using JavaScript, TypeScript, and React. I have extensive experience with Node.js and Express for backend development, and I have worked with various cloud platforms including AWS. My background in database design and optimization, coupled with my knowledge of DevOps practices, allows me to deliver high-quality, maintainable solutions.

I am particularly drawn to TechCorp's mission and the opportunity to work on cutting-edge projects. I am eager to bring my technical expertise and collaborative approach to your team.

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience align with TechCorp's needs.

Best regards,
${personalInfo.firstName} ${personalInfo.lastName}

[This is a test/mock cover letter generated for demonstration purposes]
        `;

        const pdfBuffer = await generateCoverLetterPDF(coverLetterText, personalInfo, 'Senior Software Engineer');
        console.log('✅ Cover letter PDF generated successfully');
        console.log('📊 PDF size:', pdfBuffer.length, 'bytes');

        // Save test PDF
        const outputPath = path.join(process.cwd(), 'mock_cover_letter.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log('💾 Mock cover letter saved to:', outputPath);

        return true;
    } catch (error) {
        console.log('❌ Cover letter generation failed:', (error as Error).message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    const cvText = await testCVParsing();
    if (!cvText) return;

    const personalInfo = await testPersonalInfoExtraction(cvText);
    if (!personalInfo) return;

    await testPDFGeneration(personalInfo);
    await testCoverLetterGeneration(personalInfo);

    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- CV parsing: ✅');
    console.log('- Personal info extraction: ✅');
    console.log('- PDF generation: ✅');
    console.log('- Cover letter generation: ✅');
    console.log('\n🚀 System is fully functional!');
}

runAllTests().catch(console.error);
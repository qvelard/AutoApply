import { Worker } from 'bullmq';
import * as fs from 'fs/promises';
import { processJobData, generateCoverLetter } from './cover_letter_agents.mjs';
import { automateApplication } from './automation';

// Worker
new Worker('jobApplications', async (job) => {
  const { url, cvPath, info } = job.data;

  try {
    // Agents: Process data
    const { jdText, cvText } = await processJobData(url, cvPath);

    // Generate Cover Letter
    const coverLetter = await generateCoverLetter(jdText, cvText, info);

    // Automate Browser
    const result = await automateApplication(url, coverLetter, cvPath, info);

    // Log/Store result (e.g., to DB)
    console.log({ coverLetter, result });

    return { coverLetter, result };
  } finally {
    // Cleanup
    await fs.unlink(cvPath).catch(() => {});
  }
});
import dotenv from 'dotenv';
import axios from 'axios';
import { getUploadUrl, streamFile } from './build/src/services/r2Service.js';

dotenv.config();

const SAMPLE_CLIPPINGS = `Deep Work: Rules for Focused Success in a Distracted World (Cal Newport)
- Your Highlight on page 34 | Location 521-523 | Added on Thursday, December 28, 2023 14:23:20

To simply wait and be bored has become a novel experience in modern life, but from the perspective of concentration training, it's incredibly valuable.
==========
Deep Work: Rules for Focused Success in a Distracted World (Cal Newport)
- Your Highlight on page 56 | Location 849-851 | Added on Thursday, December 28, 2023 16:45:32

The key to developing a deep work habit is to move beyond good intentions and add routines and rituals to your working life designed to minimize the amount of your limited willpower necessary to transition into and maintain a state of unbroken concentration.
==========`;

async function testR2() {
  try {
    // Test file upload with Kindle clippings format
    const testFileName = `test-clippings-${Date.now()}.txt`;
    
    console.log('\nTesting R2 Upload with Kindle clippings...');
    const uploadUrl = await getUploadUrl(testFileName);
    console.log('Upload URL generated:', uploadUrl);

    // Upload content using the pre-signed URL
    await axios.put(uploadUrl, SAMPLE_CLIPPINGS, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    console.log('File uploaded successfully');

    // Test file streaming
    console.log('\nTesting R2 Streaming...');
    const fileStream = await streamFile(testFileName);
    let streamedContent = '';

    for await (const chunk of fileStream) {
      streamedContent += chunk.toString();
    }

    console.log('Content length matches:', streamedContent.length === SAMPLE_CLIPPINGS.length);
    console.log('\nUploaded file name:', testFileName);
    console.log('\nR2 Test completed successfully');

    // Return the filename so it can be used for processing
    return testFileName;
  } catch (error) {
    console.error('\nR2 Test failed:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

// Run the test and process the file
async function main() {
  const fileName = await testR2();
  console.log('\nTesting processHighlights with file:', fileName);
  
  // Set the environment variable
  process.env.FILE_NAME = fileName;
  
  // Import and run processHighlights
  await import('./processHighlights.js');
}

main().catch(console.error);

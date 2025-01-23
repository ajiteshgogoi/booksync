import dotenv from 'dotenv';
import axios from 'axios';
import { getUploadUrl, streamFile } from './build/src/services/r2Service.js';

dotenv.config();

async function testR2() {
  try {
    // Test file upload
    const testFileName = `test-file-${Date.now()}.txt`;
    const testContent = 'This is a test file content for R2 storage testing.';
    
    console.log('\nTesting R2 Upload...');
    const uploadUrl = await getUploadUrl(testFileName);
    console.log('Upload URL generated:', uploadUrl);

    // Upload content using the pre-signed URL
    await axios.put(uploadUrl, testContent, {
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

    console.log('Streamed content:', streamedContent);
    console.log('Content matches:', streamedContent === testContent);
    
    console.log('\nR2 Test completed successfully');
  } catch (error) {
    console.error('\nR2 Test failed:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testR2();

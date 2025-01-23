require('dotenv').config();
const { getUploadUrl } = require('./src/services/r2Service.js');

async function testR2() {
  try {
    const testFileName = `test-file-${Date.now()}.txt`;
    const url = await getUploadUrl(testFileName);
    console.log('R2 Upload URL generated successfully:');
    console.log(url);
  } catch (error) {
    console.error('R2 Upload URL generation failed:');
    console.error(error);
  }
}

testR2();

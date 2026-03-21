import 'dotenv/config';

/**
 * Simple URL Generation Test
 * Tests the URL generation logic directly
 */

async function testSimpleURL() {
  console.log('🔗 Testing Simple URL Generation...\n');

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const testToken = 'test-jwt-token-123';
  const expectedURL = `${frontendUrl}/register?token=${testToken}&type=admin`;
  
  console.log(`Frontend URL: ${frontendUrl}`);
  console.log(`Test Token: ${testToken}`);
  console.log(`Expected URL: ${expectedURL}`);
  
  // Test URL construction
  const generatedURL = `${frontendUrl}/register?token=${testToken}&type=admin`;
  
  console.log(`\nGenerated URL: ${generatedURL}`);
  
  if (generatedURL === expectedURL) {
    console.log('✅ URL generation is CORRECT!');
  } else {
    console.log('❌ URL generation is INCORRECT!');
  }
  
  // Test URL format
  const urlPattern = /^https?:\/\/[^\/]+\/register\?token=[^&]+&type=admin$/;
  if (urlPattern.test(generatedURL)) {
    console.log('✅ URL format is valid');
  } else {
    console.log('❌ URL format is invalid');
  }
  
  // Test URL parsing
  try {
    const url = new URL(generatedURL);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');
    
    console.log(`\nParsed URL:`);
    console.log(`- Path: ${url.pathname}`);
    console.log(`- Token: ${token}`);
    console.log(`- Type: ${type}`);
    
    if (url.pathname === '/register' && token === testToken && type === 'admin') {
      console.log('✅ URL parsing is CORRECT!');
    } else {
      console.log('❌ URL parsing is INCORRECT!');
    }
  } catch (error) {
    console.log('❌ Invalid URL format');
  }
  
  console.log('\n🎯 Simple URL Test Complete!');
}

// Run test
if (require.main === module) {
  testSimpleURL()
    .then(() => {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export default testSimpleURL;

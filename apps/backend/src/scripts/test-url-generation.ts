import 'dotenv/config';
import { EmailService } from '../services/email.service';

/**
 * Test URL Generation Script
 * Verifies that admin invitation URLs are generated correctly
 */

async function testURLGeneration() {
  console.log('🔗 Testing Admin Invitation URL Generation...\n');

  const emailService = EmailService.getInstance();
  
  // Test the URL generation directly
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const testToken = 'test-jwt-token-123';
  const expectedURL = `${frontendUrl}/register?token=${testToken}&type=admin`;
  
  console.log(`Frontend URL: ${frontendUrl}`);
  console.log(`Expected URL: ${expectedURL}`);
  
  // Test the email service method
  console.log('\n📧 Testing Email Service URL Generation...');
  
  // Mock the email sending to capture the URL
  const originalSendEmail = emailService.sendEmail;
  let capturedURL = '';
  
  emailService.sendEmail = async (options: any) => {
    // Extract URL from HTML content
    console.log('HTML content preview:', options.html.substring(0, 200));
    const urlMatch = options.html.match(/href="([^"]+)"/);
    if (urlMatch) {
      capturedURL = urlMatch[1];
      console.log('Found URL:', capturedURL);
    } else {
      console.log('No URL found in HTML');
    }
    return true;
  };
  
  await emailService.sendAdminInvitationEmail('vikabi4433@soco7.com', testToken);
  
  // Restore original method
  emailService.sendEmail = originalSendEmail;
  
  console.log(`Generated URL: ${capturedURL}`);
  
  if (capturedURL === expectedURL) {
    console.log('✅ URL generation is CORRECT!');
  } else {
    console.log('❌ URL generation is INCORRECT!');
    console.log(`Expected: ${expectedURL}`);
    console.log(`Got: ${capturedURL}`);
  }
  
  // Test URL format
  const urlPattern = /^https?:\/\/[^\/]+\/register\?token=[^&]+&type=admin$/;
  if (urlPattern.test(capturedURL)) {
    console.log('✅ URL format is valid');
  } else {
    console.log('❌ URL format is invalid');
  }
  
  console.log('\n🎯 URL Generation Test Complete!');
}

// Run test
if (require.main === module) {
  testURLGeneration()
    .then(() => {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export default testURLGeneration;

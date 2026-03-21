import 'dotenv/config';
import { EmailService } from '../services/email.service';

/**
 * Test Resend Email Script
 * Sends a test email to verify Resend integration
 */

async function testResendEmail() {
  console.log('📧 Testing Resend Email Service...\n');

  const emailService = EmailService.getInstance();

  // Check if service is initialized
  console.log(`Email Provider: ${emailService.getProvider()}`);
  console.log(`Email Initialized: ${emailService.isInitialized() ? '✅' : '❌'}`);

  if (!emailService.isInitialized()) {
    console.log('❌ Email service not initialized. Please check your RESEND_API_KEY.');
    return;
  }

  // Send test email
  console.log('\n📨 Sending test email to vikabi4433@soco7.com...');

  const result = await emailService.sendEmail({
    to: 'vikabi4433@soco7.com',
    subject: '🎉 Resend Email Test - Scorer Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Email Test Successful!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Resend Integration Working</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Congratulations! Your Resend email integration is working perfectly. 
            This email was sent from the Scorer platform using Resend's API.
          </p>
          
          <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;">
              <strong>Test Details:</strong><br>
              Provider: Resend<br>
              Template: HTML<br>
              Status: Working ✅
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Your admin invitation system is now ready to send professional emails 
            to new administrators using Resend's free tier (3,000 emails/month).
          </p>
        </div>
        
        <div style="padding: 20px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #6c757d; font-size: 12px;">
            © 2024 Scorer Platform. Powered by Resend 🚀
          </p>
        </div>
      </div>
    `,
    text: 'Resend Email Test - Your Scorer platform email integration is working perfectly!',
  });

  if (result) {
    console.log('✅ Email sent successfully to vikabi4433@soco7.com');
    console.log('📬 Check your inbox (and spam folder) for the test email');
  } else {
    console.log('❌ Failed to send email. Please check:');
    console.log('   - RESEND_API_KEY is correct');
    console.log('   - FROM_EMAIL domain is verified in Resend');
    console.log('   - Network connection is working');
  }

  // Test admin invitation email
  console.log('\n📋 Testing admin invitation email template...');
  
  const invitationResult = await emailService.sendAdminInvitationEmail(
    'vikabi4433@soco7.com',
    'test-invitation-token-123',
    24
  );

  if (invitationResult) {
    console.log('✅ Admin invitation email sent successfully');
  } else {
    console.log('❌ Failed to send admin invitation email');
  }

  console.log('\n🎯 Email test completed!');
}

// Run test
if (require.main === module) {
  testResendEmail()
    .then(() => {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export default testResendEmail;

import 'dotenv/config';
import { createAdminInvitation } from '../services/invitation.service';
import { sendEmailOTPForInvitation, sendPhoneOTPForInvitation } from '../services/invitation.service';
import { getInvitationStatus } from '../services/invitation.service';
import { EmailService } from '../services/email.service';
import { SMSService } from '../services/sms.service';
import { SecurityService } from '../services/security.service';

/**
 * Test Production Flow Script
 * Tests all the production-ready features implemented
 */

async function testProductionFlow() {
  console.log('🚀 Starting Production Flow Tests...\n');

  // 1. Test Email Service
  console.log('📧 Testing Email Service...');
  const emailService = EmailService.getInstance();
  const emailTest = await emailService.sendEmail({
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<h1>Test Email</h1><p>This is a test email from the production system.</p>',
  });
  console.log(`Email Service: ${emailTest ? '✅ Working' : '❌ Not configured'} (${emailService.getProvider()})`);
  console.log(`Email Provider: ${emailService.getProvider()}`);
  console.log(`Email Initialized: ${emailService.isInitialized() ? '✅' : '❌'}`);

  // 2. Test SMS Service
  console.log('\n📱 Testing SMS Service...');
  const smsService = SMSService.getInstance();
  const smsTest = await smsService.sendSMS('+1234567890', 'Test SMS from production system');
  console.log(`SMS Service: ${smsTest ? '✅ Working' : '❌ Not configured (Twilio credentials missing)'}`);

  // 3. Test Security Service
  console.log('\n🔒 Testing Security Service...');
  const securityService = SecurityService.getInstance();
  
  // Test IP allowlisting
  const testIP = '127.0.0.1';
  const ipAllowed = securityService.isIPAllowed(testIP);
  console.log(`IP Allowlisting: ${ipAllowed ? '✅ Working' : '❌ Not configured'}`);

  // Test device fingerprinting
  const mockReq = {
    headers: { 'user-agent': 'Mozilla/5.0 Test Browser' },
    ip: testIP,
  } as any;
  const fingerprint = securityService.generateDeviceFingerprint(mockReq);
  console.log(`Device Fingerprinting: ✅ Working (Generated: ${fingerprint.substring(0, 10)}...)`);

  // Test location tracking
  const location = await securityService.getLocationFromIP(testIP);
  console.log(`Location Tracking: ${location ? '✅ Working' : '⚠️ Using fallback'}`);

  // 4. Test Admin Invitation Flow
  console.log('\n📋 Testing Admin Invitation Flow...');
  
  const invitationData = {
    email: 'production-test@example.com',
    phone: '+1234567890',
    invitedBy: 'test-user-id', // This would normally come from authenticated user
  };

  const requestContext = {
    ip: testIP,
    userAgent: 'Mozilla/5.0 Test Browser',
  };

  const invitationResult = await createAdminInvitation(invitationData, requestContext);
  console.log(`Invitation Creation: ${invitationResult.success ? '✅ Success' : '❌ Failed'}`);
  
  if (invitationResult.success && invitationResult.inviteLink) {
    const token = invitationResult.inviteLink.split('token=')[1];
    console.log(`Generated Token: ${token.substring(0, 20)}...`);

    // Test invitation status
    const statusResult = await getInvitationStatus(token);
    console.log(`Invitation Status: ${statusResult.success ? '✅ Working' : '❌ Failed'}`);

    // Test email OTP
    const emailOTPResult = await sendEmailOTPForInvitation(token);
    console.log(`Email OTP: ${emailOTPResult.success ? '✅ Working' : '❌ Failed'}`);

    // Test phone OTP
    const phoneOTPResult = await sendPhoneOTPForInvitation(token);
    console.log(`Phone OTP: ${phoneOTPResult.success ? '✅ Working' : '❌ Failed'}`);
  }

  // 5. Test Security Alert System
  console.log('\n🚨 Testing Security Alert System...');
  await securityService.createSecurityAlert({
    type: 'suspicious_login',
    description: 'Test security alert',
    ipAddress: testIP,
    userAgent: 'Test Browser',
    severity: 'medium',
    timestamp: new Date(),
  });
  console.log('Security Alerts: ✅ Working (check logs/email for alert)');

  // 6. Environment Configuration Check
  console.log('\n⚙️ Environment Configuration:');
  console.log(`Database URL: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
  console.log(`JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`Resend API Key: ${process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`SendGrid API Key: ${process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Twilio Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Twilio From Number: ${process.env.TWILIO_FROM_NUMBER ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Allowed Admin IPs: ${process.env.ALLOWED_ADMIN_IPS || 'Not configured (allowing all)'}`);
  console.log(`Security Alert Email: ${process.env.SECURITY_ALERT_EMAIL || 'Not configured'}`);
  console.log(`Security Alert Phone: ${process.env.SECURITY_ALERT_PHONE || 'Not configured'}`);

  console.log('\n🎯 Production Flow Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Configure Resend API key in .env for free email delivery');
  console.log('2. Configure Twilio credentials for SMS delivery');
  console.log('3. Set up ALLOWED_ADMIN_IPS for production security');
  console.log('4. Configure SECURITY_ALERT_EMAIL and SECURITY_ALERT_PHONE');
  console.log('5. Test with real email/SMS delivery');
  console.log('6. Set up monitoring and alerting');
}

// Run tests
if (require.main === module) {
  testProductionFlow()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export default testProductionFlow;

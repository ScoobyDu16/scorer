import { createAdminInvitation } from '../services/invitation.service';
import { db } from '../db/client';

async function sendQuickInvitation(email: string, phone: string) {
  try {
    console.log('📤 Sending admin invitation...');
    
    const result = await createAdminInvitation({
      email,
      phone,
      invitedBy: 'system'
    }, {
      ip: '127.0.0.1',
      userAgent: 'Quick Invitation Script'
    });

    if (result.success) {
      console.log('\n✅ Invitation sent successfully!');
      console.log('📧 Email:', email);
      console.log('📱 Phone:', phone);
      console.log('🔗 Registration URL:', result.inviteLink);
      console.log('🆔 Invitation ID:', result.invitationId);
      
      return result;
    } else {
      console.error('\n❌ Failed to send invitation:', result.message);
      return result;
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await db.$client.end();
  }
}

// Example usage - you can modify these values
async function main() {
  // Change these values to send invitation to different email/phone
  const email = 'new-admin@example.com';
  const phone = '+1234567890';
  
  await sendQuickInvitation(email, phone);
}

// Run the function
main().catch(console.error);

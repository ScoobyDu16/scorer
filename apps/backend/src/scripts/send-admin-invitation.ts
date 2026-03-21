import { createAdminInvitation } from '../services/invitation.service';
import { db } from '../db/client';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function sendAdminInvitation() {
  try {
    console.log('🚀 Admin Invitation Sender');
    console.log('============================\n');

    const email = await askQuestion('📧 Enter email address: ');
    const phone = await askQuestion('📱 Enter phone number (with country code): ');
    const invitedBy = await askQuestion('👤 Enter your user ID (or "system"): ');

    console.log('\n📤 Sending invitation...');

    const result = await createAdminInvitation({
      email: email.trim(),
      phone: phone.trim(),
      invitedBy: invitedBy.trim() || 'system'
    }, {
      ip: '127.0.0.1',
      userAgent: 'Admin Invitation Script'
    });

    if (result.success) {
      console.log('\n✅ Invitation sent successfully!');
      console.log('📧 Email:', email);
      console.log('📱 Phone:', phone);
      console.log('🔗 Registration URL:', result.inviteLink);
      console.log('🆔 Invitation ID:', result.invitationId);
      
      if (result.inviteLink) {
        const url = new URL(result.inviteLink);
        const token = url.searchParams.get('token');
        console.log('🔑 Token:', token);
      }
    } else {
      console.error('\n❌ Failed to send invitation:', result.message);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
    await db.$client.end();
  }
}

// Run the function
sendAdminInvitation().catch(console.error);

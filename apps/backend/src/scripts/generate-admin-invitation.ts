import { createAdminInvitation } from '../services/invitation.service';
import { db } from '../db/client';
import { logger } from '../utils/logger';

async function generateAdminInvitation() {
  try {
    console.log('Generating admin invitation...');
    
    const result = await createAdminInvitation({
      email: 'admin@test.com',
      phone: '+1234567890',
      invitedBy: 'system'
    });

    if (result.success && result.inviteLink) {
      console.log('✅ Admin invitation created successfully!');
      console.log('📧 Email: admin@test.com');
      console.log('📱 Phone: +1234567890');
      console.log('� Registration URL:', result.inviteLink);
      console.log('🆔 Invitation ID:', result.invitationId);
      
      // Extract token from URL for display
      const url = new URL(result.inviteLink);
      const token = url.searchParams.get('token');
      console.log('🔑 Token:', token);
    } else {
      console.error('❌ Failed to create invitation:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to generate admin invitation:', error);
    throw error;
  } finally {
    await db.$client.end();
  }
}

// Run the function
generateAdminInvitation().catch(console.error);

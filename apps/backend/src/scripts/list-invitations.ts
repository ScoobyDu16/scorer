import { db } from '../db/client';
import { adminInvitations } from '../db/schema/admin-invitations';
import { eq } from 'drizzle-orm';

async function listInvitations() {
  try {
    console.log('Fetching admin invitations...');
    
    const invitations = await db
      .select()
      .from(adminInvitations)
      .orderBy(adminInvitations.createdAt)
      .limit(5);

    if (invitations.length === 0) {
      console.log('No invitations found.');
      return;
    }

    console.log(`Found ${invitations.length} invitations:`);
    invitations.forEach((inv, index) => {
      console.log(`\n${index + 1}. Invitation ID: ${inv.id}`);
      console.log(`   Email: ${inv.email}`);
      console.log(`   Phone: ${inv.phone}`);
      console.log(`   Status: ${inv.status}`);
      console.log(`   Token: ${inv.inviteToken}`);
      console.log(`   Registration URL: http://localhost:5174/register?token=${inv.inviteToken}&type=admin`);
      console.log(`   Created: ${inv.createdAt}`);
      console.log(`   Expires: ${inv.expiresAt}`);
      console.log(`   Email Verified: ${inv.emailVerified}`);
      console.log(`   Phone Verified: ${inv.phoneVerified}`);
      console.log(`   Password Set: ${inv.passwordSet}`);
      console.log(`   TOTP Enabled: ${inv.totpEnabled}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch invitations:', error);
  } finally {
    await db.$client.end();
  }
}

// Run the function
listInvitations().catch(console.error);

/**
 * Email Service
 * Handles sending emails for notifications, claims, etc.
 */

import { Resend } from 'resend';
import { logger } from './logger';

// Email configuration
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.SMTP_FROM || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Send an email
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text,
      html: html || text,
    });

    if (error) {
      logger.error('Failed to send email:', error);
      return false;
    }

    logger.info(`Email sent: ${data?.id}`, { to, subject });
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send claim notification to beneficiary
 */
export async function sendClaimNotification(
  beneficiaryEmail: string,
  beneficiaryName: string,
  planName: string,
  claimCode: string,
  amount: string,
  assetType: string,
  claimUrl: string,
  globalPlanId?: number
): Promise<boolean> {
  const subject = `InheritX: You Have an Inheritance to Claim - ${planName}`;
  const planIdDisplay = globalPlanId ? `Plan ID: ${globalPlanId}` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <h2 style="color: #0D1A1E;">Inheritance Claim Ready</h2>
      
      <p>Hello ${beneficiaryName},</p>
      
      <p>You have been designated as a beneficiary for the plan <strong>"${planName}"</strong> ${planIdDisplay ? `(${planIdDisplay})` : ''}.</p>
      
      <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Amount:</strong> ${amount} ${assetType}</p>
        ${globalPlanId ? `<p style="margin: 0 0 10px 0;"><strong>Plan ID:</strong> ${globalPlanId}</p>` : ''}
        <p style="margin: 0;"><strong>Claim Code:</strong> <span style="font-family: monospace; font-size: 18px; letter-spacing: 2px; background: #fff; padding: 2px 6px; border-radius: 4px;">${claimCode}</span></p>
      </div>

      <p>To claim your inheritance:</p>
      <ol>
        <li>Click the link below</li>
        <li>Connect your wallet</li>
        <li>Enter your claim code</li>
      </ol>
      
      <p style="margin: 30px 0;">
        <a href="${claimUrl}" style="background: #0D1A1E; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Claim Inheritance</a>
      </p>
      
      <p style="color: #666; font-size: 14px;">If the button doesn't work, copy this link: ${claimUrl}</p>
      
    </body>
    </html>
  `;

  const text = `
Hello ${beneficiaryName},

You have been designated as a beneficiary in an inheritance plan. The assets are now ready for you to claim.

Plan Name: ${planName}
${planIdDisplay}
Your Inheritance Amount: ${amount} ${assetType}

YOUR CLAIM CODE: ${claimCode}

IMPORTANT: Keep this claim code secure. Anyone with this code and your personal details can claim the inheritance.

To claim your inheritance:
1. Visit: ${claimUrl}
2. Connect your cryptocurrency wallet
3. Enter the claim code shown above
4. Verify your identity details
5. Confirm the transaction to receive your assets

If you have any questions, please contact our support team.

© ${new Date().getFullYear()} InheritX. All rights reserved.
  `;

  return sendEmail(beneficiaryEmail, subject, text, html);
}

/**
 * Send KYC approval notification
 */
export async function sendKYCApprovalNotification(
  email: string,
  name: string
): Promise<boolean> {
  const subject = 'Your KYC Has Been Approved ✓';

  const text = `Hi ${name},

Great news! Your KYC verification has been approved.

You can now create inheritance plans on InheritX.

Get started: ${FRONTEND_URL}/dashboard/plans

Thanks,
The InheritX Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10B981;">✓ KYC Approved</h2>
      
      <p>Hi ${name},</p>
      
      <p>Great news! Your KYC verification has been <strong>approved</strong>.</p>
      
      <p>You can now create inheritance plans on InheritX.</p>
      
      <p style="margin: 25px 0;">
        <a href="${FRONTEND_URL}/dashboard/plans" style="background: #33C5E0; color: #0D1A1E; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Create Plan →
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Thanks,<br>
        The InheritX Team
      </p>
    </div>
  `;

  return sendEmail(email, subject, text, html);
}

/**
 * Send KYC rejection notification
 */
export async function sendKYCRejectionNotification(
  email: string,
  name: string,
  reason?: string
): Promise<boolean> {
  const subject = 'KYC Verification Update';

  const reasonText = reason ? `\n\nReason: ${reason}` : '';

  const text = `Hi ${name},

Unfortunately, your KYC verification was not approved.${reasonText}

Please review your submission and try again with:
- A clear, unexpired ID document
- Information that matches your ID exactly

Resubmit: ${FRONTEND_URL}/dashboard/kyc

Thanks,
The InheritX Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #EF4444;">KYC Not Approved</h2>
      
      <p>Hi ${name},</p>
      
      <p>Unfortunately, your KYC verification was <strong>not approved</strong>.</p>
      
      ${reason ? `
        <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px 16px; margin: 16px 0;">
          <strong>Reason:</strong> ${reason}
        </div>
      ` : ''}
      
      <p>Please review your submission and try again with:</p>
      <ul style="color: #666;">
        <li>A clear, unexpired ID document</li>
        <li>Information that matches your ID exactly</li>
      </ul>
      
      <p style="margin: 25px 0;">
        <a href="${FRONTEND_URL}/dashboard/kyc" style="background: #33C5E0; color: #0D1A1E; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Resubmit KYC →
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Thanks,<br>
        The InheritX Team
      </p>
    </div>
  `;

  return sendEmail(email, subject, text, html);
}


/**
 * Send Plan Creation Notification to Creator
 */
export async function sendPlanCreationNotification(
  email: string,
  name: string,
  planName: string,
  assetAmount: string,
  assetType: string,
  txHash: string
): Promise<boolean> {
  const subject = 'Your Inheritance Plan Has Been Created Successfully ✓';

  const explorerUrl = `https://sepolia-blockscout.lisk.com/tx/${txHash}`; // Adjust based on network

  const text = `Hi ${name},

Your inheritance plan "${planName}" has been successfully created and secured on the blockchain.

Plan Details:
- Name: ${planName}
- Assets: ${assetAmount} ${assetType}
- Transaction Hash: ${txHash}

You can view your transaction here: ${explorerUrl}

You can manage your plan at: ${FRONTEND_URL}/dashboard/plans

Thanks,
The InheritX Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10B981;">✓ Plan Created Successfully</h2>
      
      <p>Hi ${name},</p>
      
      <p>Your inheritance plan <strong>"${planName}"</strong> has been successfully created and secured on the blockchain.</p>
      
      <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; font-size: 16px;">Plan Details</h3>
        <ul style="padding-left: 20px; color: #4B5563;">
          <li><strong>Name:</strong> ${planName}</li>
          <li><strong>Assets:</strong> ${assetAmount} ${assetType}</li>
          <li><strong>Transaction:</strong> <a href="${explorerUrl}" style="color: #33C5E0;">View on Explorer</a></li>
        </ul>
      </div>
      
      <p style="margin: 25px 0;">
        <a href="${FRONTEND_URL}/dashboard/plans" style="background: #33C5E0; color: #0D1A1E; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Manage My Plans →
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Thanks,<br>
        The InheritX Team
      </p>
    </div>
  `;

  return sendEmail(email, subject, text, html);
}

export default {
  sendEmail,
  sendClaimNotification,
  sendKYCApprovalNotification,
  sendKYCRejectionNotification,
  sendPlanCreationNotification,
};



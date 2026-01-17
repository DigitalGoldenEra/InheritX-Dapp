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
  const planIdDisplay = globalPlanId ? `#${globalPlanId}` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0D1A1E; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0D1A1E; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
              <!-- Header -->
              <tr>
                <td style="text-align: center; padding-bottom: 32px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                    Inherit<span style="color: #33C5E0;">X</span>
                  </h1>
                </td>
              </tr>
              
              <!-- Main Card -->
              <tr>
                <td style="background: linear-gradient(145deg, #1A2A30 0%, #0F1A1E 100%); border-radius: 16px; border: 1px solid rgba(51, 197, 224, 0.2); padding: 40px;">
                  <!-- Icon -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom: 24px;">
                        <div style="width: 64px; height: 64px; background: rgba(51, 197, 224, 0.15); border-radius: 50%; display: inline-block; line-height: 64px; text-align: center;">
                          <span style="font-size: 32px;">🎁</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #FFFFFF; text-align: center;">
                    Inheritance Ready to Claim
                  </h2>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94A3B8; text-align: center;">
                    Hello <strong style="color: #FFFFFF;">${beneficiaryName}</strong>, you've been designated as a beneficiary.
                  </p>
                  
                  <!-- Plan Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                              <span style="color: #64748B; font-size: 14px;">Plan</span>
                              <span style="color: #FFFFFF; font-size: 14px; float: right; font-weight: 500;">${planName} ${planIdDisplay}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                              <span style="color: #64748B; font-size: 14px;">Amount</span>
                              <span style="color: #33C5E0; font-size: 14px; float: right; font-weight: 600;">${amount} ${assetType}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0 4px 0;">
                              <span style="color: #64748B; font-size: 14px;">Claim Code</span>
                              <div style="margin-top: 8px; text-align: center;">
                                <span style="display: inline-block; background: #33C5E0; color: #0D1A1E; font-size: 24px; font-weight: 700; letter-spacing: 4px; padding: 12px 24px; border-radius: 8px; font-family: monospace;">${claimCode}</span>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Steps -->
                  <p style="margin: 0 0 16px 0; font-size: 14px; color: #94A3B8; text-align: center;">
                    <strong style="color: #FFFFFF;">How to claim:</strong> Click below → Connect wallet → Enter code
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 8px 0 24px 0;">
                        <a href="${claimUrl}" style="display: inline-block; background: #33C5E0; color: #0D1A1E; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                          Claim Inheritance →
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; font-size: 12px; color: #64748B; text-align: center; word-break: break-all;">
                    ${claimUrl}
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding-top: 32px; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B;">
                    Keep your claim code secure. Anyone with this code can claim.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #475569;">
                    © ${new Date().getFullYear()} InheritX. Built on Lisk.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Hello ${beneficiaryName},

You have been designated as a beneficiary in an inheritance plan.

Plan: ${planName} ${planIdDisplay}
Amount: ${amount} ${assetType}
Claim Code: ${claimCode}

To claim: Visit ${claimUrl}, connect your wallet, and enter the claim code.

Keep your claim code secure.

© ${new Date().getFullYear()} InheritX
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
  const subject = 'InheritX: Your KYC Has Been Approved ✓';

  const text = `Hi ${name},

Great news! Your KYC verification has been approved.

You can now create inheritance plans on InheritX.

Get started: ${FRONTEND_URL}/dashboard/plans

© ${new Date().getFullYear()} InheritX`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0D1A1E; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0D1A1E; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
              <!-- Header -->
              <tr>
                <td style="text-align: center; padding-bottom: 32px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                    Inherit<span style="color: #33C5E0;">X</span>
                  </h1>
                </td>
              </tr>
              
              <!-- Main Card -->
              <tr>
                <td style="background: linear-gradient(145deg, #1A2A30 0%, #0F1A1E 100%); border-radius: 16px; border: 1px solid rgba(51, 197, 224, 0.2); padding: 40px;">
                  <!-- Icon -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom: 24px;">
                        <div style="width: 64px; height: 64px; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: inline-block; line-height: 64px; text-align: center;">
                          <span style="font-size: 32px;">✓</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #10B981; text-align: center;">
                    KYC Approved
                  </h2>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94A3B8; text-align: center;">
                    Hi <strong style="color: #FFFFFF;">${name}</strong>, great news! Your identity verification has been <strong style="color: #10B981;">approved</strong>.
                  </p>
                  
                  <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #94A3B8; text-align: center;">
                    You now have full access to create and manage inheritance plans on InheritX.
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <a href="${FRONTEND_URL}/dashboard/plans" style="display: inline-block; background: #33C5E0; color: #0D1A1E; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                          Create Your First Plan →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding-top: 32px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #475569;">
                    © ${new Date().getFullYear()} InheritX. Built on Lisk.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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
  const subject = 'InheritX: KYC Verification Update';

  const reasonText = reason ? `\n\nReason: ${reason}` : '';

  const text = `Hi ${name},

Unfortunately, your KYC verification was not approved.${reasonText}

Please review your submission and try again with:
- A clear, unexpired ID document
- Information that matches your ID exactly

Resubmit: ${FRONTEND_URL}/dashboard/kyc

© ${new Date().getFullYear()} InheritX`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0D1A1E; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0D1A1E; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
              <!-- Header -->
              <tr>
                <td style="text-align: center; padding-bottom: 32px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                    Inherit<span style="color: #33C5E0;">X</span>
                  </h1>
                </td>
              </tr>
              
              <!-- Main Card -->
              <tr>
                <td style="background: linear-gradient(145deg, #1A2A30 0%, #0F1A1E 100%); border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.3); padding: 40px;">
                  <!-- Icon -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom: 24px;">
                        <div style="width: 64px; height: 64px; background: rgba(239, 68, 68, 0.15); border-radius: 50%; display: inline-block; line-height: 64px; text-align: center;">
                          <span style="font-size: 32px;">⚠️</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #EF4444; text-align: center;">
                    KYC Not Approved
                  </h2>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94A3B8; text-align: center;">
                    Hi <strong style="color: #FFFFFF;">${name}</strong>, unfortunately your verification was not approved.
                  </p>
                  
                  ${reason ? `
                  <!-- Reason Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #EF4444; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="margin: 0; font-size: 14px; color: #F87171;">
                          <strong>Reason:</strong> ${reason}
                        </p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                  
                  <p style="margin: 0 0 8px 0; font-size: 15px; color: #FFFFFF; text-align: center;">
                    Please try again with:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 8px 0; text-align: center;">
                        <span style="color: #94A3B8; font-size: 14px;">• A clear, unexpired ID document</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; text-align: center;">
                        <span style="color: #94A3B8; font-size: 14px;">• Information that matches your ID exactly</span>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <a href="${FRONTEND_URL}/dashboard/kyc" style="display: inline-block; background: #33C5E0; color: #0D1A1E; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                          Resubmit KYC →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding-top: 32px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #475569;">
                    © ${new Date().getFullYear()} InheritX. Built on Lisk.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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
  const subject = 'InheritX: Your Inheritance Plan Has Been Created ✓';

  const explorerUrl = `https://sepolia-blockscout.lisk.com/tx/${txHash}`;
  const shortTxHash = `${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`;

  const text = `Hi ${name},

Your inheritance plan "${planName}" has been successfully created.

Plan Details:
- Name: ${planName}
- Assets: ${assetAmount} ${assetType}
- Transaction: ${explorerUrl}

Manage your plan: ${FRONTEND_URL}/dashboard/plans

© ${new Date().getFullYear()} InheritX`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0D1A1E; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0D1A1E; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
              <!-- Header -->
              <tr>
                <td style="text-align: center; padding-bottom: 32px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                    Inherit<span style="color: #33C5E0;">X</span>
                  </h1>
                </td>
              </tr>
              
              <!-- Main Card -->
              <tr>
                <td style="background: linear-gradient(145deg, #1A2A30 0%, #0F1A1E 100%); border-radius: 16px; border: 1px solid rgba(51, 197, 224, 0.2); padding: 40px;">
                  <!-- Icon -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom: 24px;">
                        <div style="width: 64px; height: 64px; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: inline-block; line-height: 64px; text-align: center;">
                          <span style="font-size: 32px;">🎉</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #10B981; text-align: center;">
                    Plan Created Successfully
                  </h2>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94A3B8; text-align: center;">
                    Hi <strong style="color: #FFFFFF;">${name}</strong>, your inheritance plan has been secured on the blockchain.
                  </p>
                  
                  <!-- Plan Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                              <span style="color: #64748B; font-size: 14px;">Plan Name</span>
                              <span style="color: #FFFFFF; font-size: 14px; float: right; font-weight: 500;">${planName}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                              <span style="color: #64748B; font-size: 14px;">Assets</span>
                              <span style="color: #33C5E0; font-size: 14px; float: right; font-weight: 600;">${assetAmount} ${assetType}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #64748B; font-size: 14px;">Transaction</span>
                              <a href="${explorerUrl}" style="color: #33C5E0; font-size: 14px; float: right; text-decoration: none;">${shortTxHash} ↗</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <a href="${FRONTEND_URL}/dashboard/plans" style="display: inline-block; background: #33C5E0; color: #0D1A1E; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                          Manage My Plans →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding-top: 32px; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B;">
                    Your plan is now active and will execute as scheduled.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #475569;">
                    © ${new Date().getFullYear()} InheritX. Built on Lisk.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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



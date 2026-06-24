const fs = require('fs/promises');
const path = require('path');
const { Resend } = require('resend');
const config = require('../config');

const hasResendConfig = Boolean(config.resendApiKey && config.emailFrom);

/**
 * Mask email for safe logging - keeps first char and domain, hides middle
 * user@example.com -> u***@example.com
 */
const maskEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  return `${localPart[0]}${'*'.repeat(Math.max(3, localPart.length - 2))}@${domain}`;
};

const saveDevEmail = async (to, subject, text, html) => {
  const outputDir = path.resolve(process.cwd(), 'dev-emails');
  await fs.mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `email-${Date.now()}.txt`);
  const content = [
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    text || '',
    html ? `\n${html}` : ''
  ].join('\n');
  await fs.writeFile(filePath, content, 'utf8');
};

const createResendClient = () => {
  if (!hasResendConfig) {
    return null;
  }

  return new Resend(config.resendApiKey);
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (hasResendConfig) {
      const resend = createResendClient();
      const response = await resend.emails.send({
        from: config.emailFrom,
        to,
        subject,
        text,
        html
      });

      console.log('[EMAIL] Resend send success:', {
        recipient: maskEmail(to),
        subject,
        messageId: response.id,
        status: response.status || 'sent'
      });

      return response;
    }

    if (config.nodeEnv !== 'production') {
      await saveDevEmail(to, subject, text, html);
      console.log('[EMAIL] Development email saved:', {
        recipient: maskEmail(to),
        subject
      });
      return {
        provider: 'dev',
        to,
        subject
      };
    }

    throw new Error('Resend API key is required in production email delivery.');
  } catch (error) {
    console.error('[EMAIL] Resend email send failed:', {
      recipient: maskEmail(to),
      subject,
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      resendResponse: error.response ? error.response.body || error.response : undefined,
      nodeEnv: config.nodeEnv
    });
    throw error;
  }
};

module.exports = {
  sendEmail,
  maskEmail
};

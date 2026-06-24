const config = require('../config');

const isProduction = config.nodeEnv === 'production';

// Minimal SMS service abstraction. In development, we log messages to dev-emails
// In production, integrate with Twilio or another provider.
const sendSms = async (to, message) => {
  if (!to || !message) return false;

  if (!isProduction) {
    // In development, just log to console and to dev-emails folder via email.service pattern
    try {
      const fs = require('fs');
      const path = require('path');
      const devDir = path.resolve(process.cwd(), 'dev-emails');
      if (!fs.existsSync(devDir)) fs.mkdirSync(devDir, { recursive: true });
      const filename = `sms-${Date.now()}.txt`;
      const content = `to: ${to}\nmessage: ${message}\n`;
      fs.writeFileSync(path.join(devDir, filename), content, 'utf8');
    } catch (e) {
      // ignore
    }
    console.info('[SMS][dev] to:', to, 'message:', message.replace(/\d{6}/g, '******'));
    return true;
  }

  // Production placeholder: implement Twilio or other providers
  const provider = process.env.SMS_PROVIDER || '';
  if (provider === 'twilio') {
    // TODO: implement Twilio sending
    // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({ body: message, from: process.env.TWILIO_FROM_NUMBER, to });
    return true;
  }

  // No provider configured
  console.warn('[SMS] No SMS provider configured. Set SMS_PROVIDER and provider credentials.');
  return false;
};

module.exports = {
  sendSms
};

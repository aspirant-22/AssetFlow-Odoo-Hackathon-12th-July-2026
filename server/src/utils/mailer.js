const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    console.log('📧 Ethereal Email: https://ethereal.email/login');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"AssetFlow" <${process.env.SMTP_USER || 'noreply@assetflow.com'}>`,
      to, subject, html
    });
    if (!process.env.SMTP_HOST) {
      console.log('📧 Preview URL: ' + nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (err) {
    console.error('Email send error:', err.message);
    throw err;
  }
};

module.exports = { sendEmail };

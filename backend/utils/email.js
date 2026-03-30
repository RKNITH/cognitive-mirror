import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
};

export const sendOTPEmail = async (email, otp, name) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'Cognitive Mirror'}" <${process.env.FROM_EMAIL || 'noreply@cognitivemirror.app'}>`,
    to: email,
    subject: 'Verify Your Cognitive Mirror Account',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;background:#f0f7ff;padding:32px;border-radius:16px;">
        <div style="background:#2563eb;border-radius:12px;padding:16px 24px;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">🧠 Cognitive Mirror</h1>
        </div>
        <h2 style="color:#1e293b;">Hello ${name}!</h2>
        <p style="color:#475569;">Your verification code:</p>
        <div style="background:#2563eb;color:#fff;font-size:36px;font-weight:bold;letter-spacing:10px;padding:20px;border-radius:12px;text-align:center;margin:24px 0;">${otp}</div>
        <p style="color:#64748b;font-size:14px;">This code expires in <strong>10 minutes</strong>. Do not share it.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'Cognitive Mirror'}" <${process.env.FROM_EMAIL || 'noreply@cognitivemirror.app'}>`,
    to: email,
    subject: 'Welcome to Cognitive Mirror!',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;background:#f0f7ff;padding:32px;border-radius:16px;">
        <h1 style="color:#2563eb;">🧠 Welcome, ${name}!</h1>
        <p style="color:#475569;">Your account is verified. Start your meta-learning journey today.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px;">Open Dashboard →</a>
      </div>
    `,
  });
};

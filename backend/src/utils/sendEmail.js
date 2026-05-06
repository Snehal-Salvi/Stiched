import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Stiched – Your OTP Code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:12px;border:1px solid #eee;">
        <h2 style="color:#1a1a2e;">Your OTP Code</h2>
        <p style="color:#555;">Use this code to verify your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#f5f5f5;border-radius:8px;color:#1a1a2e;">
          ${otp}
        </div>
        <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
        <p style="color:#999;font-size:12px;">— The Stiched Team</p>
      </div>
    `,
  });
};

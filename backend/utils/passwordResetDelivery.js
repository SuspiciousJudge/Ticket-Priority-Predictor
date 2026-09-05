const resetMode = process.env.RESET_EMAIL_MODE || (process.env.NODE_ENV === 'production' ? 'resend' : 'console');

function buildResetUrl(token) {
  const baseUrl = process.env.PASSWORD_RESET_URL_BASE;
  if (!baseUrl) throw new Error('PASSWORD_RESET_URL_BASE is required for password reset delivery');
  return `${baseUrl.replace(/\/$/, '')}?token=${encodeURIComponent(token)}`;
}

async function sendPasswordResetEmail({ email, token }) {
  const resetUrl = buildResetUrl(token);

  if (resetMode === 'console' && process.env.NODE_ENV !== 'production') {
    console.log(`Password reset link for ${email}: ${resetUrl}`);
    return { delivered: false, development: true, resetUrl };
  }

  if (resetMode !== 'resend' || !process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    throw new Error('Password reset email delivery is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [email],
      subject: 'Reset your TicketPro password',
      text: `Reset your TicketPro password using this link: ${resetUrl}\n\nThis link expires in 30 minutes and can only be used once.`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Password reset email provider returned HTTP ${response.status}`);
  }

  return { delivered: true, development: false };
}

module.exports = { sendPasswordResetEmail };

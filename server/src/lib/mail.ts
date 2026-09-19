import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 10000,
  socketTimeout: 15000,
});
export const mailService = {
  async send(email: string, purpose: 'verify' | 'reset', token: string) {
    if (!env.SMTP_USER || !env.SMTP_PASS)
      throw new AppError(
        503,
        'Email delivery is not configured. Please contact the platform maintainer.',
      );
    const title =
      purpose === 'verify'
        ? 'Verify your ProjectHub email'
        : 'Reset your ProjectHub password';
    const link = new URL(
      purpose === 'verify' ? '/verify-email' : '/reset-password',
      env.CLIENT_URL,
    );
    link.searchParams.set('token', token);
    await transport.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: email,
      subject: title,
      text: `${title}\n\nOpen this link within 30 minutes:\n${link}\n\nIf you did not request this email, you can ignore it.`,
      html: `<div style="font:16px/1.7 sans-serif;max-width:520px;margin:40px auto"><h2>ProjectHub</h2><h3>${title}</h3><p>Your link expires in 30 minutes.</p><p><a href="${link.toString().replaceAll('&', '&amp;')}">${purpose === 'verify' ? 'Verify email address' : 'Reset password'}</a></p><p>If you did not request this email, you can ignore it.</p></div>`,
    });
  },
};

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RELAY_SECRET = process.env.EMAIL_RELAY_SECRET || 'blueprint_academy_email_secret_key_2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, to, subject, html, text, from, config } = body;

    if (secret !== RELAY_SECRET) {
      return NextResponse.json({ success: false, message: 'Unauthorized relay access' }, { status: 401 });
    }

    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, message: 'Missing to, subject, or html' }, { status: 400 });
    }

    const emailUser = config?.gmailUser || process.env.EMAIL_USER || 'admin.blueprintlearning@gmail.com';
    const emailPass = config?.gmailPass || process.env.EMAIL_PASS;
    const fromAddress = from || `"Blueprint Learning Academy" <${emailUser}>`;

    // 1. Try Gmail over Port 465 (Open on Vercel)
    if (emailUser && emailPass) {
      try {
        const gmailTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        const info = await gmailTransporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html,
          text: text || '',
        });

        console.log('✅ [Vercel Relay] Email sent via Gmail successfully:', info.messageId);
        return NextResponse.json({
          success: true,
          provider: 'vercel-gmail',
          messageId: info.messageId,
        });
      } catch (gmailErr: any) {
        console.warn('⚠️ [Vercel Relay] Gmail failed, attempting SMTP fallback:', gmailErr.message);
      }
    }

    // 2. Try SMTP (Brevo or custom) over Port 587 (Open on Vercel)
    const smtpHost = config?.smtpHost || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
    const smtpPort = Number(config?.smtpPort) || Number(process.env.SMTP_PORT) || 587;
    const smtpUser = config?.smtpUser || process.env.SMTP_USER;
    const smtpPass = config?.smtpPass || process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const smtpInfo = await smtpTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        text: text || '',
      });

      console.log('✅ [Vercel Relay] Email sent via SMTP successfully:', smtpInfo.messageId);
      return NextResponse.json({
        success: true,
        provider: 'vercel-smtp',
        messageId: smtpInfo.messageId,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No active email provider configuration available to relay',
    }, { status: 400 });
  } catch (err: any) {
    console.error('❌ [Vercel Relay] Error sending email:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

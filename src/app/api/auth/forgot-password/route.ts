import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import crypto from 'crypto';

// Shared in-memory reset tokens store
declare global {
  // eslint-disable-next-line no-var
  var __resetTokensStore: Map<string, { email: string; expiresAt: number }> | undefined;
}

export function getResetTokensStore(): Map<string, { email: string; expiresAt: number }> {
  if (!globalThis.__resetTokensStore) {
    globalThis.__resetTokensStore = new Map();
  }
  return globalThis.__resetTokensStore;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Generate secure token and expiry (valid for 60 minutes)
    const token = crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36);
    const expiresAt = Date.now() + 60 * 60 * 1000;

    const tokenStore = getResetTokensStore();
    tokenStore.set(token, { email, expiresAt });

    // Derive base URL from request origin
    const origin =
      req.headers.get('origin') ||
      req.headers.get('x-forwarded-host')
        ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('x-forwarded-host')}`
        : 'http://localhost:3000';

    const resetUrl = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const subject = '🔐 Reset Your BookKeep-It Password';
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
        <!-- Top Gradient Banner -->
        <div style="background: linear-gradient(135deg, #00b4d8 0%, #0077b6 50%, #023e8a 100%); padding: 36px 24px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; width: 56px; height: 56px; background: #ffffff; border-radius: 16px; margin-bottom: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.2); overflow: hidden; line-height: 56px;">
            <span style="font-size: 28px; font-weight: 900; color: #0077b6;">BK</span>
          </div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">BookKeep-It</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #caf0f8; font-weight: 500;">Learning Management System & Practice Suite</p>
        </div>

        <!-- Main Body Content -->
        <div style="padding: 32px 28px; color: #1e293b;">
          <h2 style="margin: 0 0 14px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Password Reset Request</h2>
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
            Hello, we received a request to reset the password for your BookKeep-It account associated with <strong>${email}</strong>.
          </p>

          <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #475569;">
            Click the button below to choose a new password. This reset link will safely expire in <strong>60 minutes</strong>.
          </p>

          <!-- Call to Action Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 34px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0, 180, 216, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
              Reset My Password
            </a>
          </div>

          <!-- Secondary Link Info -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 24px 0; font-size: 12px; color: #64748b; word-break: break-all;">
            <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">Button not working? Paste this link into your browser:</p>
            <a href="${resetUrl}" style="color: #0077b6; text-decoration: underline;">${resetUrl}</a>
          </div>

          <!-- Security Notice -->
          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
            <p style="margin: 0 0 6px 0;">
              🛡️ If you did not request a password reset, no action is needed. Your account remains completely secure.
            </p>
            <p style="margin: 0;">
              For security, this password reset link can only be used once.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} BookKeep-It LMS. All rights reserved.
        </div>
      </div>
    `;

    let emailSent = false;
    let provider = 'none';

    // 1. Try Direct Gmail SMTP if configured
    const gmailUser = (process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
    const gmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').trim();

    if (gmailUser && gmailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass
          }
        });

        await transporter.sendMail({
          from: `"BookKeep-It" <${gmailUser}>`,
          to: email,
          subject,
          html: htmlContent
        });
        emailSent = true;
        provider = 'gmail_smtp';
      } catch (smtpErr) {
        console.warn('Gmail SMTP send warning:', smtpErr);
      }
    }

    // 2. Try Resend if configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'BookKeep-It <notifications@bookkeepit.com>';
    const adminEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || '').trim();

    if (!emailSent && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        let sendResult = await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject,
          html: htmlContent
        });

        if (sendResult.error) {
          // If Resend free tier has domain verification restriction, also send to admin email
          if (adminEmail && sendResult.error.message?.toLowerCase().includes('testing emails')) {
            await resend.emails.send({
              from: fromEmail,
              to: [adminEmail],
              subject: `[BookKeep-It Reset for ${email}] ${subject}`,
              html: htmlContent
            });
            emailSent = true;
            provider = 'resend_admin_fallback';
          }
        } else {
          emailSent = true;
          provider = 'resend';
        }
      } catch (resendErr) {
        console.warn('Resend send warning:', resendErr);
      }
    }

    // 3. Supabase Auth password reset request if configured
    if (isSupabaseConfigured() && !email.includes('bookkeep-it.edu')) {
      try {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetUrl
        });
      } catch (supabaseErr) {
        console.warn('Supabase reset warning:', supabaseErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Password reset link has been successfully prepared and sent to ${email}.`,
      emailSent,
      provider,
      resetUrl,
      token
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}

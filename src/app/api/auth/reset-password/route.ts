import { NextResponse } from 'next/server';
import { getResetTokensStore } from '@/app/api/auth/forgot-password/route';
import { UserAccount } from '@/types';

// Access the global accounts store from /api/accounts/route.ts
declare global {
  // eslint-disable-next-line no-var
  var __registeredAccountsStore: UserAccount[] | undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, email, newPassword } = body;

    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (!trimmedEmail) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    // Token validation
    const tokenStore = getResetTokensStore();
    if (token) {
      const record = tokenStore.get(token);
      if (!record) {
        // Check if token expired or invalid
        return NextResponse.json(
          { success: false, error: 'Invalid or expired password reset link. Please request a new one.' },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        tokenStore.delete(token);
        return NextResponse.json(
          { success: false, error: 'Password reset link has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (record.email !== trimmedEmail) {
        return NextResponse.json(
          { success: false, error: 'Reset link token does not match the provided email address.' },
          { status: 400 }
        );
      }

      // Consume the token so it cannot be used again
      tokenStore.delete(token);
    }

    // Update account in global registered accounts store
    if (!globalThis.__registeredAccountsStore) {
      globalThis.__registeredAccountsStore = [];
    }

    const currentAccounts = globalThis.__registeredAccountsStore;
    const accountIndex = currentAccounts.findIndex(
      (a) => a.email.toLowerCase() === trimmedEmail
    );

    if (accountIndex >= 0) {
      currentAccounts[accountIndex].password = newPassword;
    } else {
      // If not yet in runtime store (e.g. initial demo account or admin), create or upsert record
      currentAccounts.push({
        id: `usr_${Date.now()}`,
        name: trimmedEmail.split('@')[0],
        email: trimmedEmail,
        role: trimmedEmail.includes('admin') ? 'admin' : 'student',
        password: newPassword,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        bio: 'BookKeep-It Student',
        studentId: `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        program: 'Bachelor of Science in Accountancy',
        completedLessonsCount: 0,
        totalQuizzesTaken: 0,
        averageQuizScore: 0,
        studyHours: 0,
        streakDays: 1
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
      email: trimmedEmail
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to reset password.' },
      { status: 500 }
    );
  }
}

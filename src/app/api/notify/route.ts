import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'BookKeep-It Notifications <onboarding@resend.dev>';
    const adminEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.NEXT_PUBLIC_ADMIN_NOTIFICATION_EMAIL || '').trim();

    // Dynamically send to the student's own registered email + admin email
    const recipients: string[] = [];
    if (data?.studentEmail && typeof data.studentEmail === 'string' && data.studentEmail.includes('@')) {
      recipients.push(data.studentEmail.trim());
    }
    if (adminEmail && adminEmail.includes('@') && !recipients.includes(adminEmail)) {
      recipients.push(adminEmail);
    }
    if (recipients.length === 0) {
      recipients.push('admin@ilearn.edu');
    }

    if (!apiKey) {
      console.warn('RESEND_API_KEY is not configured in environment variables. Email notification was skipped.');
      return NextResponse.json({
        success: false,
        warning: 'RESEND_API_KEY is not configured. Please set RESEND_API_KEY in your environment variables.',
        preview: { recipients, type, data }
      });
    }

    const resend = new Resend(apiKey);

    let subject = '📢 New Activity on BookKeep-It';
    let htmlContent = '';

    if (type === 'quiz_submission') {
      const { studentName, studentEmail, studentId, program, quizTitle, score, passed, correctAnswersCount, totalQuestions, submittedAt } = data;
      const formattedDate = submittedAt ? new Date(submittedAt).toLocaleString() : new Date().toLocaleString();
      const statusColor = passed ? '#10b981' : '#ef4444';
      const statusText = passed ? 'PASSED ✓' : 'FAILED ✗';

      subject = `📝 Exam Submission: ${studentName} (${score}%) - ${quizTitle}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #023e8a 0%, #0077b6 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">BookKeep-It</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #caf0f8; opacity: 0.9;">Student Exam Notification</p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="display: inline-block; background-color: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}40; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 800; text-transform: uppercase;">
                ${statusText} • Score: ${score}%
              </span>
            </div>

            <!-- Quiz Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #1e293b;">${quizTitle}</h2>
              <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 40%;">Final Score:</td>
                  <td style="padding: 6px 0; font-weight: 800; color: #0f172a;">${score}% (${correctAnswersCount}/${totalQuestions} correct)</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Status:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: ${statusColor};">${passed ? 'Passed' : 'Needs Review'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Submitted At:</td>
                  <td style="padding: 6px 0; color: #64748b;">${formattedDate}</td>
                </tr>
              </table>
            </div>

            <!-- Student Info Card -->
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0369a1;">Student Information</h3>
              <table style="width: 100%; font-size: 13px; color: #0c4a6e; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; width: 40%;">Name:</td>
                  <td style="padding: 4px 0; font-weight: 700;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 600;">Email:</td>
                  <td style="padding: 4px 0;">${studentEmail}</td>
                </tr>
                ${studentId ? `<tr><td style="padding: 4px 0; font-weight: 600;">Student ID:</td><td style="padding: 4px 0;">${studentId}</td></tr>` : ''}
                ${program ? `<tr><td style="padding: 4px 0; font-weight: 600;">Program:</td><td style="padding: 4px 0;">${program}</td></tr>` : ''}
              </table>
            </div>

            <!-- Footer Note -->
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 24px 0 0 0;">
              This is an automated notification from BookKeep-It LMS. You are receiving this because your email is configured as the admin receiver.
            </p>
          </div>
        </div>
      `;
    } else if (type === 'activity_submission') {
      const { studentName, studentEmail, studentId, program, activityTitle, fileUrl, fileName, notes, submittedAt } = data;
      const formattedDate = submittedAt ? new Date(submittedAt).toLocaleString() : new Date().toLocaleString();

      subject = `📁 Activity File Submitted: ${studentName} - ${activityTitle}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #023e8a 0%, #0077b6 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">BookKeep-It</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #caf0f8; opacity: 0.9;">Activity File Submission Notification</p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <!-- Activity Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #1e293b;">${activityTitle}</h2>
              <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 40%;">File Name:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${fileName || 'Uploaded Document'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Submitted At:</td>
                  <td style="padding: 6px 0; color: #64748b;">${formattedDate}</td>
                </tr>
                ${notes ? `<tr><td style="padding: 6px 0; font-weight: 600;">Student Notes:</td><td style="padding: 6px 0; color: #334155; font-style: italic;">"${notes}"</td></tr>` : ''}
              </table>

              ${fileUrl ? `
                <div style="margin-top: 16px; text-align: center;">
                  <a href="${fileUrl}" target="_blank" style="display: inline-block; background-color: #0077b6; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none;">
                    📥 View / Download Submitted File
                  </a>
                </div>
              ` : ''}
            </div>

            <!-- Student Info Card -->
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0369a1;">Student Information</h3>
              <table style="width: 100%; font-size: 13px; color: #0c4a6e; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; width: 40%;">Name:</td>
                  <td style="padding: 4px 0; font-weight: 700;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 600;">Email:</td>
                  <td style="padding: 4px 0;">${studentEmail}</td>
                </tr>
                ${studentId ? `<tr><td style="padding: 4px 0; font-weight: 600;">Student ID:</td><td style="padding: 4px 0;">${studentId}</td></tr>` : ''}
                ${program ? `<tr><td style="padding: 4px 0; font-weight: 600;">Program:</td><td style="padding: 4px 0;">${program}</td></tr>` : ''}
              </table>
            </div>

            <!-- Footer Note -->
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 24px 0 0 0;">
              This is an automated notification from BookKeep-It LMS. You are receiving this because your email is configured as the admin receiver.
            </p>
          </div>
        </div>
      `;
    }

    const { data: resendData, error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject,
      html: htmlContent
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, resendData });
  } catch (err: any) {
    console.error('Notify route exception:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

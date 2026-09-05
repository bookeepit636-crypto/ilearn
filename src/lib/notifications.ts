export interface QuizNotificationPayload {
  studentName: string;
  studentEmail: string;
  studentId?: string;
  program?: string;
  quizTitle: string;
  score: number;
  passed: boolean;
  correctAnswersCount: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface ActivityNotificationPayload {
  studentName: string;
  studentEmail: string;
  studentId?: string;
  program?: string;
  activityTitle: string;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
  submittedAt: string;
}

/**
 * Send an automated email notification via Resend
 */
export async function sendQuizSubmissionNotification(data: QuizNotificationPayload) {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'quiz_submission',
        data
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to trigger quiz notification email:', error);
    return { success: false, error };
  }
}

export async function sendActivitySubmissionNotification(data: ActivityNotificationPayload) {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'activity_submission',
        data
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to trigger activity notification email:', error);
    return { success: false, error };
  }
}

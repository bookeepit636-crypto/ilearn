import { Course, DownloadableMaterial, FAQItem, NotificationItem, Quiz, QuizSubmission, ScheduleItem, UserProfile, VideoLesson } from '@/types';

export const initialProfile: UserProfile = {
  id: 'usr_001',
  name: 'Alex Morgan',
  email: 'alex.morgan@student.ilearn.edu',
  role: 'student',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  bio: 'Second-year Accounting Student passionate about mastering automated bookkeeping and financial analysis.',
  studentId: 'BK-2026-8941',
  program: 'Bachelor of Science in Accountancy',
  completedLessonsCount: 0,
  totalQuizzesTaken: 0,
  averageQuizScore: 0,
  studyHours: 0,
  streakDays: 6,
};

export const initialCourses: Course[] = [
  {
    id: 'crs-1',
    title: 'Bookkeeping Cycle',
    code: 'ACCT 102',
    category: 'Bookkeeping Cycle',
    level: 'Intermediate',
    instructor: 'Dr. Marcus Brody, CPA',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    description: 'Step-by-step guide from analyzing source documents, recording General Journal entries, posting to General Ledger, to preparing the Trial Balance.',
    totalLessons: 3,
    completedLessons: 0,
    topics: [
      {
        id: 'tpc-102-1',
        title: 'Journals and Ledger Posting',
        description: 'Mastering transaction records and T-Accounts.',
        lessons: [
          {
            id: 'lsn-4',
            topicId: 'tpc-102-1',
            title: 'Recording Transactions in the General Journal',
            description: 'How to write structured debits, credits, dates, and explanations.',
            duration: '35 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/Q_6A1ieXgp4',
            quizId: 'qz-104',
            downloadIds: ['dl-105', 'dl-106'],
            contentMarkdown: `
# General Journal Entries

A General Journal entry acts as a chronological diary of transactions.

### Example Journal Entry:
*Date: Jan 5, 2026*
* **Debit**: Cash ($5,000)
* **Credit**: Service Revenue ($5,000)
* *Explanation: Rendered bookkeeping services for cash.*
`
          },
          {
            id: 'lsn-5',
            topicId: 'tpc-102-1',
            title: 'Posting to the General Ledger & T-Accounts',
            description: 'Transferring journal entries to individual ledger accounts.',
            duration: '30 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/56xscQ4viWE',
            quizId: 'qz-105',
            downloadIds: ['dl-106'],
            contentMarkdown: `
# General Ledger & T-Accounts

The General Ledger organizes balances by account title.
T-Accounts summarize total Debits on the left and total Credits on the right to derive the ending account balance.
`
          }
        ]
      },
      {
        id: 'tpc-102-2',
        title: 'Trial Balance & Adjusting Entries',
        description: 'Verify equality of Debits and Credits and calculate accrued/deferred adjustments.',
        lessons: [
          {
            id: 'lsn-6',
            topicId: 'tpc-102-2',
            title: 'Preparing the Unadjusted & Adjusted Trial Balance',
            description: 'Locating errors, trial balance worksheets, and balancing rules.',
            duration: '40 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/8ZKRWAad6Sk',
            quizId: 'qz-106',
            downloadIds: ['dl-107'],
            contentMarkdown: `
# Preparing a Trial Balance

A Trial Balance lists all general ledger accounts with their final Debit or Credit balance.
Sum of Debits must equal Sum of Credits.
`
          }
        ]
      }
    ]
  },
  {
    id: 'crs-2',
    title: 'Basic Accounting Principles',
    code: 'ACCT 101',
    category: 'Basic Accounting Principles',
    level: 'Beginner',
    instructor: 'Prof. Eleanor Vance, CPA',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
    description: 'Master the fundamental rules of accounting: Double-entry bookkeeping, the Accounting Equation (Assets = Liabilities + Equity), and core GAAP assumptions.',
    totalLessons: 3,
    completedLessons: 0,
    topics: [
      {
        id: 'tpc-101-1',
        title: 'The Accounting Equation & Financial Character',
        description: 'Understand how transactions affect Assets, Liabilities, and Owner Equity.',
        lessons: [
          {
            id: 'lsn-1',
            topicId: 'tpc-101-1',
            title: 'Understanding Assets, Liabilities, and Owner\'s Equity',
            description: 'Define the three core elements of the financial position statement.',
            duration: '20 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/Q_6A1ieXgp4',
            quizId: 'qz-101',
            downloadIds: ['dl-101', 'dl-102'],
            contentMarkdown: `
# Understanding Assets, Liabilities, and Owner's Equity

### 1. What are Assets?
Assets are economic resources owned or controlled by an entity that will produce future economic benefits.
* **Current Assets**: Cash, Accounts Receivable, Inventory, Prepaid Expenses.
* **Non-Current Assets**: Equipment, Buildings, Vehicles, Trademarks.

### 2. What are Liabilities?
Liabilities represent debts or obligations owed to third parties arising from past transactions.
* **Current Liabilities**: Accounts Payable, Salaries Payable, Short-term Loans.
* **Non-Current Liabilities**: Mortgages Payable, Long-term Notes Payable.

### 3. Owner's Equity
Equity is the residual interest in the assets of the enterprise after deducting all its liabilities.
$$\\text{Assets} = \\text{Liabilities} + \\text{Owner's Equity}$$
`
          },
          {
            id: 'lsn-2',
            topicId: 'tpc-101-1',
            title: 'Double-Entry System: Debits and Credits',
            description: 'Learn the golden rules of Debit (Dr) and Credit (Cr) entries.',
            duration: '25 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/VhwZ9t2b3Zk',
            quizId: 'qz-102',
            downloadIds: ['dl-103'],
            contentMarkdown: `
# Double-Entry Bookkeeping System

In double-entry bookkeeping, every transaction affects **at least two accounts**.
* **Debit (Dr)** means left side.
* **Credit (Cr)** means right side.

### Account Rules:
| Account Type | Increase Side | Decrease Side | Normal Balance |
|---|---|---|---|
| Assets | Debit | Credit | Debit |
| Expenses | Debit | Credit | Debit |
| Liabilities | Credit | Debit | Credit |
| Equity | Credit | Debit | Credit |
| Revenue | Credit | Debit | Credit |
`
          }
        ]
      },
      {
        id: 'tpc-101-2',
        title: 'Generally Accepted Accounting Principles (GAAP)',
        description: 'Historical cost principle, Revenue Recognition, Matching Principle, and Conservatism.',
        lessons: [
          {
            id: 'lsn-3',
            topicId: 'tpc-101-2',
            title: 'The Accrual Basis vs. Cash Basis Accounting',
            description: 'Compare cash timing vs revenue recognition when earned.',
            duration: '30 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/YZyBSU6YdmM',
            quizId: 'qz-103',
            downloadIds: ['dl-104'],
            contentMarkdown: `
# Accrual Basis vs Cash Basis Accounting

Under **Accrual Basis Accounting**:
* Revenues are recognized when earned (service performed / goods delivered).
* Expenses are recognized when incurred (regardless of cash payment date).

Under **Cash Basis Accounting**:
* Revenues are recorded only when cash is received.
* Expenses are recorded only when cash is disbursed.
`
          }
        ]
      }
    ]
  },
  {
    id: 'crs-3',
    title: 'Introduction to Bookkeeping',
    code: 'ACCT 100',
    category: 'Basic Accounting Principles',
    level: 'Beginner',
    instructor: 'Prof. Eleanor Vance, CPA',
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600',
    description: 'Covers the fundamentals, purpose, career responsibilities, and essential importance of modern bookkeeping.',
    totalLessons: 2,
    completedLessons: 0,
    topics: [
      {
        id: 'tpc-100-1',
        title: 'The Role of Bookkeeping',
        description: 'Understand the difference between bookkeeping and accounting.',
        lessons: [
          {
            id: 'lsn-8',
            topicId: 'tpc-100-1',
            title: 'The Purpose and Responsibilities of a Bookkeeper',
            description: 'Daily ledger maintenance, reconciliations, and reporting support.',
            duration: '20 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/Q_6A1ieXgp4',
            quizId: 'qz-101',
            downloadIds: ['dl-101'],
            contentMarkdown: `
# The Purpose of Bookkeeping

Bookkeeping is the systematic recording, organizing, and tracking of financial transactions in a business.
* Maintains accuracy of financial accounts.
* Prevents discrepancies and tracks cash flows.
`
          },
          {
            id: 'lsn-9',
            topicId: 'tpc-100-1',
            title: 'Source Documents & Audit Trails',
            description: 'Invoices, receipts, purchase orders, and bank statements.',
            duration: '25 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/56xscQ4viWE',
            quizId: 'qz-102',
            downloadIds: ['dl-102'],
            contentMarkdown: `
# Source Documents in Accounting

Every accounting entry must have evidence through a valid source document such as official receipts, bills, and contracts.
`
          }
        ]
      }
    ]
  },
  {
    id: 'crs-4',
    title: 'Practice Exercises',
    code: 'ACCT 104',
    category: 'Bookkeeping Cycle',
    level: 'Intermediate',
    instructor: 'Dr. Marcus Brody, CPA',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600',
    description: 'Allows learners to apply concepts through practical activities, comprehensive case studies, and real-world bookkeeping examples.',
    totalLessons: 2,
    completedLessons: 0,
    topics: [
      {
        id: 'tpc-104-1',
        title: 'Hands-on Accounting Case Study',
        description: 'Practical journalizing and ledger posting.',
        lessons: [
          {
            id: 'lsn-10',
            topicId: 'tpc-104-1',
            title: 'Comprehensive Service Business Practice Problem',
            description: 'Record 10 sample transactions for a creative agency.',
            duration: '45 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/8ZKRWAad6Sk',
            quizId: 'qz-104',
            downloadIds: ['dl-105'],
            contentMarkdown: `
# Service Business Practice Problem

Practice recording startup investments, equipment purchase on account, client billings, and salaries.
`
          },
          {
            id: 'lsn-11',
            topicId: 'tpc-104-1',
            title: 'T-Account Reconciliation Exercise',
            description: 'Calculate balances and prove Debit/Credit equality.',
            duration: '35 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/Q_6A1ieXgp4',
            quizId: 'qz-105',
            downloadIds: ['dl-106'],
            contentMarkdown: `
# T-Account Reconciliation

Ensure total debits across asset and expense accounts equal total credits across liability, equity, and revenue accounts.
`
          }
        ]
      }
    ]
  },
  {
    id: 'crs-5',
    title: 'Adjusting Entries',
    code: 'ACCT 105',
    category: 'Financial Statements',
    level: 'Intermediate',
    instructor: 'Prof. Eleanor Vance, CPA',
    thumbnail: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=600',
    description: 'Introduces adjusting entries and their critical role in accurate financial reporting at period end.',
    totalLessons: 2,
    completedLessons: 0,
    topics: [
      {
        id: 'tpc-105-1',
        title: 'Accruals and Deferrals',
        description: 'Prepaid expenses, unearned revenues, accrued salaries, and accrued interest.',
        lessons: [
          {
            id: 'lsn-12',
            topicId: 'tpc-105-1',
            title: 'Adjusting for Prepayments & Deferrals',
            description: 'Convert balance sheet assets into income statement expenses.',
            duration: '30 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/VhwZ9t2b3Zk',
            quizId: 'qz-106',
            downloadIds: ['dl-107'],
            contentMarkdown: `
# Adjusting Entries: Deferrals

Cash was paid in advance, but the benefit is recognized over time (e.g. Prepaid Insurance).
`
          },
          {
            id: 'lsn-13',
            topicId: 'tpc-105-1',
            title: 'Accrued Revenues & Expenses',
            description: 'Recording expenses incurred before cash payment.',
            duration: '35 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/Q_6A1ieXgp4',
            quizId: 'qz-106',
            downloadIds: ['dl-107'],
            contentMarkdown: `
# Adjusting Entries: Accruals

Revenues earned or expenses incurred before cash is exchanged (e.g. Accrued Salaries).
`
          }
        ]
      }
    ]
  },
  {
    id: 'crs-6',
    title: 'Financial Statements',
    code: 'ACCT 103',
    category: 'Financial Statements',
    level: 'Advanced',
    instructor: 'Prof. Eleanor Vance, CPA',
    thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=600',
    description: 'Preparation of the income statement, balance sheet, and other basic financial reports.',
    totalLessons: 2,
    completedLessons: 0,
    topics: [
      {
        id: 'tpc-103-1',
        title: 'Core Financial Reports',
        description: 'Income Statement, Balance Sheet, and Cash Flow statement.',
        lessons: [
          {
            id: 'lsn-7',
            topicId: 'tpc-103-1',
            title: 'Building the Income Statement & Statement of Owner\'s Equity',
            description: 'Revenues minus Expenses equal Net Income or Loss.',
            duration: '30 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/0--AvwZabIQ',
            quizId: 'qz-107',
            downloadIds: ['dl-108'],
            contentMarkdown: `
# Income Statement & Equity

### Formula:
$$\\text{Net Income} = \\text{Total Revenues} - \\text{Total Expenses}$$

### Statement of Owner's Equity:
$$\\text{Ending Equity} = \\text{Beginning Equity} + \\text{Owner Investments} + \\text{Net Income} - \\text{Owner Withdrawals}$$
`
          },
          {
            id: 'lsn-14',
            topicId: 'tpc-103-1',
            title: 'Preparing the Classified Balance Sheet',
            description: 'Assets, Liabilities, and Equity presentation in formal accounting format.',
            duration: '40 mins',
            isCompleted: false,
            videoUrl: 'https://www.youtube.com/embed/Q_6A1ieXgp4',
            quizId: 'qz-107',
            downloadIds: ['dl-108'],
            contentMarkdown: `
# The Classified Balance Sheet

Presents Current vs Non-Current Assets and Current vs Non-Current Liabilities.
`
          }
        ]
      }
    ]
  }
];

export const initialQuizzes: Quiz[] = [
  {
    id: 'qz-101',
    title: 'Quiz 1: Assets, Liabilities & Owner\'s Equity',
    lessonId: 'lsn-1',
    topicTitle: 'Basic Accounting Principles',
    passingScore: 80,
    durationMinutes: 15,
    questions: [
      {
        id: 'q1',
        question: 'Which of the following is classified as a Current Asset?',
        options: ['Accounts Payable', 'Cash and Cash Equivalents', 'Office Building', 'Mortgage Payable'],
        correctAnswerIndex: 1,
        explanation: 'Cash and cash equivalents are liquid current assets expected to be converted or used within 1 year.'
      },
      {
        id: 'q2',
        question: 'If a company has total Assets of $150,000 and total Liabilities of $60,000, what is the Owner\'s Equity?',
        options: ['$210,000', '$90,000', '$150,000', '$60,000'],
        correctAnswerIndex: 1,
        explanation: 'Using the Accounting Equation: Equity = Assets - Liabilities = $150,000 - $60,000 = $90,000.'
      },
      {
        id: 'q3',
        question: 'What happens to the accounting equation when a business purchases equipment for cash?',
        options: [
          'Total Assets increase and Liabilities increase',
          'One Asset increases while another Asset decreases (Total Assets remain unchanged)',
          'Total Assets decrease and Equity decreases',
          'Liabilities decrease and Equity increases'
        ],
        correctAnswerIndex: 1,
        explanation: 'Equipment (Asset) increases by the cost, while Cash (Asset) decreases by the same amount.'
      }
    ]
  },
  {
    id: 'qz-102',
    title: 'Quiz 2: Debits and Credits Fundamentals',
    lessonId: 'lsn-2',
    topicTitle: 'Basic Accounting Principles',
    passingScore: 75,
    durationMinutes: 15,
    questions: [
      {
        id: 'q4',
        question: 'What is the normal balance of an Expense account?',
        options: ['Credit', 'Debit', 'Neutral', 'Depends on transaction'],
        correctAnswerIndex: 1,
        explanation: 'Expenses reduce owner equity, so they have a normal Debit balance.'
      },
      {
        id: 'q5',
        question: 'To increase a Revenue account balance, you should:',
        options: ['Debit the account', 'Credit the account', 'Multiply by interest rate', 'Zero out balance'],
        correctAnswerIndex: 1,
        explanation: 'Revenues increase Owner\'s Equity, which has a normal Credit balance. Therefore, revenues are increased by Credit.'
      }
    ]
  },
  {
    id: 'qz-104',
    title: 'Quiz 3: General Journal Entries',
    lessonId: 'lsn-4',
    topicTitle: 'Bookkeeping Cycle',
    passingScore: 80,
    durationMinutes: 20,
    questions: [
      {
        id: 'q6',
        question: 'A business renders $2,500 of bookkeeping services on account (to be billed). What is the correct journal entry?',
        options: [
          'Debit Cash $2,500, Credit Revenue $2,500',
          'Debit Accounts Receivable $2,500, Credit Service Revenue $2,500',
          'Debit Service Revenue $2,500, Credit Accounts Payable $2,500',
          'Debit Accounts Payable $2,500, Credit Cash $2,500'
        ],
        correctAnswerIndex: 1,
        explanation: 'Rendering services on account creates a claim against the customer (Accounts Receivable - Asset) and recognizes Service Revenue.'
      }
    ]
  }
];

export const initialSubmissions: QuizSubmission[] = [];

export const initialMaterials: DownloadableMaterial[] = [
  {
    id: 'dl-101',
    title: 'Accounting Equation Cheat Sheet & Summary',
    category: 'PDF Notes',
    fileType: 'pdf',
    fileSize: '1.2 MB',
    downloadUrl: '#',
    description: 'Quick reference guide summarizing definitions of Assets, Liabilities, Equity, and normal account balances.',
    downloadsCount: 142,
    uploadedAt: '2026-08-01'
  },
  {
    id: 'dl-102',
    title: 'Standard Chart of Accounts (COA) Template',
    category: 'Templates',
    fileType: 'xlsx',
    fileSize: '450 KB',
    downloadUrl: '#',
    description: 'Ready-to-use Excel template detailing standard account numbers for 1000s (Assets) to 5000s (Expenses).',
    downloadsCount: 289,
    uploadedAt: '2026-08-05'
  },
  {
    id: 'dl-103',
    title: 'Debit and Credit Flashcards Printable PDF',
    category: 'PDF Notes',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    downloadUrl: '#',
    description: 'Printable study cards to practice identifying debit and credit rules for quick exam preparation.',
    downloadsCount: 98,
    uploadedAt: '2026-08-10'
  },
  {
    id: 'dl-104',
    title: 'General Journal & T-Account Worksheet',
    category: 'Worksheets',
    fileType: 'xlsx',
    fileSize: '820 KB',
    downloadUrl: '#',
    description: 'Practice worksheet with automated debit/credit balance formula validation for manual practice.',
    downloadsCount: 310,
    uploadedAt: '2026-08-12'
  },
  {
    id: 'dl-105',
    title: 'Unadjusted Trial Balance Practice Problem & Solutions',
    category: 'Practice Exercises',
    fileType: 'pdf',
    fileSize: '1.8 MB',
    downloadUrl: '#',
    description: '15 transaction practice scenarios with step-by-step solutions to build trial balance worksheets.',
    downloadsCount: 215,
    uploadedAt: '2026-08-15'
  },
  {
    id: 'dl-106',
    title: 'Financial Statements Excel Master Template',
    category: 'Templates',
    fileType: 'xlsx',
    fileSize: '1.1 MB',
    downloadUrl: '#',
    description: 'Automated Excel sheet linking Trial Balance to Income Statement, Balance Sheet, and Retained Earnings.',
    downloadsCount: 420,
    uploadedAt: '2026-08-16'
  }
];

export const initialVideos: VideoLesson[] = [
  {
    id: 'vid-101',
    title: 'Introduction to Bookkeeping & Accounting Principles',
    topic: 'Basic Accounting Principles',
    duration: '14:25',
    videoUrl: 'https://www.youtube.com/embed/Q_6A1ieXgp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500',
    description: 'Comprehensive overview of bookkeeping vs accounting, financial statements, and business entity concepts.',
    keyTakeaways: [
      'Bookkeeping records transactions; accounting interprets data.',
      'Assets must always equal Liabilities plus Equity.',
      'Separate business entity from personal owner assets.'
    ],
    viewsCount: 1240
  },
  {
    id: 'vid-102',
    title: 'Mastering Debits & Credits (The T-Account Method)',
    topic: 'Bookkeeping Cycle',
    duration: '18:50',
    videoUrl: 'https://www.youtube.com/embed/VhwZ9t2b3Zk',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=500',
    description: 'Learn how to visualize transaction movements using T-Accounts and avoid common debit/credit reversal mistakes.',
    keyTakeaways: [
      'DEALER acronym: Debits increase Expenses, Assets, Losses. Credits increase Equity, Revenue, Liabilities.',
      'Posting journal entries to ledger T-accounts accurately.'
    ],
    viewsCount: 980
  },
  {
    id: 'vid-103',
    title: 'How to Prepare a Trial Balance & Locate Errors',
    topic: 'Trial Balance & Adjustments',
    duration: '12:10',
    videoUrl: 'https://www.youtube.com/embed/8ZKRWAad6Sk',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=500',
    description: 'Troubleshooting out-of-balance trial balances, transposition errors, and slide errors.',
    keyTakeaways: [
      'If the difference is divisible by 9, suspect a transposition error.',
      'Checking trial balance before recording adjusting entries.'
    ],
    viewsCount: 750
  }
];

export const initialSchedules: ScheduleItem[] = [
  {
    id: 'sch-1',
    title: 'Quiz 3: General Journal Entries Due',
    type: 'quiz',
    date: '2026-08-24',
    time: '23:59',
    description: 'Complete Quiz 3 covering journalizing transactions and debit/credit assignments.',
    isCompleted: false
  },
  {
    id: 'sch-2',
    title: 'Live Review Session: Trial Balance Adjustments',
    type: 'review',
    date: '2026-08-26',
    time: '14:00',
    description: 'Interactive online review session with Prof. Vance discussing accruals and deferrals.',
    isCompleted: false
  },
  {
    id: 'sch-3',
    title: 'Financial Statements Module Quiz',
    type: 'quiz',
    date: '2026-08-29',
    time: '18:00',
    description: 'End-of-unit comprehensive quiz for Financial Statements construction.',
    isCompleted: false
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New Downloadable Material Added!',
    message: 'Prof. Vance uploaded the "Financial Statements Excel Master Template" to the Downloads page.',
    category: 'announcement',
    createdAt: '2026-08-22T08:00:00Z',
    isRead: false,
    sender: 'Prof. Eleanor Vance, CPA'
  },
  {
    id: 'notif-2',
    title: 'Quiz Reminder: Journal Entries',
    message: 'Your Quiz 3 on General Journal Entries is scheduled for August 24. Make sure to review Lesson 4.',
    category: 'quiz',
    createdAt: '2026-08-21T10:30:00Z',
    isRead: false,
    sender: 'System Reminder'
  },
  {
    id: 'notif-3',
    title: 'Congratulations on Quiz 2!',
    message: 'You scored 100% on Debits and Credits Fundamentals. Excellent progress!',
    category: 'system',
    createdAt: '2026-08-20T14:16:00Z',
    isRead: true,
    sender: 'BookKeep-It System'
  }
];

export const initialFAQs: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Bookkeeping',
    question: 'What is the main difference between single-entry and double-entry bookkeeping?',
    answer: 'Single-entry bookkeeping records only cash receipts and disbursements (similar to a checkbook). Double-entry bookkeeping records both sides of every transaction (Debits and Credits), maintaining the accounting equation balance and preventing errors.'
  },
  {
    id: 'faq-2',
    category: 'Quizzes & Grades',
    question: 'Can I retake a quiz if I do not pass on my first attempt?',
    answer: 'Yes! Students can retake quizzes as many times as needed to achieve a passing score. Your highest score will be recorded in your Progress Tracker.'
  },
  {
    id: 'faq-3',
    category: 'Technical Support',
    question: 'How do I download the Excel bookkeeping worksheets for offline study?',
    answer: 'Navigate to the "Downloads/Templates" page in the left sidebar menu, find the desired material, and click the blue "Download File" button.'
  },
  {
    id: 'faq-4',
    category: 'Account & Settings',
    question: 'How do I update my profile picture or change my password?',
    answer: 'Click on your profile avatar in the upper right header or navigate to "Profile" or "Settings" in the sidebar to update your account details, avatar, and security preferences.'
  }
];

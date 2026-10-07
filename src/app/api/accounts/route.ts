import { NextResponse } from 'next/server';
import { UserAccount } from '@/types';

// Shared in-memory registered accounts store in the Next.js runtime
// Guarantees real registered students stay synchronized across devices & tabs
declare global {
  // eslint-disable-next-line no-var
  var __registeredAccountsStore: UserAccount[] | undefined;
}

export function getAccountsStore(): UserAccount[] {
  if (!globalThis.__registeredAccountsStore) {
    globalThis.__registeredAccountsStore = [];
  }
  return globalThis.__registeredAccountsStore;
}

function setAccountsStore(accounts: UserAccount[]) {
  globalThis.__registeredAccountsStore = accounts;
}

// GET /api/accounts - Returns all registered accounts
export async function GET() {
  try {
    const accounts = getAccountsStore();
    return NextResponse.json(
      { success: true, accounts },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// POST /api/accounts - Register or sync a real account
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const account = body.account as UserAccount;

    if (!account || !account.email || !account.name) {
      return NextResponse.json({ success: false, error: 'Invalid account data' }, { status: 400 });
    }

    const current = getAccountsStore();
    const existingIndex = current.findIndex(
      (a) => a.id === account.id || a.email.toLowerCase() === account.email.toLowerCase()
    );

    let updated: UserAccount[];
    if (existingIndex >= 0) {
      updated = current.map((a, idx) => (idx === existingIndex ? { ...a, ...account } : a));
    } else {
      updated = [...current, account];
    }

    setAccountsStore(updated);
    return NextResponse.json({ success: true, account, accounts: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

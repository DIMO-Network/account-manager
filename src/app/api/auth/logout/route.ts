import { NextResponse } from 'next/server';
import { deleteSession } from '@/libs/Session';

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout failed:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

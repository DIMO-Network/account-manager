import { deleteSession } from '@/libs/Session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await deleteSession();

    const cookieStore = await cookies();
    cookieStore.delete('dimo_jwt');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout failed:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

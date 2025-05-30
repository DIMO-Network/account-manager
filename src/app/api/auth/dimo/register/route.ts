import type { NextRequest } from 'next/server';
import { logger } from '@/libs/Logger';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, walletAddress, dimoToken } = await request.json();

    if (!email || !dimoToken) {
      return NextResponse.json(
        { error: 'Email and DIMO token are required' },
        { status: 400 },
      );
    }

    const client = await clerkClient();

    // Check if user exists
    const existingUsers = await client.users.getUserList({
      emailAddress: [email],
    });

    let user = existingUsers.data[0];

    if (user) {
      // Update existing user
      user = await client.users.updateUserMetadata(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          hasDimoAccount: true,
          walletAddress: walletAddress || null,
          lastDimoSync: new Date().toISOString(),
        },
        privateMetadata: {
          ...user.privateMetadata,
          dimoToken,
        },
      });

      // Create sign-in token for existing user
      const signInToken = await client.signInTokens.createSignInToken({
        userId: user.id,
        expiresInSeconds: 300, // 5 minutes
      });

      logger.info('Updated existing user with DIMO data', { userId: user.id, email });

      return NextResponse.json({
        success: true,
        email: user.emailAddresses[0]?.emailAddress || email,
        userId: user.id,
        signInToken: signInToken.token,
        isExistingUser: true,
      });
    } else {
      // Create new user
      user = await client.users.createUser({
        emailAddress: [email],
        publicMetadata: {
          hasDimoAccount: true,
          walletAddress: walletAddress || null,
          signupMethod: 'dimo',
          registrationDate: new Date().toISOString(),
        },
        privateMetadata: {
          dimoToken,
        },
        skipPasswordRequirement: true,
      });

      // Create sign-in token for new user too
      const signInToken = await client.signInTokens.createSignInToken({
        userId: user.id,
        expiresInSeconds: 300,
      });

      logger.info('Created new user with DIMO data', { userId: user.id, email });

      return NextResponse.json({
        success: true,
        email: user.emailAddresses[0]?.emailAddress || email,
        userId: user.id,
        signInToken: signInToken.token,
        isExistingUser: false,
      });
    }
  } catch (error) {
    logger.error('DIMO sync error', { error });
    return NextResponse.json(
      { error: 'Failed to sync DIMO user' },
      { status: 500 },
    );
  }
}

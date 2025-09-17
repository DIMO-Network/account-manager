import { getUser } from '@/libs/DAL';
import { stripe } from '@/libs/Stripe';
import { ERC20_EVENTS, TOKEN_CONFIG } from '@/utils/TokenConfig';
import { verifyDimoJwt } from '@/utils/verifyDimoJwt';
import { logger } from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import type { TransactionValidationError, TransactionValidationResponse } from '@/types/credit-balance';
import type { NextRequest } from 'next/server';

async function isTransactionAlreadyProcessed(txHash: string, customerId: string): Promise<boolean> {
  try {
    const balanceTransactions = await stripe().customers.listBalanceTransactions(customerId, {
      limit: 100,
    });

    const isProcessed = balanceTransactions.data.some(tx =>
      tx.metadata?.transactionHash === txHash
      && tx.metadata?.source === 'dimo_conversion',
    );

    return isProcessed;
  } catch (err) {
    logger.error('Error checking Stripe balance transactions:', err as Record<string, unknown>);
    return false; // If we can't check, allow processing (fail open)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json<TransactionValidationError>({
        error: 'User not authenticated',
      }, { status: 401 });
    }

    const { txHash } = await request.json();

    if (!txHash || typeof txHash !== 'string') {
      return NextResponse.json<TransactionValidationError>({
        error: 'Transaction hash is required',
      }, { status: 400 });
    }

    // Get Stripe customer ID for checking processed transactions
    let customerId: string;
    if (user.stripeCustomerId) {
      customerId = user.stripeCustomerId;
    } else {
      const existingCustomers = await stripe().customers.search({
        query: `email:'${user.email}'`,
        limit: 1,
      });

      if (existingCustomers.data.length === 0) {
        return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
      }

      const customer = existingCustomers.data[0];
      if (!customer) {
        return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
      }

      customerId = customer.id;
    }

    // Check if transaction has already been processed in Stripe
    const alreadyProcessed = await isTransactionAlreadyProcessed(txHash, customerId);
    if (alreadyProcessed) {
      return NextResponse.json({
        error: 'Transaction has already been processed',
        alreadyProcessed: true,
      }, { status: 409 });
    }

    // Create Viem client for Polygon
    const client = createPublicClient({
      chain: polygon,
      transport: http(),
    });

    // Get transaction details
    const transaction = await client.getTransaction({ hash: txHash as `0x${string}` });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Get transaction receipt to check status and logs
    const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });

    if (!receipt || receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction not confirmed or failed' }, { status: 400 });
    }

    // Verify the transaction is from the user's wallet
    let userWalletAddress = user.walletAddress?.toLowerCase();
    const transactionFromAddress = transaction.from.toLowerCase();

    // If wallet address is not in session, try to get it from JWT
    if (!userWalletAddress && user.dimoToken) {
      try {
        const payload = await verifyDimoJwt(user.dimoToken);
        userWalletAddress = payload.ethereum_address?.toLowerCase();
      } catch (error) {
        console.error('Failed to extract wallet address from JWT:', error);
      }
    }

    if (!userWalletAddress) {
      return NextResponse.json({ error: 'User wallet address not found in session or JWT' }, { status: 400 });
    }

    // Since we're using LIWD redirect, this is always an Account Abstraction transaction
    // We need to extract the actual sender from the DIMO transfer logs
    // The transaction.from is the bundler, not the actual user
    const DIMO_CONTRACT = TOKEN_CONFIG.DIMO.contract;

    const transferLogs = receipt.logs.filter(log =>
      log.address.toLowerCase() === DIMO_CONTRACT.toLowerCase()
      && log.topics && log.topics[0] === ERC20_EVENTS.TRANSFER,
    );

    if (transferLogs.length === 0) {
      return NextResponse.json({ error: 'No DIMO transfer found in transaction logs' }, { status: 400 });
    }

    // Extract the sender from the first transfer log (topics[1] is the from address)
    const senderTopic = transferLogs[0]?.topics[1];
    if (!senderTopic) {
      return NextResponse.json({ error: 'Could not extract sender from DIMO transfer logs' }, { status: 400 });
    }

    // Convert from 32-byte hex to 20-byte address
    const actualUserAddress = `0x${senderTopic.slice(26).toLowerCase()}`;

    if (actualUserAddress !== userWalletAddress) {
      return NextResponse.json({
        error: 'Transaction does not belong to authenticated user',
        userWallet: userWalletAddress,
        transactionFrom: transactionFromAddress,
        actualUserAddress,
      }, { status: 403 });
    }

    // Calculate total DIMO amount
    let totalDimoAmount = BigInt(0);
    for (const log of transferLogs) {
      const valueHex = log.data.slice(2); // Remove '0x' prefix
      const value = BigInt(`0x${valueHex}`);
      totalDimoAmount += value;
    }

    if (totalDimoAmount === BigInt(0)) {
      return NextResponse.json({ error: 'No DIMO amount found in transaction' }, { status: 400 });
    }

    // Convert from wei to DIMO (18 decimals)
    const dimoAmount = Number(totalDimoAmount) / 1e18;

    // Get current DIMO price
    const priceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dimo-price`);
    if (!priceResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch DIMO price' }, { status: 500 });
    }

    const { price: dimoPrice } = await priceResponse.json();
    const usdValue = dimoAmount * dimoPrice;

    // Transaction will be marked as processed when the credit is added to Stripe

    return NextResponse.json<TransactionValidationResponse>({
      dimoAmount,
      usdValue,
      transactionFrom: actualUserAddress,
      userWallet: userWalletAddress,
    });
  } catch (error) {
    console.error('Transaction validation failed:', error);
    return NextResponse.json<TransactionValidationError>(
      { error: error instanceof Error ? error.message : 'Transaction validation failed' },
      { status: 500 },
    );
  }
}

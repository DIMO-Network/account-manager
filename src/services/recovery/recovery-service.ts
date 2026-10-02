import type { SupportedChains } from './turnkey-bridge';
import type { TurnkeyAccountClient } from './zerodev-service';
import type { TransactionCall } from '@/services/transaction-builder/types';
import { generateP256KeyPair } from '@turnkey/crypto';
import { isAddressEqual } from 'viem';
import { createTurnkeyClient, getTurnkeyClient, getTurnkeyConfig, getTurnkeyWalletAddress } from './turnkey-bridge';
import { getKernelClient } from './zerodev-service';

export type RecoverySession = {
  dimoToken: string;
  subOrganizationId: string;
  walletAddress: string;
  eKey: string; // This would need to be generated/retrieved from LIWD session
};

export type DeploymentResult = {
  success: boolean;
  transactionHash?: string;
  error?: string;
};

export class RecoveryService {
  private session: RecoverySession;

  constructor(session: RecoverySession) {
    this.session = session;
  }

  /**
   * Create a kernel client for the target chain, refusing to continue unless the smart account
   * derived from the Turnkey signer is the user's DIMO wallet. Otherwise we would deploy (and
   * send from) a different account while the user's funds stay where they are.
   */
  private async getVerifiedKernelClient(targetChain: SupportedChains) {
    // Create Turnkey client using LIWD session data
    const turnkeyClient = getTurnkeyClient({
      authKey: this.session.dimoToken,
      eKey: this.session.eKey,
    });

    // Get signer address from Turnkey
    const signerAddress = await getTurnkeyWalletAddress({
      subOrganizationId: this.session.subOrganizationId,
      client: turnkeyClient,
    });

    // Create ZeroDev kernel client for the target chain
    const kernelClient = await getKernelClient({
      subOrganizationId: this.session.subOrganizationId,
      walletAddress: signerAddress,
      client: turnkeyClient as TurnkeyAccountClient,
      targetChain,
    });

    const derivedAddress = kernelClient.account.address;
    if (!isAddressEqual(derivedAddress, this.session.walletAddress as `0x${string}`)) {
      throw new Error(
        `The smart account derived from your signer (${derivedAddress}) does not match your DIMO wallet (${this.session.walletAddress}). `
        + 'Nothing was sent. Please contact DIMO support to recover these funds.',
      );
    }

    return kernelClient;
  }

  /**
   * Deploy smart account on the target chain
   */
  async deployAccount(targetChain: SupportedChains): Promise<DeploymentResult> {
    try {
      const kernelClient = await this.getVerifiedKernelClient(targetChain);

      // Send a dummy transaction to trigger account deployment
      // This is the pattern from Ed's implementation
      const transactionHash = await kernelClient.sendUserOperation({
        callData: '0x', // Empty call data for deployment
      });

      return {
        success: true,
        transactionHash,
      };
    } catch (error) {
      console.error('Deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute a call (contract call or native transfer) using the smart account
   */
  async executeTransaction({
    targetChain,
    to,
    value,
    data,
  }: TransactionCall & {
    targetChain: SupportedChains;
  }): Promise<DeploymentResult> {
    try {
      const kernelClient = await this.getVerifiedKernelClient(targetChain);

      // Send the transaction
      const userOperationHash = await kernelClient.sendUserOperation({
        callData: await kernelClient.account.encodeCalls([{ to, value, data }]),
      });

      // Wait until it lands: the user operation hash isn't a transaction hash explorers know about,
      // and an included user operation can still revert
      const { success, receipt } = await kernelClient.waitForUserOperationReceipt({
        hash: userOperationHash,
      });

      if (!success) {
        return {
          success: false,
          error: `Transaction reverted on-chain (${receipt.transactionHash})`,
        };
      }

      return {
        success: true,
        transactionHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error('Transaction execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Factory function to create RecoveryService from LIWD session
 * This is where we bridge the LIWD session with Turnkey
 */
export const createRecoveryService = async (liwdSession: {
  dimoToken: string;
  subOrganizationId: string;
  walletAddress: string;
}): Promise<RecoveryService> => {
  // Generate a new P256 key pair for this recovery session
  const keyPair = generateP256KeyPair();
  const eKey = keyPair.privateKey;
  const targetPubHex = keyPair.publicKeyUncompressed;

  // Create Turnkey session to get credential bundle
  const turnkeyClient = createTurnkeyClient();

  const config = getTurnkeyConfig();
  const passkeyClient = turnkeyClient.passkeyClient({
    rpId: config.rpId,
  });

  const nowInSeconds = Math.ceil(Date.now() / 1000);
  const sessionExpiration = nowInSeconds + (60 * 30); // 30 minutes

  try {
    const { credentialBundle } = await passkeyClient.createReadWriteSession({
      organizationId: liwdSession.subOrganizationId,
      targetPublicKey: targetPubHex,
      expirationSeconds: sessionExpiration.toString(),
    });

    return new RecoveryService({
      dimoToken: credentialBundle, // Use credential bundle instead of JWT
      subOrganizationId: liwdSession.subOrganizationId,
      walletAddress: liwdSession.walletAddress,
      eKey,
    });
  } catch (error) {
    console.error('Turnkey session creation failed:', error);

    if (error instanceof Error && error.name === 'NotAllowedError') {
      throw new Error('Passkey authentication failed. This is expected since we\'re using a placeholder subOrganizationId. You need to register a passkey for the actual DIMO organization.');
    }

    throw new Error(`Turnkey session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

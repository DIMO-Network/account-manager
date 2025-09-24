import type { SupportedChains } from './turnkey-bridge';
import { getTurnkeyClient, getTurnkeyWalletAddress } from './turnkey-bridge';
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
   * Deploy smart account on the target chain
   */
  async deployAccount(targetChain: SupportedChains): Promise<DeploymentResult> {
    try {
      // Create Turnkey client using LIWD session data
      const turnkeyClient = getTurnkeyClient({
        authKey: this.session.dimoToken,
        eKey: this.session.eKey,
      });

      // Get wallet address from Turnkey
      const walletAddress = await getTurnkeyWalletAddress({
        subOrganizationId: this.session.subOrganizationId,
        client: turnkeyClient,
      });

      // Create ZeroDev kernel client for the target chain
      const kernelClient = await getKernelClient({
        subOrganizationId: this.session.subOrganizationId,
        walletAddress,
        client: turnkeyClient,
        targetChain,
      });

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
   * Check if account is already deployed on target chain
   */
  async isAccountDeployed(targetChain: SupportedChains): Promise<boolean> {
    try {
      const turnkeyClient = getTurnkeyClient({
        authKey: this.session.dimoToken,
        eKey: this.session.eKey,
      });

      const walletAddress = await getTurnkeyWalletAddress({
        subOrganizationId: this.session.subOrganizationId,
        client: turnkeyClient,
      });

      // Try to create kernel client - if it fails, account is not deployed
      await getKernelClient({
        subOrganizationId: this.session.subOrganizationId,
        walletAddress,
        client: turnkeyClient,
        targetChain,
      });

      return true;
    } catch {
      return false;
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
  // TODO: Extract eKey from LIWD session
  // For now, we'll need to generate or retrieve this from the session
  // This is the missing piece that asfiroth mentioned
  const eKey = ''; // This needs to be extracted from LIWD session

  if (!eKey) {
    throw new Error('eKey not found in LIWD session - this needs to be implemented');
  }

  return new RecoveryService({
    dimoToken: liwdSession.dimoToken,
    subOrganizationId: liwdSession.subOrganizationId,
    walletAddress: liwdSession.walletAddress,
    eKey,
  });
};

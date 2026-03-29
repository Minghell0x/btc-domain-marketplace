import { Address } from '@btc-vision/transaction';
import type { AbstractRpcProvider } from 'opnet';
import { getOP20Contract, getOP20WriteContract } from './ContractService';
import { fetchMotoTokenAddress } from './MarketplaceService';
import type { IOP20 } from '../abi/OP20';
import { NETWORK } from '../config/constants';

/**
 * Read-only MOTO token (OP20) service.
 * Lazily resolves the MOTO token address from the marketplace contract, then caches it.
 */

let cachedTokenAddress: string | null = null;
let cachedTokenContract: IOP20 | null = null;

async function getMotoContract(): Promise<IOP20> {
    if (cachedTokenContract) {
        return cachedTokenContract;
    }

    if (!cachedTokenAddress) {
        cachedTokenAddress = await fetchMotoTokenAddress();
    }

    cachedTokenContract = getOP20Contract(cachedTokenAddress);
    return cachedTokenContract;
}

export async function fetchMotoBalance(ownerAddress: Address): Promise<bigint> {
    try {
        const token = await getMotoContract();
        const result = await token.balanceOf(ownerAddress);
        return result.properties.balance;
    } catch (error) {
        console.error('[MotoService] fetchMotoBalance() failed:', error);
        throw error;
    }
}

export async function fetchMotoAllowance(
    ownerAddress: Address,
    spenderAddress: Address,
): Promise<bigint> {
    try {
        const token = await getMotoContract();
        const result = await token.allowance(ownerAddress, spenderAddress);
        return result.properties.remaining;
    } catch (error) {
        console.error('[MotoService] fetchMotoAllowance() failed:', error);
        throw error;
    }
}

export async function fetchMotoDecimals(): Promise<number> {
    try {
        const token = await getMotoContract();
        const result = await token.decimals();
        return result.properties.decimals;
    } catch (error) {
        console.error('[MotoService] fetchMotoDecimals() failed:', error);
        throw error;
    }
}

export async function fetchMotoSymbol(): Promise<string> {
    try {
        const token = await getMotoContract();
        const result = await token.symbol();
        return result.properties.symbol;
    } catch (error) {
        console.error('[MotoService] fetchMotoSymbol() failed:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Write methods (require wallet)
// ---------------------------------------------------------------------------

async function getMotoTokenAddress(): Promise<string> {
    if (!cachedTokenAddress) {
        cachedTokenAddress = await fetchMotoTokenAddress();
    }
    return cachedTokenAddress;
}

export async function increaseAllowanceTx(
    spenderAddress: Address,
    amount: bigint,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const tokenAddr = await getMotoTokenAddress();
        const token = getOP20WriteContract(tokenAddr, walletProvider, senderAddress);

        const simulation = await token.increaseAllowance(spenderAddress, amount);

        if (simulation.revert) {
            throw new Error(`increaseAllowance reverted: ${simulation.revert}`);
        }

        const receipt = await simulation.sendTransaction({
            signer: null,
            mldsaSigner: null,
            refundTo: refundAddress,
            maximumAllowedSatToSpend: 1_000_000n,
            network: NETWORK,
        });

        return { txHash: receipt.transactionId };
    } catch (error) {
        console.error('[MotoService] increaseAllowanceTx() failed:', error);
        throw error;
    }
}

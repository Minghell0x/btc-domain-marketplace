import { Address } from '@btc-vision/transaction';
import { toSatoshi } from '@btc-vision/bitcoin';
import type { AbstractRpcProvider } from 'opnet';
import { TransactionOutputFlags } from 'opnet';
import { getResolverContract, getResolverWriteContract } from './ContractService';
import type { DomainInfo, DomainPrice } from '../types';
import { NETWORK } from '../config/constants';

/**
 * Read-only resolver service.
 * All methods call the BtcNameResolver contract without needing wallet connection.
 */

export async function lookupDomain(name: string): Promise<DomainInfo> {
    try {
        const resolver = getResolverContract();
        const result = await resolver.getDomain(name);
        const p = result.properties;

        return {
            exists: p.exists,
            owner: p.owner.toString(),
            ownerHex: p.owner.toString(),
            createdAt: p.createdAt,
            expiresAt: p.expiresAt,
            ttl: p.ttl,
            isActive: p.isActive,
            inGracePeriod: p.inGracePeriod,
        };
    } catch (error) {
        console.error(`[ResolverService] lookupDomain("${name}") failed:`, error);
        throw error;
    }
}

export async function fetchDomainPrice(name: string, years: number): Promise<DomainPrice> {
    try {
        const resolver = getResolverContract();
        const result = await resolver.getDomainPrice(name, BigInt(years));
        const p = result.properties;

        return {
            totalPriceSats: p.totalPriceSats,
            auctionPriceSats: p.auctionPriceSats,
            renewalPerYear: p.renewalPerYear,
        };
    } catch (error) {
        console.error(`[ResolverService] fetchDomainPrice("${name}", ${years}) failed:`, error);
        throw error;
    }
}

export async function fetchBasePrice(): Promise<bigint> {
    try {
        const resolver = getResolverContract();
        const result = await resolver.getBaseDomainPrice();
        return result.properties.priceSats;
    } catch (error) {
        console.error('[ResolverService] fetchBasePrice() failed:', error);
        throw error;
    }
}

export async function fetchTreasuryAddress(): Promise<string> {
    try {
        const resolver = getResolverContract();
        const result = await resolver.getTreasuryAddress();
        return result.properties.treasuryAddress;
    } catch (error) {
        console.error('[ResolverService] fetchTreasuryAddress() failed:', error);
        throw error;
    }
}

export async function resolveDomain(name: string): Promise<string> {
    try {
        const resolver = getResolverContract();
        const result = await resolver.resolve(name);
        return result.properties.owner.toString();
    } catch (error) {
        console.error(`[ResolverService] resolveDomain("${name}") failed:`, error);
        throw error;
    }
}

export async function fetchDomainsByOwner(
    ownerAddress: Address,
    offset: bigint = 0n,
    limit: bigint = 100n,
): Promise<string[]> {
    try {
        const resolver = getResolverContract();
        const result = await resolver.getDomainsByOwner(ownerAddress, offset, limit);
        return result.properties.names;
    } catch (error) {
        console.error('[ResolverService] fetchDomainsByOwner() failed:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Write methods (require wallet)
// ---------------------------------------------------------------------------

export async function initiateTransferTx(
    name: string,
    newOwner: Address,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const resolver = getResolverWriteContract(walletProvider, senderAddress);
        const simulation = await resolver.initiateTransfer(name, newOwner);

        if (simulation.revert) {
            throw new Error(`initiateTransfer reverted: ${simulation.revert}`);
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
        console.error(`[ResolverService] initiateTransferTx("${name}") failed:`, error);
        throw error;
    }
}

export async function completeRegistrationTx(
    name: string,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const resolver = getResolverWriteContract(walletProvider, senderAddress);
        const simulation = await resolver.completeRegistration(name);

        if (simulation.revert) {
            throw new Error(`completeRegistration reverted: ${simulation.revert}`);
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
        console.error(`[ResolverService] completeRegistrationTx("${name}") failed:`, error);
        throw error;
    }
}

export async function reserveDomainTx(
    name: string,
    years: number,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const [resolverTreasury, domainPrice] = await Promise.all([
            fetchTreasuryAddress(),
            fetchDomainPrice(name, years),
        ]);

        const totalPriceSats = domainPrice.totalPriceSats;

        const resolver = getResolverWriteContract(walletProvider, senderAddress);

        // Payable: set transaction details BEFORE simulate
        resolver.setTransactionDetails({
            inputs: [],
            outputs: [
                {
                    value: totalPriceSats,
                    index: 1,
                    to: resolverTreasury,
                    flags: TransactionOutputFlags.hasTo,
                },
            ],
        });

        const simulation = await resolver.reserveDomain(name, BigInt(years));

        if (simulation.revert) {
            throw new Error(`reserveDomain reverted: ${simulation.revert}`);
        }

        const receipt = await simulation.sendTransaction({
            signer: null,
            mldsaSigner: null,
            refundTo: refundAddress,
            maximumAllowedSatToSpend: totalPriceSats + 1_000_000n,
            network: NETWORK,
            extraOutputs: [
                {
                    address: resolverTreasury,
                    value: toSatoshi(totalPriceSats),
                },
            ],
        });

        return { txHash: receipt.transactionId };
    } catch (error) {
        console.error(`[ResolverService] reserveDomainTx("${name}") failed:`, error);
        throw error;
    }
}

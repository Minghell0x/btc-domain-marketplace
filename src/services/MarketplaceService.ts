import { Address } from '@btc-vision/transaction';
import { toSatoshi } from '@btc-vision/bitcoin';
import type { AbstractRpcProvider } from 'opnet';
import { TransactionOutputFlags } from 'opnet';
import { getMarketplaceContract, getMarketplaceWriteContract } from './ContractService';
import { fetchDomainPrice } from './ResolverService';
import type { Listing, Reservation, Offer, PendingRegistration } from '../types';
import { NETWORK, RESERVATION_FEE_SATS, BPS_DENOMINATOR } from '../config/constants';

/**
 * Read-only marketplace service.
 * All methods call the BtcDomainMarketplace contract without needing wallet connection.
 */

export async function fetchListing(name: string): Promise<Listing> {
    try {
        const marketplace = getMarketplaceContract();
        const result = await marketplace._getListing(name);
        const p = result.properties;

        return {
            exists: p.exists,
            seller: p.seller,
            sellerHex: p.seller.toString(),
            btcPrice: p.btcPrice,
            motoPrice: p.motoPrice,
            sellerBtcAddress: p.sellerBtcAddress,
            isReserved: p.isReserved,
        };
    } catch (error) {
        console.error(`[MarketplaceService] fetchListing("${name}") failed:`, error);
        throw error;
    }
}

export async function fetchReservation(name: string): Promise<Reservation> {
    try {
        const marketplace = getMarketplaceContract();
        const result = await marketplace._getReservation(name);
        const p = result.properties;

        return {
            buyer: p.buyer,
            buyerHex: p.buyer.toString(),
            reservedAtBlock: p.reservedAtBlock,
            isActive: p.isActive,
        };
    } catch (error) {
        console.error(`[MarketplaceService] fetchReservation("${name}") failed:`, error);
        throw error;
    }
}

export async function fetchOffers(name: string): Promise<Offer[]> {
    try {
        const marketplace = getMarketplaceContract();
        const countResult = await marketplace._getOfferCount(name);
        const count = Number(countResult.properties.count);

        const offers: Offer[] = [];
        for (let i = 0; i < count; i++) {
            const result = await marketplace._getOffer(name, BigInt(i));
            const p = result.properties;

            offers.push({
                index: i,
                buyer: p.buyer,
                buyerHex: p.buyer.toString(),
                btcAmount: p.btcAmount,
                motoAmount: p.motoAmount,
                expiryBlock: p.expiryBlock,
                isActive: p.isActive,
                isMotoLocked: p.isMotoLocked,
            });
        }

        return offers;
    } catch (error) {
        console.error(`[MarketplaceService] fetchOffers("${name}") failed:`, error);
        throw error;
    }
}

export async function fetchTreasuryAddress(): Promise<string> {
    try {
        const marketplace = getMarketplaceContract();
        const result = await marketplace._getTreasuryAddress();
        return result.properties.treasuryAddress;
    } catch (error) {
        console.error('[MarketplaceService] fetchTreasuryAddress() failed:', error);
        throw error;
    }
}

export async function fetchFeeRate(): Promise<bigint> {
    try {
        const marketplace = getMarketplaceContract();
        const result = await marketplace._getFeeRate();
        return result.properties.feeRate;
    } catch (error) {
        console.error('[MarketplaceService] fetchFeeRate() failed:', error);
        throw error;
    }
}

export async function fetchMotoTokenAddress(): Promise<string> {
    try {
        const marketplace = getMarketplaceContract();
        const result = await marketplace._getMotoTokenAddress();
        return result.properties.tokenAddress.toString();
    } catch (error) {
        console.error('[MarketplaceService] fetchMotoTokenAddress() failed:', error);
        throw error;
    }
}

export async function fetchPendingRegistration(name: string): Promise<PendingRegistration | null> {
    try {
        const marketplace = getMarketplaceContract();
        const result = await marketplace._getPendingRegistration(name);
        const p = result.properties;

        if (!p.isActive) {
            return null;
        }

        return {
            buyer: p.buyer,
            years: p.years,
            isActive: p.isActive,
        };
    } catch (error) {
        console.error(`[MarketplaceService] fetchPendingRegistration("${name}") failed:`, error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Write methods (require wallet)
// ---------------------------------------------------------------------------

export async function listDomainTx(
    name: string,
    btcPriceSats: bigint,
    motoPrice: bigint,
    sellerBtcAddress: string,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);
        const simulation = await contract._listDomain(name, btcPriceSats, motoPrice, sellerBtcAddress);

        if (simulation.revert) {
            throw new Error(`listDomain reverted: ${simulation.revert}`);
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
        console.error(`[MarketplaceService] listDomainTx("${name}") failed:`, error);
        throw error;
    }
}

export async function cancelListingTx(
    name: string,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);
        const simulation = await contract._cancelListing(name);

        if (simulation.revert) {
            throw new Error(`cancelListing reverted: ${simulation.revert}`);
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
        console.error(`[MarketplaceService] cancelListingTx("${name}") failed:`, error);
        throw error;
    }
}

export async function reservePurchaseTx(
    name: string,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const treasuryAddress = await fetchTreasuryAddress();

        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);

        // Payable: set transaction details BEFORE simulate
        contract.setTransactionDetails({
            inputs: [],
            outputs: [
                {
                    value: RESERVATION_FEE_SATS,
                    index: 1,
                    to: treasuryAddress,
                    flags: TransactionOutputFlags.hasTo,
                },
            ],
        });

        const simulation = await contract._reservePurchase(name);

        if (simulation.revert) {
            throw new Error(`reservePurchase reverted: ${simulation.revert}`);
        }

        const receipt = await simulation.sendTransaction({
            signer: null,
            mldsaSigner: null,
            refundTo: refundAddress,
            maximumAllowedSatToSpend: 1_000_000n,
            network: NETWORK,
            extraOutputs: [
                {
                    address: treasuryAddress,
                    value: toSatoshi(RESERVATION_FEE_SATS),
                },
            ],
        });

        return { txHash: receipt.transactionId };
    } catch (error) {
        console.error(`[MarketplaceService] reservePurchaseTx("${name}") failed:`, error);
        throw error;
    }
}

export async function completePurchaseTx(
    name: string,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const [listing, feeRate, treasuryAddress] = await Promise.all([
            fetchListing(name),
            fetchFeeRate(),
            fetchTreasuryAddress(),
        ]);

        const btcPrice = listing.btcPrice;
        const feeAmount = (btcPrice * feeRate) / BPS_DENOMINATOR;
        const sellerAmount = btcPrice - feeAmount;

        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);

        // Payable: set transaction details BEFORE simulate
        contract.setTransactionDetails({
            inputs: [],
            outputs: [
                {
                    value: sellerAmount,
                    index: 1,
                    to: listing.sellerBtcAddress,
                    flags: TransactionOutputFlags.hasTo,
                },
                {
                    value: feeAmount,
                    index: 2,
                    to: treasuryAddress,
                    flags: TransactionOutputFlags.hasTo,
                },
            ],
        });

        const simulation = await contract._completePurchase(name);

        if (simulation.revert) {
            throw new Error(`completePurchase reverted: ${simulation.revert}`);
        }

        const receipt = await simulation.sendTransaction({
            signer: null,
            mldsaSigner: null,
            refundTo: refundAddress,
            maximumAllowedSatToSpend: btcPrice + 1_000_000n,
            network: NETWORK,
            extraOutputs: [
                {
                    address: listing.sellerBtcAddress,
                    value: toSatoshi(sellerAmount),
                },
                {
                    address: treasuryAddress,
                    value: toSatoshi(feeAmount),
                },
            ],
        });

        return { txHash: receipt.transactionId };
    } catch (error) {
        console.error(`[MarketplaceService] completePurchaseTx("${name}") failed:`, error);
        throw error;
    }
}

export async function buyWithMotoTx(
    name: string,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);
        const simulation = await contract._buyWithMoto(name);

        if (simulation.revert) {
            throw new Error(`buyWithMoto reverted: ${simulation.revert}`);
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
        console.error(`[MarketplaceService] buyWithMotoTx("${name}") failed:`, error);
        throw error;
    }
}

export async function makeOfferTx(
    name: string,
    btcAmount: bigint,
    motoAmount: bigint,
    expiryBlocks: bigint,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);
        const simulation = await contract._makeOffer(name, btcAmount, motoAmount, expiryBlocks);

        if (simulation.revert) {
            throw new Error(`makeOffer reverted: ${simulation.revert}`);
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
        console.error(`[MarketplaceService] makeOfferTx("${name}") failed:`, error);
        throw error;
    }
}

export async function acceptOfferTx(
    name: string,
    offerIndex: number,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);
        const simulation = await contract._acceptOffer(name, BigInt(offerIndex));

        if (simulation.revert) {
            throw new Error(`acceptOffer reverted: ${simulation.revert}`);
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
        console.error(`[MarketplaceService] acceptOfferTx("${name}") failed:`, error);
        throw error;
    }
}

export async function cancelOfferTx(
    name: string,
    offerIndex: number,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);
        const simulation = await contract._cancelOffer(name, BigInt(offerIndex));

        if (simulation.revert) {
            throw new Error(`cancelOffer reverted: ${simulation.revert}`);
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
        console.error(`[MarketplaceService] cancelOfferTx("${name}") failed:`, error);
        throw error;
    }
}

export async function registerDomainBtcReserveTx(
    name: string,
    years: number,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const [domainPrice, feeRate, treasuryAddress] = await Promise.all([
            fetchDomainPrice(name, years),
            fetchFeeRate(),
            fetchTreasuryAddress(),
        ]);

        const totalPriceSats = domainPrice.totalPriceSats;
        const marketplaceFee = (totalPriceSats * feeRate) / BPS_DENOMINATOR;

        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);

        // Payable: set transaction details BEFORE simulate
        contract.setTransactionDetails({
            inputs: [],
            outputs: [
                {
                    value: marketplaceFee,
                    index: 1,
                    to: treasuryAddress,
                    flags: TransactionOutputFlags.hasTo,
                },
            ],
        });

        const simulation = await contract._registerDomainBtcReserve(name, BigInt(years));

        if (simulation.revert) {
            throw new Error(`registerDomainBtcReserve reverted: ${simulation.revert}`);
        }

        const receipt = await simulation.sendTransaction({
            signer: null,
            mldsaSigner: null,
            refundTo: refundAddress,
            maximumAllowedSatToSpend: marketplaceFee + 1_000_000n,
            network: NETWORK,
            extraOutputs: [
                {
                    address: treasuryAddress,
                    value: toSatoshi(marketplaceFee),
                },
            ],
        });

        return { txHash: receipt.transactionId };
    } catch (error) {
        console.error(`[MarketplaceService] registerDomainBtcReserveTx("${name}") failed:`, error);
        throw error;
    }
}

export async function registerDomainBtcCompleteTx(
    name: string,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);
        const simulation = await contract._registerDomainBtcComplete(name);

        if (simulation.revert) {
            throw new Error(`registerDomainBtcComplete reverted: ${simulation.revert}`);
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
        console.error(`[MarketplaceService] registerDomainBtcCompleteTx("${name}") failed:`, error);
        throw error;
    }
}

export async function registerDomainMotoTx(
    name: string,
    years: number,
    motoResolverPrice: bigint,
    refundAddress: string,
    walletProvider: AbstractRpcProvider,
    senderAddress: Address,
): Promise<{ txHash: string }> {
    try {
        const contract = getMarketplaceWriteContract(walletProvider, senderAddress);
        const simulation = await contract._registerDomainMoto(name, BigInt(years), motoResolverPrice);

        if (simulation.revert) {
            throw new Error(`registerDomainMoto reverted: ${simulation.revert}`);
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
        console.error(`[MarketplaceService] registerDomainMotoTx("${name}") failed:`, error);
        throw error;
    }
}

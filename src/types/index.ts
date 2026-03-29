import type { Address } from '@btc-vision/transaction';

export interface DomainInfo {
    exists: boolean;
    owner: string;
    ownerHex: string;
    createdAt: bigint;
    expiresAt: bigint;
    ttl: bigint;
    isActive: boolean;
    inGracePeriod: boolean;
}

export interface DomainPrice {
    totalPriceSats: bigint;
    auctionPriceSats: bigint;
    renewalPerYear: bigint;
}

export interface Listing {
    exists: boolean;
    seller: Address;
    sellerHex: string;
    btcPrice: bigint;
    motoPrice: bigint;
    sellerBtcAddress: string;
    isReserved: boolean;
}

export interface Reservation {
    buyer: Address;
    buyerHex: string;
    reservedAtBlock: bigint;
    isActive: boolean;
}

export interface Offer {
    index: number;
    buyer: Address;
    buyerHex: string;
    btcAmount: bigint;
    motoAmount: bigint;
    expiryBlock: bigint;
    isActive: boolean;
    isMotoLocked: boolean;
}

export interface PendingRegistration {
    buyer: Address;
    years: bigint;
    isActive: boolean;
}

export interface ListingWithDomain {
    name: string;
    listing: Listing;
    domain: DomainInfo | null;
    offerCount: number;
}

export type DomainStatus = 'available' | 'active' | 'expiring' | 'grace-period';
export type ListingStatus = 'listed' | 'reserved' | 'sold' | 'cancelled';
export type PaymentType = 'btc' | 'moto';

export interface MarketplaceActivity {
    type: 'listed' | 'sold' | 'offer-made' | 'offer-accepted' | 'reserved' | 'delisted' | 'registered';
    label: string;
    domainName: string;
    txHash: string;
    blockHeight: number;
    timestamp: number;
}

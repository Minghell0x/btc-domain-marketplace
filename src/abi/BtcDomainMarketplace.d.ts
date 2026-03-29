import { Address, AddressMap, ExtendedAddressMap, SchnorrSignature } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the _listDomain function call.
 */
export type listDomain = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _cancelListing function call.
 */
export type cancelListing = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _reservePurchase function call.
 */
export type reservePurchase = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _completePurchase function call.
 */
export type completePurchase = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _buyWithMoto function call.
 */
export type buyWithMoto = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the onOP20Received function call.
 */
export type OnOP20Received = CallResult<
    {
        selector: Uint8Array;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the _setTreasuryAddress function call.
 */
export type setTreasuryAddress = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _setFeeRate function call.
 */
export type setFeeRate = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _setMotoTokenAddress function call.
 */
export type setMotoTokenAddress = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _withdrawMotoFees function call.
 */
export type withdrawMotoFees = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _getListing function call.
 */
export type getListing = CallResult<
    {
        exists: boolean;
        seller: Address;
        btcPrice: bigint;
        motoPrice: bigint;
        sellerBtcAddress: string;
        isReserved: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the _getReservation function call.
 */
export type getReservation = CallResult<
    {
        buyer: Address;
        reservedAtBlock: bigint;
        isActive: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the _getTreasuryAddress function call.
 */
export type getTreasuryAddress = CallResult<
    {
        treasuryAddress: string;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the _getFeeRate function call.
 */
export type getFeeRate = CallResult<
    {
        feeRate: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the _getMotoTokenAddress function call.
 */
export type getMotoTokenAddress = CallResult<
    {
        tokenAddress: Address;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the _makeOffer function call.
 */
export type makeOffer = CallResult<
    {
        offerIndex: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the _cancelOffer function call.
 */
export type cancelOffer = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _acceptOffer function call.
 */
export type acceptOffer = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _getOffer function call.
 */
export type getOffer = CallResult<
    {
        buyer: Address;
        btcAmount: bigint;
        motoAmount: bigint;
        expiryBlock: bigint;
        isActive: boolean;
        isMotoLocked: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the _getOfferCount function call.
 */
export type getOfferCount = CallResult<
    {
        count: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the _registerDomainBtcReserve function call.
 */
export type registerDomainBtcReserve = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _registerDomainBtcComplete function call.
 */
export type registerDomainBtcComplete = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _registerDomainMoto function call.
 */
export type registerDomainMoto = CallResult<{}, OPNetEvent<never>[]>;

/**
 * @description Represents the result of the _getPendingRegistration function call.
 */
export type getPendingRegistration = CallResult<
    {
        buyer: Address;
        years: bigint;
        isActive: boolean;
    },
    OPNetEvent<never>[]
>;

// ------------------------------------------------------------------
// IBtcDomainMarketplace
// ------------------------------------------------------------------
export interface IBtcDomainMarketplace extends IOP_NETContract {
    _listDomain(
        domainName: string,
        btcPriceSats: bigint,
        motoPrice: bigint,
        sellerBtcAddress: string,
    ): Promise<listDomain>;
    _cancelListing(domainName: string): Promise<cancelListing>;
    _reservePurchase(domainName: string): Promise<reservePurchase>;
    _completePurchase(domainName: string): Promise<completePurchase>;
    _buyWithMoto(domainName: string): Promise<buyWithMoto>;
    onOP20Received(operator: Address, from: Address, amount: bigint, data: Uint8Array): Promise<OnOP20Received>;
    _setTreasuryAddress(newAddress: string): Promise<setTreasuryAddress>;
    _setFeeRate(bps: bigint): Promise<setFeeRate>;
    _setMotoTokenAddress(tokenAddress: Address): Promise<setMotoTokenAddress>;
    _withdrawMotoFees(): Promise<withdrawMotoFees>;
    _getListing(domainName: string): Promise<getListing>;
    _getReservation(domainName: string): Promise<getReservation>;
    _getTreasuryAddress(): Promise<getTreasuryAddress>;
    _getFeeRate(): Promise<getFeeRate>;
    _getMotoTokenAddress(): Promise<getMotoTokenAddress>;
    _makeOffer(domainName: string, btcAmount: bigint, motoAmount: bigint, expiryBlocks: bigint): Promise<makeOffer>;
    _cancelOffer(domainName: string, offerIndex: bigint): Promise<cancelOffer>;
    _acceptOffer(domainName: string, offerIndex: bigint): Promise<acceptOffer>;
    _getOffer(domainName: string, offerIndex: bigint): Promise<getOffer>;
    _getOfferCount(domainName: string): Promise<getOfferCount>;
    _registerDomainBtcReserve(domainName: string, years: bigint): Promise<registerDomainBtcReserve>;
    _registerDomainBtcComplete(domainName: string): Promise<registerDomainBtcComplete>;
    _registerDomainMoto(domainName: string, years: bigint, motoResolverPrice: bigint): Promise<registerDomainMoto>;
    _getPendingRegistration(domainName: string): Promise<getPendingRegistration>;
}

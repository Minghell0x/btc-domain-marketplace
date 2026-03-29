import { ABIDataTypes, BitcoinAbiTypes, OP_NET_ABI } from 'opnet';

export const BtcDomainMarketplaceEvents = [];

export const BtcDomainMarketplaceAbi = [
    {
        name: '_listDomain',
        inputs: [
            { name: 'domainName', type: ABIDataTypes.STRING },
            { name: 'btcPriceSats', type: ABIDataTypes.UINT64 },
            { name: 'motoPrice', type: ABIDataTypes.UINT256 },
            { name: 'sellerBtcAddress', type: ABIDataTypes.STRING },
        ],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_cancelListing',
        inputs: [{ name: 'domainName', type: ABIDataTypes.STRING }],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_reservePurchase',
        inputs: [{ name: 'domainName', type: ABIDataTypes.STRING }],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_completePurchase',
        inputs: [{ name: 'domainName', type: ABIDataTypes.STRING }],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_buyWithMoto',
        inputs: [{ name: 'domainName', type: ABIDataTypes.STRING }],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'onOP20Received',
        inputs: [
            { name: 'operator', type: ABIDataTypes.ADDRESS },
            { name: 'from', type: ABIDataTypes.ADDRESS },
            { name: 'amount', type: ABIDataTypes.UINT256 },
            { name: 'data', type: ABIDataTypes.BYTES },
        ],
        outputs: [{ name: 'selector', type: ABIDataTypes.BYTES4 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_setTreasuryAddress',
        inputs: [{ name: 'newAddress', type: ABIDataTypes.STRING }],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_setFeeRate',
        inputs: [{ name: 'bps', type: ABIDataTypes.UINT64 }],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_setMotoTokenAddress',
        inputs: [{ name: 'tokenAddress', type: ABIDataTypes.ADDRESS }],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_withdrawMotoFees',
        inputs: [],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_getListing',
        inputs: [{ name: 'domainName', type: ABIDataTypes.STRING }],
        outputs: [
            { name: 'exists', type: ABIDataTypes.BOOL },
            { name: 'seller', type: ABIDataTypes.ADDRESS },
            { name: 'btcPrice', type: ABIDataTypes.UINT64 },
            { name: 'motoPrice', type: ABIDataTypes.UINT256 },
            { name: 'sellerBtcAddress', type: ABIDataTypes.STRING },
            { name: 'isReserved', type: ABIDataTypes.BOOL },
        ],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_getReservation',
        inputs: [{ name: 'domainName', type: ABIDataTypes.STRING }],
        outputs: [
            { name: 'buyer', type: ABIDataTypes.ADDRESS },
            { name: 'reservedAtBlock', type: ABIDataTypes.UINT64 },
            { name: 'isActive', type: ABIDataTypes.BOOL },
        ],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_getTreasuryAddress',
        inputs: [],
        outputs: [{ name: 'treasuryAddress', type: ABIDataTypes.STRING }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_getFeeRate',
        inputs: [],
        outputs: [{ name: 'feeRate', type: ABIDataTypes.UINT64 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_getMotoTokenAddress',
        inputs: [],
        outputs: [{ name: 'tokenAddress', type: ABIDataTypes.ADDRESS }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_makeOffer',
        inputs: [
            { name: 'domainName', type: ABIDataTypes.STRING },
            { name: 'btcAmount', type: ABIDataTypes.UINT64 },
            { name: 'motoAmount', type: ABIDataTypes.UINT256 },
            { name: 'expiryBlocks', type: ABIDataTypes.UINT64 },
        ],
        outputs: [{ name: 'offerIndex', type: ABIDataTypes.UINT64 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_cancelOffer',
        inputs: [
            { name: 'domainName', type: ABIDataTypes.STRING },
            { name: 'offerIndex', type: ABIDataTypes.UINT64 },
        ],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_acceptOffer',
        inputs: [
            { name: 'domainName', type: ABIDataTypes.STRING },
            { name: 'offerIndex', type: ABIDataTypes.UINT64 },
        ],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_getOffer',
        inputs: [
            { name: 'domainName', type: ABIDataTypes.STRING },
            { name: 'offerIndex', type: ABIDataTypes.UINT64 },
        ],
        outputs: [
            { name: 'buyer', type: ABIDataTypes.ADDRESS },
            { name: 'btcAmount', type: ABIDataTypes.UINT64 },
            { name: 'motoAmount', type: ABIDataTypes.UINT256 },
            { name: 'expiryBlock', type: ABIDataTypes.UINT64 },
            { name: 'isActive', type: ABIDataTypes.BOOL },
            { name: 'isMotoLocked', type: ABIDataTypes.BOOL },
        ],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_getOfferCount',
        inputs: [{ name: 'domainName', type: ABIDataTypes.STRING }],
        outputs: [{ name: 'count', type: ABIDataTypes.UINT64 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_registerDomainBtcReserve',
        inputs: [
            { name: 'domainName', type: ABIDataTypes.STRING },
            { name: 'years', type: ABIDataTypes.UINT64 },
        ],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_registerDomainBtcComplete',
        inputs: [{ name: 'domainName', type: ABIDataTypes.STRING }],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_registerDomainMoto',
        inputs: [
            { name: 'domainName', type: ABIDataTypes.STRING },
            { name: 'years', type: ABIDataTypes.UINT64 },
            { name: 'motoResolverPrice', type: ABIDataTypes.UINT256 },
        ],
        outputs: [],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: '_getPendingRegistration',
        inputs: [{ name: 'domainName', type: ABIDataTypes.STRING }],
        outputs: [
            { name: 'buyer', type: ABIDataTypes.ADDRESS },
            { name: 'years', type: ABIDataTypes.UINT64 },
            { name: 'isActive', type: ABIDataTypes.BOOL },
        ],
        type: BitcoinAbiTypes.Function,
    },
    ...BtcDomainMarketplaceEvents,
    ...OP_NET_ABI,
];

export default BtcDomainMarketplaceAbi;

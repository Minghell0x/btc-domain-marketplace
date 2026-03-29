import { networks } from '@btc-vision/bitcoin';

export const RPC_URL = 'https://testnet.opnet.org';
export const NETWORK = networks.opnetTestnet;

// BtcDomainMarketplace contract
// TODO: Replace with actual deployed address from Anakun
export const MARKETPLACE_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000';

// BtcNameResolver contract
export const RESOLVER_CONTRACT_ADDRESS = '0xc9049fb7a443ca24f371f94c6b0d5fbe3b12d5dd46e252c1eb3e2a935d4e0294';
export const RESOLVER_P2OP = 'opt1sqzm3tztdrvh08q39tv6l9ee0hzcvm9r7xgmf8nsd';

// Marketplace fee constants
export const FEE_RATE_BPS = 500n; // 5%
export const BPS_DENOMINATOR = 10000n;
export const RESERVATION_FEE_SATS = 2000n;
export const RESERVATION_TIMEOUT_BLOCKS = 6n;
export const DEFAULT_OFFER_EXPIRY_BLOCKS = 1008n; // ~1 week
export const MIN_OFFER_EXPIRY_BLOCKS = 6n;
export const MAX_OFFER_EXPIRY_BLOCKS = 52560n; // ~1 year

// Payment types
export const PAYMENT_TYPE_BTC = 0;
export const PAYMENT_TYPE_MOTO = 1;

// Explorer
export const EXPLORER_TX_URL = 'https://testnet.opnet.org/tx/';

// Block time estimation (Signet ~10 min per block)
export const BLOCKS_PER_DAY = 144;
export const BLOCKS_PER_HOUR = 6;

// Polling intervals (ms)
export const BLOCK_POLL_INTERVAL = 15_000;
export const TX_POLL_INTERVAL = 15_000;

// Cache TTL
export const LISTING_CACHE_TTL = 60_000; // 60s
export const TOKEN_METADATA_CACHE_TTL = Infinity; // immutable

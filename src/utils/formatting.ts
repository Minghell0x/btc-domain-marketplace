import { BLOCKS_PER_DAY, BLOCKS_PER_HOUR } from '../config/constants';

let cachedBlockHeight = 0;
let cachedBlockTime = 0;

export function setCurrentBlockHeight(height: number): void {
    cachedBlockHeight = height;
    cachedBlockTime = Date.now();
}

export function estimateCurrentBlock(): number {
    if (!cachedBlockHeight) return 0;
    const elapsed = (Date.now() - cachedBlockTime) / 1000;
    const blocksSince = Math.floor(elapsed / 600); // ~10 min per block
    return cachedBlockHeight + blocksSince;
}

export function formatAddress(addr: string, chars: number = 6): string {
    if (!addr) return '';
    if (addr.length <= chars * 2 + 3) return addr;
    return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatSats(sats: bigint): string {
    const btc = Number(sats) / 1e8;
    if (btc >= 1) return `${btc.toFixed(4)} BTC`;
    if (btc >= 0.001) return `${btc.toFixed(6)} BTC`;
    return `${Number(sats).toLocaleString()} sats`;
}

export function formatSatsAsBtc(sats: bigint): string {
    return (Number(sats) / 1e8).toFixed(8);
}

export function formatBtcPrice(sats: bigint): string {
    const btc = Number(sats) / 1e8;
    if (btc >= 1) return `${btc.toFixed(2)} BTC`;
    return `${btc.toFixed(4)} BTC`;
}

export function blocksToTime(blocks: bigint | number): string {
    const n = Number(blocks);
    if (n < BLOCKS_PER_HOUR) return `${n * 10} min`;
    if (n < BLOCKS_PER_DAY) return `${Math.floor(n / BLOCKS_PER_HOUR)}h`;
    return `${Math.floor(n / BLOCKS_PER_DAY)}d`;
}

export function daysUntilBlock(targetBlock: bigint): number {
    const current = estimateCurrentBlock();
    if (!current) return 0;
    const remaining = Number(targetBlock) - current;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / BLOCKS_PER_DAY);
}

export function formatDate(blockHeight: bigint): string {
    const current = estimateCurrentBlock();
    if (!current) return 'Unknown';
    const blocksDiff = Number(blockHeight) - current;
    const date = new Date(Date.now() + blocksDiff * 10 * 60 * 1000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

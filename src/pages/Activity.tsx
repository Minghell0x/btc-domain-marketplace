import type { ReactElement } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import type { MarketplaceActivity } from '../types';

// Demo activity data — in production these would come from an indexer or event scanner
const DEMO_ACTIVITIES: MarketplaceActivity[] = [
    {
        type: 'listed',
        label: 'Domain Listed',
        domainName: 'genesis',
        txHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        blockHeight: 142500,
        timestamp: Date.now() - 1000 * 60 * 30,
    },
    {
        type: 'offer-made',
        label: 'Offer Made',
        domainName: 'satoshi',
        txHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
        blockHeight: 142498,
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
    },
    {
        type: 'sold',
        label: 'Domain Sold',
        domainName: 'hal',
        txHash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        blockHeight: 142495,
        timestamp: Date.now() - 1000 * 60 * 60 * 5,
    },
    {
        type: 'registered',
        label: 'Domain Registered',
        domainName: 'vault',
        txHash: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
        blockHeight: 142490,
        timestamp: Date.now() - 1000 * 60 * 60 * 8,
    },
    {
        type: 'offer-accepted',
        label: 'Offer Accepted',
        domainName: 'curator',
        txHash: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
        blockHeight: 142485,
        timestamp: Date.now() - 1000 * 60 * 60 * 12,
    },
    {
        type: 'reserved',
        label: 'Purchase Reserved',
        domainName: 'nakamoto',
        txHash: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
        blockHeight: 142480,
        timestamp: Date.now() - 1000 * 60 * 60 * 18,
    },
    {
        type: 'delisted',
        label: 'Domain Delisted',
        domainName: 'alpha',
        txHash: 'a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8',
        blockHeight: 142472,
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
    },
    {
        type: 'listed',
        label: 'Domain Listed',
        domainName: 'bitcoin',
        txHash: 'b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9',
        blockHeight: 142465,
        timestamp: Date.now() - 1000 * 60 * 60 * 30,
    },
];

const EVENT_STYLES: Record<MarketplaceActivity['type'], { bg: string; text: string }> = {
    listed: { bg: 'bg-primary/10', text: 'text-primary' },
    sold: { bg: 'bg-success/10', text: 'text-success' },
    'offer-made': { bg: 'bg-accent/10', text: 'text-accent' },
    'offer-accepted': { bg: 'bg-success/10', text: 'text-success' },
    reserved: { bg: 'bg-warning/10', text: 'text-warning' },
    delisted: { bg: 'bg-error/10', text: 'text-error' },
    registered: { bg: 'bg-primary/10', text: 'text-primary' },
};

function formatRelativeTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function formatTxShort(hash: string): string {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function Activity(): ReactElement {
    return (
        <PageContainer>
            <div className="animate-fade-in">
                {/* Header */}
                <div className="mb-8">
                    <p className="label text-xs mb-3 tracking-[0.25em]">EVENT FEED</p>
                    <h1 className="font-display text-4xl font-bold tracking-tight">
                        Marketplace Activity
                    </h1>
                </div>

                {/* Info banner */}
                <div className="mb-8 px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant">
                    <div className="flex items-start gap-3">
                        <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <div>
                            <p className="text-on-surface text-sm font-semibold mb-1">Activity Indexer Coming Soon</p>
                            <p className="text-on-surface-muted text-xs">
                                Real-time event scanning from on-chain data is being developed. Below are sample activities to demonstrate the interface.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="flex flex-col gap-3">
                    {DEMO_ACTIVITIES.map((activity, i) => {
                        const style = EVENT_STYLES[activity.type];

                        return (
                            <div
                                key={`${activity.txHash}-${i}`}
                                className="card px-5 py-4 flex items-center gap-4 hover:bg-surface-container/60 transition-colors group"
                            >
                                {/* Event badge */}
                                <div className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest ${style.bg} ${style.text}`}>
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 align-middle" />
                                    {activity.type.replace('-', ' ')}
                                </div>

                                {/* Domain name */}
                                <div className="flex items-baseline gap-0.5 min-w-[120px]">
                                    <span className="domain-name text-sm">{activity.domainName}</span>
                                    <span className="domain-suffix text-sm">.btc</span>
                                </div>

                                {/* Label */}
                                <span className="text-on-surface-muted text-xs hidden sm:inline">
                                    {activity.label}
                                </span>

                                {/* Spacer */}
                                <div className="flex-1" />

                                {/* Block height */}
                                <span className="text-on-surface-muted text-xs font-mono hidden md:inline">
                                    Block {activity.blockHeight.toLocaleString()}
                                </span>

                                {/* Tx hash */}
                                <span className="font-mono text-xs text-primary/70 group-hover:text-primary transition-colors hidden lg:inline">
                                    tx: {formatTxShort(activity.txHash)}
                                </span>

                                {/* Relative time */}
                                <span className="text-on-surface-muted text-xs font-mono min-w-[60px] text-right">
                                    {formatRelativeTime(activity.timestamp)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Terminal footer */}
                <div className="text-center py-12">
                    <p className="label tracking-[0.3em] text-on-surface-muted">// END OF ACTIVITY LOG //</p>
                </div>
            </div>
        </PageContainer>
    );
}

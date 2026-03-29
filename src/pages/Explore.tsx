import { useState, type ReactElement } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { SearchInput } from '../components/ui/SearchInput';
import { ListingCard } from '../components/domain/ListingCard';

// Featured domains for demo (in production, discovered from chain events)
const FEATURED_DOMAINS = [
    { name: 'genesis', btcPrice: 125000000n, motoPrice: 42000n, offerCount: 8, featured: true },
    { name: 'satoshi', btcPrice: 840000000n, motoPrice: 0n, offerCount: 14, featured: true },
    { name: 'hal', btcPrice: 5000000n, motoPrice: 385000n, offerCount: 3, featured: false },
    { name: 'nakamoto', btcPrice: 210000000n, motoPrice: 71000n, offerCount: 6, featured: false },
    { name: 'curator', btcPrice: 18000000n, motoPrice: 6300n, offerCount: 2, featured: false },
    { name: 'vault', btcPrice: 45000000n, motoPrice: 15000n, offerCount: 5, featured: false },
] as const;

type FilterTab = 'all' | '3-letter' | 'numeric' | 'og';

export function Explore(): ReactElement {
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

    const filters: { label: string; value: FilterTab }[] = [
        { label: 'ALL', value: 'all' },
        { label: '3-LETTER', value: '3-letter' },
        { label: 'NUMERIC', value: 'numeric' },
        { label: 'OG NAMES', value: 'og' },
    ];

    return (
        <PageContainer>
            {/* Hero Section */}
            <section className="text-center mb-16 pt-8">
                <p className="label text-xs mb-4 tracking-[0.25em]">
                    DECENTRALIZED IDENTITY ENGINE
                </p>
                <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                    BTC DOMAIN{' '}
                    <span className="text-gradient-primary">MARKETPLACE</span>
                </h1>
                <div className="max-w-2xl mx-auto">
                    <SearchInput size="hero" />
                </div>
            </section>

            {/* Stats Bar */}
            <section className="grid grid-cols-3 gap-4 mb-12 p-6 rounded-xl bg-surface-container-low border border-outline-variant">
                <div>
                    <p className="stat-value">1,420</p>
                    <p className="label mt-1">TOTAL LISTED</p>
                    <p className="text-xs text-neon-green font-mono mt-0.5">+12.4% FROM LAST WEEK</p>
                </div>
                <div>
                    <p className="stat-value">45.2 <span className="text-lg text-on-surface-variant">BTC</span></p>
                    <p className="label mt-1">VOLUME (24H)</p>
                    <p className="text-xs text-on-surface-muted font-mono mt-0.5">// REAL ACTIVITY REFLECTED</p>
                </div>
                <div>
                    <p className="stat-value">0.002 <span className="text-lg text-on-surface-variant">BTC</span></p>
                    <p className="label mt-1">FLOOR PRICE</p>
                    <p className="text-xs text-on-surface-muted font-mono mt-0.5">// STABLE TRENDING</p>
                </div>
            </section>

            {/* Filters */}
            <section className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <span className="label mr-2">FILTERS</span>
                    {filters.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setActiveFilter(value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-colors ${
                                activeFilter === value
                                    ? 'bg-surface-container-highest text-on-surface'
                                    : 'text-on-surface-muted hover:text-on-surface hover:bg-surface-container/50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <button
                    className="label hover:text-on-surface transition-colors cursor-pointer"
                >
                    Recently Listed ↓
                </button>
            </section>

            {/* Listing Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                {FEATURED_DOMAINS.map((domain) => (
                    <ListingCard
                        key={domain.name}
                        name={domain.name}
                        btcPrice={domain.btcPrice}
                        motoPrice={domain.motoPrice}
                        offerCount={domain.offerCount}
                        isReserved={false}
                        featured={domain.featured}
                    />
                ))}
            </section>

            {/* Kinetic Terminal Separator */}
            <div className="text-center py-8">
                <p className="label tracking-[0.3em]">// KINETIC TERMINAL //</p>
            </div>
        </PageContainer>
    );
}

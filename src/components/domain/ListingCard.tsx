import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { formatBtcPrice } from '../../utils/formatting';

interface ListingCardProps {
    name: string;
    btcPrice: bigint;
    motoPrice: bigint;
    offerCount: number;
    isReserved: boolean;
    featured?: boolean;
}

export function ListingCard({ name, btcPrice, motoPrice, offerCount, isReserved, featured }: ListingCardProps): ReactElement {
    return (
        <Link to={`/domain/${name}`} className="block group">
            <div className={`card p-5 h-full flex flex-col gap-4 ${featured ? 'glow-border' : ''}`}>
                {/* Domain Name */}
                <div className="flex items-baseline gap-0.5">
                    <span className="domain-name text-xl group-hover:text-primary transition-colors">
                        {name}
                    </span>
                    <span className="domain-suffix text-xl">.btc</span>
                </div>

                {/* Prices */}
                <div className="flex flex-col gap-2 mt-auto">
                    {btcPrice > 0n && (
                        <div className="flex items-center justify-between">
                            <span className="label">CURRENT PRICE</span>
                            <span className="price-btc text-sm">
                                {formatBtcPrice(btcPrice)}
                            </span>
                        </div>
                    )}
                    {motoPrice > 0n && (
                        <div className="flex items-center justify-between">
                            <span className="label">MOTO PRICE</span>
                            <span className="price-moto text-sm">
                                {Number(motoPrice).toLocaleString()} MOTO
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
                    <span className="text-xs text-on-surface-muted">
                        {offerCount > 0 ? `${offerCount} offer${offerCount > 1 ? 's' : ''}` : 'No offers'}
                    </span>
                    {isReserved ? (
                        <span className="text-xs font-mono text-warning">RESERVED</span>
                    ) : (
                        <span className="text-xs font-semibold text-primary group-hover:underline">
                            BUY NOW
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

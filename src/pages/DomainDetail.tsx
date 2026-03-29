import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { DomainName } from '../components/domain/DomainName';
import { DomainBadge } from '../components/domain/DomainBadge';
import { PriceDisplay } from '../components/domain/PriceDisplay';
import { OfferRow } from '../components/domain/OfferRow';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../contexts/ContractContext';
import { fetchListing, fetchOffers, fetchReservation } from '../services/MarketplaceService';
import { lookupDomain } from '../services/ResolverService';
import { formatAddress, formatDate, daysUntilBlock, formatBtcPrice } from '../utils/formatting';
import { DEFAULT_OFFER_EXPIRY_BLOCKS } from '../config/constants';
import type { Listing, DomainInfo, Offer, Reservation } from '../types';

type PageStatus = 'loading' | 'ready' | 'error' | 'not-found';

export function DomainDetail(): ReactElement {
    const { name } = useParams<{ name: string }>();
    const { addressHex, isConnected, connect } = useWallet();
    const { isReady } = useContracts();

    const [status, setStatus] = useState<PageStatus>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    const [listing, setListing] = useState<Listing | null>(null);
    const [domain, setDomain] = useState<DomainInfo | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [reservation, setReservation] = useState<Reservation | null>(null);

    // Offer form state
    const [offerBtcAmount, setOfferBtcAmount] = useState('');
    const [offerMotoAmount, setOfferMotoAmount] = useState('');
    const [offerExpiryBlocks, setOfferExpiryBlocks] = useState(String(DEFAULT_OFFER_EXPIRY_BLOCKS));
    const [offerType, setOfferType] = useState<'btc' | 'moto'>('btc');

    const domainName = name ?? '';

    const isOwner = !!(addressHex && domain?.ownerHex && addressHex.toLowerCase() === domain.ownerHex.toLowerCase());
    const isSeller = !!(addressHex && listing?.sellerHex && addressHex.toLowerCase() === listing.sellerHex.toLowerCase());
    const isListed = !!(listing?.exists && listing.btcPrice > 0n);

    const loadData = useCallback(async () => {
        if (!domainName || !isReady) return;
        setStatus('loading');

        try {
            const [listingResult, domainResult, offersResult, reservationResult] = await Promise.allSettled([
                fetchListing(domainName),
                lookupDomain(domainName),
                fetchOffers(domainName),
                fetchReservation(domainName),
            ]);

            if (listingResult.status === 'fulfilled') {
                setListing(listingResult.value);
            }
            if (domainResult.status === 'fulfilled') {
                if (!domainResult.value.exists) {
                    setStatus('not-found');
                    return;
                }
                setDomain(domainResult.value);
            } else {
                setStatus('not-found');
                return;
            }
            if (offersResult.status === 'fulfilled') {
                setOffers(offersResult.value);
            }
            if (reservationResult.status === 'fulfilled') {
                setReservation(reservationResult.value);
            }

            setStatus('ready');
        } catch (err) {
            console.error('[DomainDetail] Failed to load data:', err);
            setErrorMsg(err instanceof Error ? err.message : 'Failed to load domain data');
            setStatus('error');
        }
    }, [domainName, isReady]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // Derive the domain badge status
    function getDomainBadgeStatus(): 'listed' | 'reserved' | 'active' | 'expiring' | 'available' {
        if (listing?.isReserved && reservation?.isActive) return 'reserved';
        if (isListed) return 'listed';
        if (domain?.inGracePeriod) return 'expiring';
        if (domain?.isActive) return 'active';
        return 'available';
    }

    // Action handlers (placeholder - will be wired to write services)
    function handleBuyBtc(): void {
        if (!isConnected) { connect(); return; }
        alert(`Buy "${domainName}.btc" with BTC for ${listing ? formatBtcPrice(listing.btcPrice) : '?'}`);
    }

    function handleBuyMoto(): void {
        if (!isConnected) { connect(); return; }
        alert(`Buy "${domainName}.btc" with MOTO for ${listing ? Number(listing.motoPrice).toLocaleString() : '?'} MOTO`);
    }

    function handleMakeOffer(): void {
        if (!isConnected) { connect(); return; }
        const amount = offerType === 'btc' ? offerBtcAmount : offerMotoAmount;
        alert(`Make ${offerType.toUpperCase()} offer of ${amount} on "${domainName}.btc" (expires in ${offerExpiryBlocks} blocks)`);
    }

    function handleCancelListing(): void {
        alert(`Cancel listing for "${domainName}.btc"`);
    }

    function handleAcceptOffer(offerIndex: number): void {
        alert(`Accept offer #${offerIndex} on "${domainName}.btc"`);
    }

    function handleCancelOffer(offerIndex: number): void {
        alert(`Cancel offer #${offerIndex} on "${domainName}.btc"`);
    }

    // --- Loading ---
    if (status === 'loading') {
        return (
            <PageContainer>
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-on-surface-muted font-mono text-sm">Loading domain data...</p>
                </div>
            </PageContainer>
        );
    }

    // --- Not Found ---
    if (status === 'not-found') {
        return (
            <PageContainer>
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <DomainName name={domainName} size="lg" />
                    <p className="text-on-surface-muted text-lg">This domain does not exist or has not been registered.</p>
                    <Link to="/register" className="btn-primary">Register this domain</Link>
                </div>
            </PageContainer>
        );
    }

    // --- Error ---
    if (status === 'error') {
        return (
            <PageContainer>
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <p className="text-error text-lg font-semibold">Failed to load domain</p>
                    <p className="text-on-surface-muted text-sm">{errorMsg}</p>
                    <button onClick={() => void loadData()} className="btn-secondary">Retry</button>
                </div>
            </PageContainer>
        );
    }

    // --- Ready ---
    return (
        <PageContainer>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* LEFT COLUMN - Domain Info (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4 flex-wrap">
                            <DomainName name={domainName} size="xl" />
                            <DomainBadge status={getDomainBadgeStatus()} />
                        </div>
                    </div>

                    {/* Domain Metadata Card */}
                    {domain && (
                        <div className="card p-6">
                            <h3 className="label mb-4">Domain Info</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <p className="label mb-1">Owner</p>
                                    <p className="font-mono text-sm text-on-surface">{formatAddress(domain.ownerHex)}</p>
                                </div>
                                <div>
                                    <p className="label mb-1">Created</p>
                                    <p className="font-mono text-sm text-on-surface">{formatDate(domain.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="label mb-1">Expires</p>
                                    <p className="font-mono text-sm text-on-surface">
                                        {formatDate(domain.expiresAt)}
                                        <span className="text-on-surface-muted text-xs ml-1">
                                            ({daysUntilBlock(domain.expiresAt)}d)
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="label mb-1">Status</p>
                                    <p className={`font-mono text-sm ${domain.isActive ? 'text-success' : 'text-error'}`}>
                                        {domain.isActive ? 'Active' : domain.inGracePeriod ? 'Grace Period' : 'Expired'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Listing Info Card */}
                    {isListed && listing && (
                        <div className="card p-6">
                            <h3 className="label mb-4">Listing Details</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div>
                                    <p className="label mb-1">Seller</p>
                                    <p className="font-mono text-sm text-on-surface">{formatAddress(listing.sellerHex)}</p>
                                </div>
                                <div>
                                    <p className="label mb-1">BTC Price</p>
                                    <PriceDisplay btcPrice={listing.btcPrice} size="sm" />
                                </div>
                                {listing.motoPrice > 0n && (
                                    <div>
                                        <p className="label mb-1">MOTO Price</p>
                                        <PriceDisplay motoPrice={listing.motoPrice} size="sm" />
                                    </div>
                                )}
                            </div>
                            {listing.isReserved && reservation?.isActive && (
                                <div className="mt-4 px-4 py-3 rounded-lg bg-warning/5 border border-warning/10">
                                    <p className="text-warning text-xs font-mono">
                                        Reserved by {formatAddress(reservation.buyerHex)} -- awaiting payment confirmation
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Offers Table */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="label">Offers ({offers.length})</h3>
                        </div>
                        {offers.length === 0 ? (
                            <p className="text-on-surface-muted text-sm py-4 text-center">No offers yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-outline">
                                            <th className="label py-2 px-3">#</th>
                                            <th className="label py-2 px-3">Buyer</th>
                                            <th className="label py-2 px-3">Amount</th>
                                            <th className="label py-2 px-3">Expiry</th>
                                            <th className="label py-2 px-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {offers.map((offer) => (
                                            <OfferRow
                                                key={offer.index}
                                                offer={offer}
                                                isOwner={isOwner || isSeller}
                                                isBuyer={!!(addressHex && addressHex.toLowerCase() === offer.buyerHex.toLowerCase())}
                                                onAccept={() => handleAcceptOffer(offer.index)}
                                                onCancel={() => handleCancelOffer(offer.index)}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN - Action Panel (1/3 width) */}
                <div className="flex flex-col gap-6">
                    {/* Buy Actions */}
                    {isListed && !isSeller && listing && (
                        <div className="card p-6 glow-border">
                            <h3 className="label mb-4">Buy This Domain</h3>
                            <PriceDisplay btcPrice={listing.btcPrice} motoPrice={listing.motoPrice} size="lg" />
                            <div className="flex flex-col gap-3 mt-6">
                                <button onClick={handleBuyBtc} className="btn-primary w-full text-center">
                                    Buy with BTC
                                </button>
                                {listing.motoPrice > 0n && (
                                    <button onClick={handleBuyMoto} className="btn-accent w-full text-center">
                                        Buy with MOTO
                                    </button>
                                )}
                            </div>

                            {/* Make Offer Section */}
                            <div className="mt-8 pt-6 border-t border-outline-variant">
                                <h3 className="label mb-4">Make an Offer</h3>
                                <div className="flex flex-col gap-3">
                                    {/* Offer type toggle */}
                                    <div className="flex rounded-full border border-outline overflow-hidden">
                                        <button
                                            onClick={() => setOfferType('btc')}
                                            className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${offerType === 'btc' ? 'bg-primary/10 text-primary' : 'text-on-surface-muted hover:text-on-surface'}`}
                                        >
                                            BTC
                                        </button>
                                        <button
                                            onClick={() => setOfferType('moto')}
                                            className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${offerType === 'moto' ? 'bg-accent/10 text-accent' : 'text-on-surface-muted hover:text-on-surface'}`}
                                        >
                                            MOTO
                                        </button>
                                    </div>

                                    {offerType === 'btc' ? (
                                        <input
                                            type="text"
                                            placeholder="BTC amount (e.g. 0.005)"
                                            value={offerBtcAmount}
                                            onChange={(e) => setOfferBtcAmount(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline text-on-surface font-mono text-sm placeholder:text-on-surface-muted focus:outline-none focus:border-primary/30"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="MOTO amount"
                                            value={offerMotoAmount}
                                            onChange={(e) => setOfferMotoAmount(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline text-on-surface font-mono text-sm placeholder:text-on-surface-muted focus:outline-none focus:border-accent/30"
                                        />
                                    )}

                                    <input
                                        type="text"
                                        placeholder="Expiry (blocks)"
                                        value={offerExpiryBlocks}
                                        onChange={(e) => setOfferExpiryBlocks(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline text-on-surface font-mono text-sm placeholder:text-on-surface-muted focus:outline-none focus:border-outline"
                                    />

                                    <button
                                        onClick={handleMakeOffer}
                                        className="btn-secondary w-full text-center"
                                    >
                                        Submit Offer
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Owner / Seller Actions */}
                    {isListed && isSeller && (
                        <div className="card p-6 glow-border">
                            <h3 className="label mb-4">Your Listing</h3>
                            {listing && (
                                <PriceDisplay btcPrice={listing.btcPrice} motoPrice={listing.motoPrice} size="lg" />
                            )}
                            <div className="flex flex-col gap-3 mt-6">
                                <button onClick={handleCancelListing} className="w-full px-5 py-2.5 rounded-full border border-error/20 text-error text-sm font-semibold hover:bg-error/5 transition-colors text-center">
                                    Cancel Listing
                                </button>
                            </div>

                            {/* Incoming Offers */}
                            {offers.filter((o) => o.isActive).length > 0 && (
                                <div className="mt-8 pt-6 border-t border-outline-variant">
                                    <h3 className="label mb-4">Incoming Offers</h3>
                                    <div className="flex flex-col gap-2">
                                        {offers.filter((o) => o.isActive).map((offer) => (
                                            <div key={offer.index} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-mono text-xs text-on-surface">{formatAddress(offer.buyerHex)}</span>
                                                    {offer.btcAmount > 0n ? (
                                                        <span className="price-btc text-xs">{formatBtcPrice(offer.btcAmount)}</span>
                                                    ) : (
                                                        <span className="price-moto text-xs">{Number(offer.motoAmount).toLocaleString()} MOTO</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleAcceptOffer(offer.index)}
                                                    className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors"
                                                >
                                                    Accept
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Not Listed */}
                    {!isListed && (
                        <div className="card p-6">
                            <h3 className="label mb-4">Marketplace</h3>
                            <p className="text-on-surface-muted text-sm mb-4">This domain is not currently listed for sale.</p>
                            {isOwner && (
                                <Link to="/list" className="btn-primary w-full text-center block">
                                    List for Sale
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Domain Quick Info */}
                    {domain && (
                        <div className="card p-6">
                            <h3 className="label mb-4">Quick Info</h3>
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-muted text-xs">TTL</span>
                                    <span className="font-mono text-xs text-on-surface">{Number(domain.ttl)} blocks</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-muted text-xs">Grace Period</span>
                                    <span className={`font-mono text-xs ${domain.inGracePeriod ? 'text-warning' : 'text-on-surface-muted'}`}>
                                        {domain.inGracePeriod ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-muted text-xs">Offers</span>
                                    <span className="font-mono text-xs text-on-surface">{offers.length}</span>
                                </div>
                                {isListed && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-on-surface-muted text-xs">Reserved</span>
                                        <span className={`font-mono text-xs ${listing?.isReserved ? 'text-warning' : 'text-on-surface-muted'}`}>
                                            {listing?.isReserved ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}

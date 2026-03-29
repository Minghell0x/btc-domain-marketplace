import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { WalletGuard } from '../components/wallet/WalletGuard';
import { DomainName } from '../components/domain/DomainName';
import { DomainBadge } from '../components/domain/DomainBadge';
import { PriceDisplay } from '../components/domain/PriceDisplay';
import { OfferRow } from '../components/domain/OfferRow';
import { TxLink } from '../components/transaction/TxLink';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../contexts/ContractContext';
import { useTransactions } from '../contexts/TransactionContext';
import { fetchDomainsByOwner } from '../services/ResolverService';
import { fetchListing, fetchOffers, cancelListingTx, acceptOfferTx, cancelOfferTx } from '../services/MarketplaceService';
import type { Listing, Offer } from '../types';

interface MyListingItem {
    name: string;
    listing: Listing;
    offers: Offer[];
    offersLoaded: boolean;
}

type PageStatus = 'loading' | 'ready' | 'error' | 'empty';

export function MyListings(): ReactElement {
    return (
        <PageContainer>
            <WalletGuard message="Connect your wallet to view your listed domains.">
                <MyListingsContent />
            </WalletGuard>
        </PageContainer>
    );
}

function MyListingsContent(): ReactElement {
    const { address, addressHex, walletAddress, provider } = useWallet();
    const { isReady } = useContracts();
    const { addTransaction, updateTransaction } = useTransactions();

    const [status, setStatus] = useState<PageStatus>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [listings, setListings] = useState<MyListingItem[]>([]);
    const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

    // Action state
    const [cancellingName, setCancellingName] = useState<string | null>(null);
    const [confirmCancelName, setConfirmCancelName] = useState<string | null>(null);
    const [actionTxHash, setActionTxHash] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const loadListings = useCallback(async () => {
        if (!address || !isReady) return;
        setStatus('loading');
        setErrorMsg('');

        try {
            // Fetch domains owned by the marketplace (escrowed by this user)
            // and domains still owned by the user that may be listed
            const ownedNames = await fetchDomainsByOwner(address);

            // For each domain, check if it has a listing
            const listingChecks = await Promise.allSettled(
                ownedNames.map(async (name) => {
                    const listing = await fetchListing(name);
                    return { name, listing };
                }),
            );

            const listedItems: MyListingItem[] = [];

            for (const result of listingChecks) {
                if (result.status !== 'fulfilled') continue;
                const { name, listing } = result.value;

                // Check if the listing exists and this user is the seller
                if (
                    listing.exists &&
                    addressHex &&
                    listing.sellerHex.toLowerCase() === addressHex.toLowerCase()
                ) {
                    listedItems.push({
                        name,
                        listing,
                        offers: [],
                        offersLoaded: false,
                    });
                }
            }

            setListings(listedItems);
            setStatus(listedItems.length === 0 ? 'empty' : 'ready');
        } catch (err) {
            console.error('[MyListings] Failed to load:', err);
            setErrorMsg(err instanceof Error ? err.message : 'Failed to load listings.');
            setStatus('error');
        }
    }, [address, addressHex, isReady]);

    useEffect(() => {
        void loadListings();
    }, [loadListings]);

    // Load offers for a specific listing when expanded
    const loadOffers = useCallback(async (name: string) => {
        try {
            const offers = await fetchOffers(name);
            setListings((prev) =>
                prev.map((item) =>
                    item.name === name ? { ...item, offers, offersLoaded: true } : item,
                ),
            );
        } catch (err) {
            console.error(`[MyListings] Failed to load offers for ${name}:`, err);
        }
    }, []);

    const toggleExpand = useCallback((name: string) => {
        setExpandedDomain((prev) => {
            const next = prev === name ? null : name;
            if (next) {
                const item = listings.find((l) => l.name === name);
                if (item && !item.offersLoaded) {
                    void loadOffers(name);
                }
            }
            return next;
        });
    }, [listings, loadOffers]);

    // Cancel listing
    const handleCancelListing = useCallback(async (name: string) => {
        if (!provider || !address || !walletAddress) return;
        setCancellingName(name);
        setActionError(null);
        setActionTxHash(null);

        const txId = addTransaction({
            type: 'cancel-listing',
            domainName: name,
            status: 'pending',
        });

        try {
            const result = await cancelListingTx(name, walletAddress, provider, address);
            setActionTxHash(result.txHash);
            updateTransaction(txId, { status: 'confirmed', txHash: result.txHash });
            // Remove from local state
            setListings((prev) => prev.filter((item) => item.name !== name));
            setConfirmCancelName(null);
            if (listings.length <= 1) {
                setStatus('empty');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Cancel failed.';
            setActionError(msg);
            updateTransaction(txId, { status: 'failed', error: msg });
        } finally {
            setCancellingName(null);
        }
    }, [provider, address, walletAddress, addTransaction, updateTransaction, listings.length]);

    // Accept offer
    const handleAcceptOffer = useCallback(async (name: string, offerIndex: number) => {
        if (!provider || !address || !walletAddress) return;
        setActionError(null);
        setActionTxHash(null);

        const txId = addTransaction({
            type: 'accept-offer',
            domainName: name,
            status: 'pending',
        });

        try {
            const result = await acceptOfferTx(name, offerIndex, walletAddress, provider, address);
            setActionTxHash(result.txHash);
            updateTransaction(txId, { status: 'confirmed', txHash: result.txHash });
            // Reload this listing's offers
            void loadOffers(name);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Accept offer failed.';
            setActionError(msg);
            updateTransaction(txId, { status: 'failed', error: msg });
        }
    }, [provider, address, walletAddress, addTransaction, updateTransaction, loadOffers]);

    // Cancel offer (as seller -- not typical, but keeping for buyer's own offers visible here)
    const handleCancelOffer = useCallback(async (name: string, offerIndex: number) => {
        if (!provider || !address || !walletAddress) return;
        setActionError(null);
        setActionTxHash(null);

        const txId = addTransaction({
            type: 'cancel-offer',
            domainName: name,
            status: 'pending',
        });

        try {
            const result = await cancelOfferTx(name, offerIndex, walletAddress, provider, address);
            setActionTxHash(result.txHash);
            updateTransaction(txId, { status: 'confirmed', txHash: result.txHash });
            void loadOffers(name);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Cancel offer failed.';
            setActionError(msg);
            updateTransaction(txId, { status: 'failed', error: msg });
        }
    }, [provider, address, walletAddress, addTransaction, updateTransaction, loadOffers]);

    // --- Loading ---
    if (status === 'loading') {
        return (
            <div className="animate-fade-in">
                <div className="mb-8">
                    <p className="label text-xs tracking-[0.25em] mb-2">SELLER DASHBOARD</p>
                    <h1 className="font-display text-3xl font-bold text-on-surface">My Listings</h1>
                </div>
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card p-6 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="h-6 w-32 bg-surface-container-high rounded" />
                                <div className="h-5 w-16 bg-surface-container-high rounded-full" />
                                <div className="ml-auto h-5 w-24 bg-surface-container-high rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- Error ---
    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <p className="text-error text-lg font-semibold">Failed to load listings</p>
                <p className="text-on-surface-muted text-sm">{errorMsg}</p>
                <button onClick={() => void loadListings()} className="btn-secondary">Retry</button>
            </div>
        );
    }

    // --- Empty ---
    if (status === 'empty') {
        return (
            <div className="animate-fade-in">
                <div className="mb-8">
                    <p className="label text-xs tracking-[0.25em] mb-2">SELLER DASHBOARD</p>
                    <h1 className="font-display text-3xl font-bold text-on-surface">My Listings</h1>
                </div>
                <div className="card p-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6">
                        <svg className="w-7 h-7 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                        </svg>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-on-surface mb-2">No Active Listings</h2>
                    <p className="text-on-surface-muted text-sm mb-6 max-w-md mx-auto">
                        You have not listed any domains for sale yet. List a domain to start selling on the marketplace.
                    </p>
                    {actionTxHash && (
                        <div className="mb-6">
                            <span className="label text-xs">Last TX: </span>
                            <TxLink txHash={actionTxHash} />
                        </div>
                    )}
                    <Link to="/list" className="btn-primary">
                        List a Domain
                    </Link>
                </div>
            </div>
        );
    }

    // --- Ready ---
    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="label text-xs tracking-[0.25em] mb-2">SELLER DASHBOARD</p>
                    <h1 className="font-display text-3xl font-bold text-on-surface">My Listings</h1>
                </div>
                <Link to="/list" className="btn-primary">
                    + List Domain
                </Link>
            </div>

            {/* Global action feedback */}
            {actionTxHash && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-success/5 border border-success/10 flex items-center gap-2">
                    <span className="text-success text-xs font-mono">TX confirmed:</span>
                    <TxLink txHash={actionTxHash} />
                    <button onClick={() => setActionTxHash(null)} className="ml-auto text-on-surface-muted hover:text-on-surface text-xs">dismiss</button>
                </div>
            )}
            {actionError && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-error/5 border border-error/10 flex items-center gap-2">
                    <span className="text-error text-xs font-mono">{actionError}</span>
                    <button onClick={() => setActionError(null)} className="ml-auto text-on-surface-muted hover:text-on-surface text-xs">dismiss</button>
                </div>
            )}

            <div className="flex flex-col gap-4">
                {listings.map((item) => {
                    const isExpanded = expandedDomain === item.name;
                    const activeOffers = item.offers.filter((o) => o.isActive);
                    const offerCountLabel = item.offersLoaded
                        ? `${activeOffers.length} active offer${activeOffers.length !== 1 ? 's' : ''}`
                        : 'View offers';

                    return (
                        <div key={item.name} className="card overflow-hidden">
                            {/* Listing Row */}
                            <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Domain Info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <DomainName name={item.name} size="md" />
                                    <DomainBadge status={item.listing.isReserved ? 'reserved' : 'listed'} />
                                </div>

                                {/* Prices */}
                                <div className="flex items-center gap-4 sm:ml-auto">
                                    <PriceDisplay btcPrice={item.listing.btcPrice} motoPrice={item.listing.motoPrice} size="sm" />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                                    <button
                                        onClick={() => toggleExpand(item.name)}
                                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-on-surface-muted hover:text-on-surface hover:bg-surface-container/50 transition-colors"
                                    >
                                        {offerCountLabel}
                                        <span className={`ml-1 inline-block transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                            &#x25BE;
                                        </span>
                                    </button>
                                    <Link
                                        to={`/domain/${item.name}`}
                                        className="px-3 py-1.5 rounded-full border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container/50 transition-colors"
                                    >
                                        Manage
                                    </Link>
                                    {confirmCancelName === item.name ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => void handleCancelListing(item.name)}
                                                disabled={cancellingName === item.name}
                                                className="px-3 py-1.5 rounded-full bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition-colors disabled:opacity-50"
                                            >
                                                {cancellingName === item.name ? 'Cancelling...' : 'Confirm'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmCancelName(null)}
                                                className="px-2 py-1.5 text-xs text-on-surface-muted hover:text-on-surface"
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmCancelName(item.name)}
                                            className="px-3 py-1.5 rounded-full border border-error/20 text-error-muted text-xs font-semibold hover:bg-error/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Offers Section */}
                            {isExpanded && (
                                <div className="border-t border-outline-variant px-5 py-4 bg-surface-container-low/50">
                                    <h4 className="label mb-3">OFFERS</h4>
                                    {!item.offersLoaded ? (
                                        <div className="flex items-center gap-2 py-4 justify-center">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-on-surface-muted text-xs font-mono">Loading offers...</span>
                                        </div>
                                    ) : item.offers.length === 0 ? (
                                        <p className="text-on-surface-muted text-sm py-3 text-center">No offers for this domain.</p>
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
                                                    {item.offers.map((offer) => (
                                                        <OfferRow
                                                            key={offer.index}
                                                            offer={offer}
                                                            isOwner={true}
                                                            isBuyer={!!(addressHex && addressHex.toLowerCase() === offer.buyerHex.toLowerCase())}
                                                            onAccept={() => void handleAcceptOffer(item.name, offer.index)}
                                                            onCancel={() => void handleCancelOffer(item.name, offer.index)}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

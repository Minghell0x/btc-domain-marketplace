import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { WalletGuard } from '../components/wallet/WalletGuard';
import { OfferRow } from '../components/domain/OfferRow';
import { DomainName } from '../components/domain/DomainName';
import { TxLink } from '../components/transaction/TxLink';
import { EmptyState } from '../components/ui/EmptyState';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../contexts/ContractContext';
import { fetchOffers, fetchReservation, cancelOfferTx, completePurchaseTx } from '../services/MarketplaceService';
import { cleanDomainInput, isValidDomainName } from '../utils/validation';
import { blocksToTime } from '../utils/formatting';
import type { Offer, Reservation } from '../types';

type Tab = 'offers' | 'purchases';

interface OfferSearchResult {
    domainName: string;
    offers: Offer[];
}

interface ReservationSearchResult {
    domainName: string;
    reservation: Reservation;
}

export function MyActivity(): ReactElement {
    const { addressHex, address, walletAddress, provider } = useWallet();
    const { isReady, currentBlock } = useContracts();

    const [activeTab, setActiveTab] = useState<Tab>('offers');

    // Offers tab state
    const [offerSearch, setOfferSearch] = useState('');
    const [offerLoading, setOfferLoading] = useState(false);
    const [offerError, setOfferError] = useState('');
    const [offerResults, setOfferResults] = useState<OfferSearchResult[]>([]);

    // Purchases tab state
    const [purchaseSearch, setPurchaseSearch] = useState('');
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [purchaseError, setPurchaseError] = useState('');
    const [purchaseResults, setPurchaseResults] = useState<ReservationSearchResult[]>([]);

    // Tx state
    const [txPending, setTxPending] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [txError, setTxError] = useState('');

    const handleOfferSearch = useCallback(async () => {
        const cleaned = cleanDomainInput(offerSearch);
        if (!isValidDomainName(cleaned)) {
            setOfferError('Enter a valid domain name');
            return;
        }
        if (!addressHex || !isReady) return;

        setOfferLoading(true);
        setOfferError('');

        try {
            const allOffers = await fetchOffers(cleaned);
            const myOffers = allOffers.filter(
                (o) => o.buyerHex.toLowerCase() === addressHex.toLowerCase() && o.isActive,
            );

            if (myOffers.length === 0) {
                setOfferError(`No active offers found for "${cleaned}.btc" from your address.`);
            } else {
                // Add to results, replace if domain already searched
                setOfferResults((prev) => {
                    const filtered = prev.filter((r) => r.domainName !== cleaned);
                    return [{ domainName: cleaned, offers: myOffers }, ...filtered];
                });
            }
        } catch (err) {
            setOfferError(err instanceof Error ? err.message : 'Failed to fetch offers');
        } finally {
            setOfferLoading(false);
        }
    }, [offerSearch, addressHex, isReady]);

    const handlePurchaseSearch = useCallback(async () => {
        const cleaned = cleanDomainInput(purchaseSearch);
        if (!isValidDomainName(cleaned)) {
            setPurchaseError('Enter a valid domain name');
            return;
        }
        if (!addressHex || !isReady) return;

        setPurchaseLoading(true);
        setPurchaseError('');

        try {
            const reservation = await fetchReservation(cleaned);

            if (!reservation.isActive) {
                setPurchaseError(`No active reservation found for "${cleaned}.btc".`);
                return;
            }

            if (reservation.buyerHex.toLowerCase() !== addressHex.toLowerCase()) {
                setPurchaseError(`The reservation for "${cleaned}.btc" belongs to a different address.`);
                return;
            }

            setPurchaseResults((prev) => {
                const filtered = prev.filter((r) => r.domainName !== cleaned);
                return [{ domainName: cleaned, reservation }, ...filtered];
            });
        } catch (err) {
            setPurchaseError(err instanceof Error ? err.message : 'Failed to fetch reservation');
        } finally {
            setPurchaseLoading(false);
        }
    }, [purchaseSearch, addressHex, isReady]);

    const handleCancelOffer = useCallback(async (domainName: string, offerIndex: number) => {
        if (!provider || !address || !walletAddress) return;
        setTxPending(true);
        setTxHash('');
        setTxError('');

        try {
            const result = await cancelOfferTx(domainName, offerIndex, walletAddress, provider, address);
            setTxHash(result.txHash);

            // Remove cancelled offer from results
            setOfferResults((prev) =>
                prev.map((r) =>
                    r.domainName === domainName
                        ? { ...r, offers: r.offers.filter((o) => o.index !== offerIndex) }
                        : r,
                ).filter((r) => r.offers.length > 0),
            );
        } catch (err) {
            setTxError(err instanceof Error ? err.message : 'Transaction failed');
        } finally {
            setTxPending(false);
        }
    }, [provider, address, walletAddress]);

    const handleCompletePurchase = useCallback(async (domainName: string) => {
        if (!provider || !address || !walletAddress) return;
        setTxPending(true);
        setTxHash('');
        setTxError('');

        try {
            const result = await completePurchaseTx(domainName, walletAddress, provider, address);
            setTxHash(result.txHash);

            // Remove completed purchase from results
            setPurchaseResults((prev) => prev.filter((r) => r.domainName !== domainName));
        } catch (err) {
            setTxError(err instanceof Error ? err.message : 'Transaction failed');
        } finally {
            setTxPending(false);
        }
    }, [provider, address, walletAddress]);

    const tabs: { label: string; value: Tab }[] = [
        { label: 'My Offers', value: 'offers' },
        { label: 'Pending Purchases', value: 'purchases' },
    ];

    return (
        <PageContainer>
            <WalletGuard message="Connect your wallet to view your marketplace activity.">
                <div className="animate-fade-in">
                    {/* Header */}
                    <div className="mb-8">
                        <p className="label text-xs mb-3 tracking-[0.25em]">BUYER DASHBOARD</p>
                        <h1 className="font-display text-4xl font-bold tracking-tight">
                            My Activity
                        </h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 mb-8 p-1 rounded-full bg-surface-container-low border border-outline-variant w-fit">
                        {tabs.map(({ label, value }) => (
                            <button
                                key={value}
                                onClick={() => setActiveTab(value)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                                    activeTab === value
                                        ? 'bg-surface-container-highest text-on-surface'
                                        : 'text-on-surface-muted hover:text-on-surface'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Tx feedback */}
                    {(txHash || txError) && (
                        <div className={`mb-6 px-4 py-3 rounded-lg border ${txError ? 'bg-error/5 border-error/10' : 'bg-success/5 border-success/10'}`}>
                            {txHash && (
                                <div className="flex items-center gap-2">
                                    <span className="text-success text-xs font-mono">Transaction sent:</span>
                                    <TxLink txHash={txHash} />
                                </div>
                            )}
                            {txError && (
                                <p className="text-error text-xs font-mono">{txError}</p>
                            )}
                        </div>
                    )}

                    {/* My Offers Tab */}
                    {activeTab === 'offers' && (
                        <div className="flex flex-col gap-6">
                            {/* Search bar */}
                            <div className="card p-6">
                                <h3 className="label mb-3">Check Offers on a Domain</h3>
                                <p className="text-on-surface-muted text-xs mb-4">
                                    Enter a domain name to find your active offers on it.
                                </p>
                                <div className="flex gap-3">
                                    <div className="flex-1 flex items-center rounded-lg bg-surface-container border border-outline overflow-hidden">
                                        <input
                                            type="text"
                                            value={offerSearch}
                                            onChange={(e) => setOfferSearch(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') void handleOfferSearch(); }}
                                            placeholder="e.g. satoshi"
                                            className="flex-1 px-4 py-3 bg-transparent text-on-surface font-mono text-sm placeholder:text-on-surface-muted focus:outline-none"
                                        />
                                        <span className="pr-3 text-on-surface-muted text-sm font-mono">.btc</span>
                                    </div>
                                    <button
                                        onClick={() => void handleOfferSearch()}
                                        disabled={offerLoading || !isReady}
                                        className="btn-primary px-6 disabled:opacity-50"
                                    >
                                        {offerLoading ? (
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            'Search'
                                        )}
                                    </button>
                                </div>
                                {offerError && (
                                    <p className="text-on-surface-muted text-xs mt-3 font-mono">{offerError}</p>
                                )}
                            </div>

                            {/* Offer results */}
                            {offerResults.length === 0 ? (
                                <EmptyState
                                    title="No Offers Found"
                                    description="Search for a domain above to check if you have any active offers on it."
                                />
                            ) : (
                                offerResults.map((result) => (
                                    <div key={result.domainName} className="card p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <DomainName name={result.domainName} size="md" />
                                            <span className="text-on-surface-muted text-xs font-mono">
                                                {result.offers.length} active offer{result.offers.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
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
                                                    {result.offers.map((offer) => (
                                                        <OfferRow
                                                            key={offer.index}
                                                            offer={offer}
                                                            isOwner={false}
                                                            isBuyer={true}
                                                            onCancel={() => void handleCancelOffer(result.domainName, offer.index)}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Pending Purchases Tab */}
                    {activeTab === 'purchases' && (
                        <div className="flex flex-col gap-6">
                            {/* Search bar */}
                            <div className="card p-6">
                                <h3 className="label mb-3">Check Pending Reservation</h3>
                                <p className="text-on-surface-muted text-xs mb-4">
                                    Enter a domain name to check if you have an active reservation to complete.
                                </p>
                                <div className="flex gap-3">
                                    <div className="flex-1 flex items-center rounded-lg bg-surface-container border border-outline overflow-hidden">
                                        <input
                                            type="text"
                                            value={purchaseSearch}
                                            onChange={(e) => setPurchaseSearch(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') void handlePurchaseSearch(); }}
                                            placeholder="e.g. genesis"
                                            className="flex-1 px-4 py-3 bg-transparent text-on-surface font-mono text-sm placeholder:text-on-surface-muted focus:outline-none"
                                        />
                                        <span className="pr-3 text-on-surface-muted text-sm font-mono">.btc</span>
                                    </div>
                                    <button
                                        onClick={() => void handlePurchaseSearch()}
                                        disabled={purchaseLoading || !isReady}
                                        className="btn-primary px-6 disabled:opacity-50"
                                    >
                                        {purchaseLoading ? (
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            'Search'
                                        )}
                                    </button>
                                </div>
                                {purchaseError && (
                                    <p className="text-on-surface-muted text-xs mt-3 font-mono">{purchaseError}</p>
                                )}
                            </div>

                            {/* Reservation results */}
                            {purchaseResults.length === 0 ? (
                                <EmptyState
                                    title="No Pending Purchases"
                                    description="Search for a domain above to check if you have a reservation waiting to be completed."
                                />
                            ) : (
                                purchaseResults.map((result) => {
                                    const blocksRemaining = Number(result.reservation.reservedAtBlock) + 6 - currentBlock;
                                    const isExpired = blocksRemaining <= 0;

                                    return (
                                        <div key={result.domainName} className="card p-6 glow-border">
                                            <div className="flex items-center gap-3 mb-6">
                                                <DomainName name={result.domainName} size="md" />
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest ${isExpired ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                    {isExpired ? 'expired' : 'reserved'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                                                <div>
                                                    <p className="label mb-1">Reserved At Block</p>
                                                    <p className="font-mono text-sm text-on-surface">
                                                        {Number(result.reservation.reservedAtBlock).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="label mb-1">Time Remaining</p>
                                                    <p className={`font-mono text-sm ${isExpired ? 'text-error' : 'text-warning'}`}>
                                                        {isExpired ? 'Expired' : `~${blocksToTime(blocksRemaining)} (${blocksRemaining} blocks)`}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="label mb-1">Status</p>
                                                    <p className={`font-mono text-sm ${isExpired ? 'text-error' : 'text-success'}`}>
                                                        {isExpired ? 'Reservation Expired' : 'Awaiting Payment'}
                                                    </p>
                                                </div>
                                            </div>

                                            {!isExpired && (
                                                <button
                                                    onClick={() => void handleCompletePurchase(result.domainName)}
                                                    disabled={txPending}
                                                    className="btn-primary w-full text-center disabled:opacity-50"
                                                >
                                                    {txPending ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                            Processing...
                                                        </span>
                                                    ) : (
                                                        'Complete Purchase'
                                                    )}
                                                </button>
                                            )}

                                            {isExpired && (
                                                <div className="px-4 py-3 rounded-lg bg-error/5 border border-error/10">
                                                    <p className="text-error text-xs font-mono">
                                                        This reservation has expired. The domain is available for others to purchase.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </WalletGuard>
        </PageContainer>
    );
}

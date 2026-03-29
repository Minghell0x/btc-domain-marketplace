import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Address } from '@btc-vision/transaction';
import { PageContainer } from '../components/layout/PageContainer';
import { WalletGuard } from '../components/wallet/WalletGuard';
import { StepProgress } from '../components/transaction/StepProgress';
import { DomainName } from '../components/domain/DomainName';
import { DomainBadge } from '../components/domain/DomainBadge';
import { TxLink } from '../components/transaction/TxLink';
import { useWallet } from '../contexts/WalletContext';
import { useTransactions } from '../contexts/TransactionContext';
import { lookupDomain } from '../services/ResolverService';
import { initiateTransferTx } from '../services/ResolverService';
import { listDomainTx } from '../services/MarketplaceService';
import { formatBtcPrice, formatAddress } from '../utils/formatting';
import { MARKETPLACE_CONTRACT_ADDRESS } from '../config/constants';
import type { DomainInfo } from '../types';

const STEPS = [
    { number: 1, label: 'DOMAIN' },
    { number: 2, label: 'PRICING' },
    { number: 3, label: 'ESCROW & LIST' },
];

type ListingStep = 1 | 2 | 3;

export function ListDomain(): ReactElement {
    return (
        <PageContainer>
            <WalletGuard message="Connect your wallet to list a domain for sale.">
                <ListDomainFlow />
            </WalletGuard>
        </PageContainer>
    );
}

function ListDomainFlow(): ReactElement {
    const { addressHex, walletAddress, address, provider } = useWallet();
    const { addTransaction, updateTransaction } = useTransactions();

    const [currentStep, setCurrentStep] = useState<ListingStep>(1);

    // Step 1 state
    const [domainInput, setDomainInput] = useState('');
    const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState('');

    // Step 2 state
    const [btcPriceInput, setBtcPriceInput] = useState('');
    const [motoPriceInput, setMotoPriceInput] = useState('');
    const [sellerBtcAddr, setSellerBtcAddr] = useState('');
    const [priceError, setPriceError] = useState('');

    // Step 3 state
    const [escrowTxHash, setEscrowTxHash] = useState('');
    const [listTxHash, setListTxHash] = useState('');
    const [escrowLoading, setEscrowLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [escrowError, setEscrowError] = useState('');
    const [listError, setListError] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    const cleanName = domainInput.trim().toLowerCase().replace(/\.btc$/, '');

    // Step 1: Lookup domain
    const handleLookup = useCallback(async () => {
        if (!cleanName) return;
        setLookupLoading(true);
        setLookupError('');
        setDomainInfo(null);

        try {
            const info = await lookupDomain(cleanName);

            if (!info.exists || !info.isActive) {
                setLookupError('Domain does not exist or is not active.');
                return;
            }

            if (!addressHex || info.ownerHex.toLowerCase() !== addressHex.toLowerCase()) {
                setLookupError(`You are not the owner of ${cleanName}.btc. Owner: ${formatAddress(info.ownerHex)}`);
                return;
            }

            setDomainInfo(info);
            // Pre-fill seller BTC address
            if (walletAddress && !sellerBtcAddr) {
                setSellerBtcAddr(walletAddress);
            }
            setCurrentStep(2);
        } catch (err) {
            setLookupError(err instanceof Error ? err.message : 'Failed to look up domain.');
        } finally {
            setLookupLoading(false);
        }
    }, [cleanName, addressHex, walletAddress, sellerBtcAddr]);

    // Step 2: Validate pricing
    const handlePricingContinue = useCallback(() => {
        setPriceError('');

        const btcFloat = parseFloat(btcPriceInput);
        const motoInt = parseInt(motoPriceInput, 10);
        const hasBtc = btcPriceInput.trim() !== '' && !isNaN(btcFloat) && btcFloat > 0;
        const hasMoto = motoPriceInput.trim() !== '' && !isNaN(motoInt) && motoInt > 0;

        if (!hasBtc && !hasMoto) {
            setPriceError('At least one price (BTC or MOTO) is required.');
            return;
        }

        if (btcPriceInput.trim() !== '' && (!isNaN(btcFloat) && btcFloat < 0)) {
            setPriceError('BTC price must be a positive number.');
            return;
        }

        if (!sellerBtcAddr.trim()) {
            setPriceError('Seller BTC address is required to receive payment.');
            return;
        }

        setCurrentStep(3);
    }, [btcPriceInput, motoPriceInput, sellerBtcAddr]);

    // Derived price values
    const btcPriceSats = (() => {
        const val = parseFloat(btcPriceInput);
        if (isNaN(val) || val <= 0) return 0n;
        return BigInt(Math.round(val * 1e8));
    })();

    const motoPrice = (() => {
        const val = parseInt(motoPriceInput, 10);
        if (isNaN(val) || val <= 0) return 0n;
        return BigInt(val);
    })();

    // Step 3: Escrow domain
    const handleEscrow = useCallback(async () => {
        if (!provider || !address || !walletAddress) return;
        setEscrowLoading(true);
        setEscrowError('');

        const txId = addTransaction({
            type: 'escrow',
            domainName: cleanName,
            status: 'pending',
        });

        try {
            const marketplaceAddress = Address.fromString(MARKETPLACE_CONTRACT_ADDRESS);
            const result = await initiateTransferTx(
                cleanName,
                marketplaceAddress,
                walletAddress,
                provider,
                address,
            );
            setEscrowTxHash(result.txHash);
            updateTransaction(txId, { status: 'confirmed', txHash: result.txHash });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Escrow transaction failed.';
            setEscrowError(msg);
            updateTransaction(txId, { status: 'failed', error: msg });
        } finally {
            setEscrowLoading(false);
        }
    }, [provider, address, walletAddress, cleanName, addTransaction, updateTransaction]);

    // Step 3: List on marketplace
    const handleList = useCallback(async () => {
        if (!provider || !address || !walletAddress) return;
        setListLoading(true);
        setListError('');

        const txId = addTransaction({
            type: 'list',
            domainName: cleanName,
            status: 'pending',
        });

        try {
            const result = await listDomainTx(
                cleanName,
                btcPriceSats,
                motoPrice,
                sellerBtcAddr,
                walletAddress,
                provider,
                address,
            );
            setListTxHash(result.txHash);
            updateTransaction(txId, { status: 'confirmed', txHash: result.txHash });
            setIsComplete(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'List transaction failed.';
            setListError(msg);
            updateTransaction(txId, { status: 'failed', error: msg });
        } finally {
            setListLoading(false);
        }
    }, [provider, address, walletAddress, cleanName, btcPriceSats, motoPrice, sellerBtcAddr, addTransaction, updateTransaction]);

    // Success screen
    if (isComplete) {
        return (
            <div className="max-w-xl mx-auto animate-fade-in">
                <div className="card p-8 glow-border text-center">
                    <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-7 h-7 text-success" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Domain Listed</h2>
                    <div className="mb-4">
                        <DomainName name={cleanName} size="lg" />
                    </div>
                    <p className="text-on-surface-muted text-sm mb-6">
                        Your domain is now live on the marketplace.
                    </p>
                    {listTxHash && (
                        <div className="mb-6">
                            <span className="label text-xs">TX: </span>
                            <TxLink txHash={listTxHash} />
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to={`/domain/${cleanName}`} className="btn-primary text-center">
                            View Listing
                        </Link>
                        <Link to="/my/listings" className="btn-secondary text-center">
                            My Listings
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <p className="label text-xs tracking-[0.25em] mb-2">SELLER FLOW</p>
                <h1 className="font-display text-3xl font-bold text-on-surface">List Domain for Sale</h1>
            </div>

            <StepProgress steps={STEPS} currentStep={currentStep} />

            {/* Step 1: Enter Domain */}
            {currentStep === 1 && (
                <div className="card p-6 glow-border">
                    <h3 className="label mb-4">ENTER DOMAIN NAME</h3>
                    <p className="text-on-surface-muted text-sm mb-6">
                        Enter the domain you want to list. You must be the current owner.
                    </p>
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="e.g. satoshi"
                                value={domainInput}
                                onChange={(e) => {
                                    setDomainInput(e.target.value);
                                    setLookupError('');
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') void handleLookup(); }}
                                className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline text-on-surface font-mono text-sm placeholder:text-on-surface-muted focus:outline-none focus:border-primary/30"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-muted font-mono text-sm">.btc</span>
                        </div>
                        <button
                            onClick={() => void handleLookup()}
                            disabled={!cleanName || lookupLoading}
                            className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {lookupLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    Checking
                                </span>
                            ) : 'Verify'}
                        </button>
                    </div>
                    {lookupError && (
                        <div className="mt-4 px-4 py-3 rounded-lg bg-error/5 border border-error/10">
                            <p className="text-error text-xs font-mono">{lookupError}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Set Prices */}
            {currentStep === 2 && domainInfo && (
                <div className="card p-6 glow-border">
                    <div className="flex items-center gap-3 mb-6">
                        <DomainName name={cleanName} size="md" />
                        <DomainBadge status="active" />
                    </div>

                    <h3 className="label mb-4">SET YOUR PRICES</h3>

                    <div className="flex flex-col gap-4">
                        {/* BTC Price */}
                        <div>
                            <label className="label text-xs mb-1.5 block">BTC PRICE</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="0.00"
                                    value={btcPriceInput}
                                    onChange={(e) => { setBtcPriceInput(e.target.value); setPriceError(''); }}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline text-on-surface font-mono text-sm placeholder:text-on-surface-muted focus:outline-none focus:border-primary/30 pr-14"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-muted font-mono text-xs">BTC</span>
                            </div>
                            {btcPriceSats > 0n && (
                                <p className="text-on-surface-muted text-xs font-mono mt-1">{Number(btcPriceSats).toLocaleString()} sats</p>
                            )}
                        </div>

                        {/* MOTO Price */}
                        <div>
                            <label className="label text-xs mb-1.5 block">MOTO PRICE <span className="text-on-surface-muted">(optional)</span></label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={motoPriceInput}
                                    onChange={(e) => { setMotoPriceInput(e.target.value); setPriceError(''); }}
                                    className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline text-on-surface font-mono text-sm placeholder:text-on-surface-muted focus:outline-none focus:border-accent/30 pr-16"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-muted font-mono text-xs">MOTO</span>
                            </div>
                        </div>

                        {/* Seller BTC Address */}
                        <div>
                            <label className="label text-xs mb-1.5 block">PAYMENT ADDRESS</label>
                            <input
                                type="text"
                                placeholder="Your BTC address for receiving payment"
                                value={sellerBtcAddr}
                                onChange={(e) => { setSellerBtcAddr(e.target.value); setPriceError(''); }}
                                className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline text-on-surface font-mono text-sm placeholder:text-on-surface-muted focus:outline-none focus:border-outline"
                            />
                            <p className="text-on-surface-muted text-xs mt-1">BTC will be sent to this address when your domain sells.</p>
                        </div>

                        {priceError && (
                            <div className="px-4 py-3 rounded-lg bg-error/5 border border-error/10">
                                <p className="text-error text-xs font-mono">{priceError}</p>
                            </div>
                        )}

                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="btn-secondary"
                            >
                                Back
                            </button>
                            <button
                                onClick={handlePricingContinue}
                                className="btn-primary flex-1"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Escrow & List */}
            {currentStep === 3 && domainInfo && (
                <div className="card p-6 glow-border">
                    <div className="flex items-center gap-3 mb-6">
                        <DomainName name={cleanName} size="md" />
                    </div>

                    {/* Summary */}
                    <div className="rounded-lg bg-surface-container-low p-4 mb-6">
                        <h3 className="label mb-3">LISTING SUMMARY</h3>
                        <div className="flex flex-col gap-2">
                            {btcPriceSats > 0n && (
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-muted text-xs">BTC Price</span>
                                    <span className="price-btc text-sm">{formatBtcPrice(btcPriceSats)}</span>
                                </div>
                            )}
                            {motoPrice > 0n && (
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-muted text-xs">MOTO Price</span>
                                    <span className="price-moto text-sm">{Number(motoPrice).toLocaleString()} MOTO</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-on-surface-muted text-xs">Payment To</span>
                                <span className="font-mono text-xs text-on-surface">{formatAddress(sellerBtcAddr)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Steps */}
                    <div className="flex flex-col gap-4">
                        {/* Step A: Escrow */}
                        <div className={`rounded-lg border p-4 transition-colors ${escrowTxHash ? 'border-success/20 bg-success/5' : 'border-outline-variant'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-on-surface">Step A: Escrow Domain</h4>
                                {escrowTxHash && (
                                    <span className="text-xs font-mono text-success">DONE</span>
                                )}
                            </div>
                            <p className="text-on-surface-muted text-xs mb-3">
                                Transfer your domain to the marketplace contract for secure escrow.
                            </p>
                            {!escrowTxHash ? (
                                <button
                                    onClick={() => void handleEscrow()}
                                    disabled={escrowLoading}
                                    className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {escrowLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            Submitting...
                                        </span>
                                    ) : 'Escrow Domain'}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="label text-xs">TX: </span>
                                    <TxLink txHash={escrowTxHash} />
                                </div>
                            )}
                            {escrowError && (
                                <div className="mt-3 px-3 py-2 rounded-lg bg-error/5 border border-error/10">
                                    <p className="text-error text-xs font-mono">{escrowError}</p>
                                </div>
                            )}
                        </div>

                        {/* Step B: List */}
                        <div className={`rounded-lg border p-4 transition-colors ${!escrowTxHash ? 'opacity-50 border-outline-variant' : listTxHash ? 'border-success/20 bg-success/5' : 'border-outline-variant'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-on-surface">Step B: List on Marketplace</h4>
                                {listTxHash && (
                                    <span className="text-xs font-mono text-success">DONE</span>
                                )}
                            </div>
                            <p className="text-on-surface-muted text-xs mb-3">
                                Create the marketplace listing with your prices.
                            </p>
                            {!listTxHash ? (
                                <button
                                    onClick={() => void handleList()}
                                    disabled={!escrowTxHash || listLoading}
                                    className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {listLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            Submitting...
                                        </span>
                                    ) : 'List on Marketplace'}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="label text-xs">TX: </span>
                                    <TxLink txHash={listTxHash} />
                                </div>
                            )}
                            {listError && (
                                <div className="mt-3 px-3 py-2 rounded-lg bg-error/5 border border-error/10">
                                    <p className="text-error text-xs font-mono">{listError}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setCurrentStep(2)}
                            className="btn-secondary self-start"
                            disabled={escrowLoading || listLoading}
                        >
                            Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { Address } from '@btc-vision/transaction';
import { PageContainer } from '../components/layout/PageContainer';
import { WalletGuard } from '../components/wallet/WalletGuard';
import { DomainName } from '../components/domain/DomainName';
import { DomainBadge } from '../components/domain/DomainBadge';
import { TxLink } from '../components/transaction/TxLink';
import { TxStatus } from '../components/transaction/TxStatus';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../contexts/ContractContext';
import { lookupDomain, fetchDomainPrice, reserveDomainTx, completeRegistrationTx } from '../services/ResolverService';
import { registerDomainBtcReserveTx, registerDomainBtcCompleteTx, registerDomainMotoTx, fetchFeeRate } from '../services/MarketplaceService';
import { increaseAllowanceTx } from '../services/MotoService';
import { cleanDomainInput, isValidDomainName } from '../utils/validation';
import { formatBtcPrice } from '../utils/formatting';
import { BPS_DENOMINATOR, MARKETPLACE_CONTRACT_ADDRESS } from '../config/constants';
import type { DomainPrice } from '../types';

type SearchStatus = 'idle' | 'searching' | 'available' | 'taken' | 'error';
type PaymentPath = 'btc' | 'moto';
type BtcStep = 'idle' | 'reserve-fee' | 'reserve-fee-done' | 'reserve-resolver' | 'reserve-resolver-done' | 'complete-resolver' | 'complete-resolver-done' | 'complete-marketplace' | 'complete-marketplace-done';
type MotoStep = 'idle' | 'approve' | 'approve-done' | 'register' | 'register-done';

const YEAR_OPTIONS = [1, 2, 3, 5, 10];

export function RegisterDomain(): ReactElement {
    const { address, walletAddress, provider } = useWallet();
    const { isReady } = useContracts();

    // Search state
    const [searchInput, setSearchInput] = useState('');
    const [domainName, setDomainName] = useState('');
    const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
    const [searchError, setSearchError] = useState('');

    // Pricing state
    const [years, setYears] = useState(1);
    const [pricing, setPricing] = useState<DomainPrice | null>(null);
    const [feeRate, setFeeRate] = useState<bigint>(500n);
    const [pricingLoading, setPricingLoading] = useState(false);

    // Step state
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Payment state
    const [paymentPath, setPaymentPath] = useState<PaymentPath>('btc');
    const [btcStep, setBtcStep] = useState<BtcStep>('idle');
    const [motoStep, setMotoStep] = useState<MotoStep>('idle');
    const [txHashes, setTxHashes] = useState<Record<string, string>>({});
    const [txError, setTxError] = useState('');
    const [txPending, setTxPending] = useState(false);

    const marketplaceFee = pricing ? (pricing.totalPriceSats * feeRate) / BPS_DENOMINATOR : 0n;
    const totalCostBtc = pricing ? pricing.totalPriceSats + marketplaceFee : 0n;

    // Search for domain availability
    const handleSearch = useCallback(async () => {
        const cleaned = cleanDomainInput(searchInput);
        if (!isValidDomainName(cleaned)) {
            setSearchError('Enter a valid domain name (lowercase letters, numbers, hyphens)');
            setSearchStatus('error');
            return;
        }
        if (!isReady) return;

        setSearchStatus('searching');
        setSearchError('');
        setDomainName(cleaned);

        try {
            const domainInfo = await lookupDomain(cleaned);

            if (domainInfo.exists && domainInfo.isActive) {
                setSearchStatus('taken');
            } else {
                setSearchStatus('available');
                setStep(2);
                await loadPricing(cleaned, years);
            }
        } catch {
            // If lookup fails, domain might not exist (available)
            setSearchStatus('available');
            setStep(2);
            await loadPricing(cleaned, years);
        }
    }, [searchInput, isReady, years]);

    const loadPricing = useCallback(async (name: string, yrs: number) => {
        setPricingLoading(true);
        try {
            const [price, rate] = await Promise.all([
                fetchDomainPrice(name, yrs),
                fetchFeeRate(),
            ]);
            setPricing(price);
            setFeeRate(rate);
        } catch (err) {
            console.error('[RegisterDomain] Failed to fetch pricing:', err);
            setSearchError('Failed to fetch pricing');
        } finally {
            setPricingLoading(false);
        }
    }, []);

    const handleYearChange = useCallback(async (newYears: number) => {
        setYears(newYears);
        if (domainName && searchStatus === 'available') {
            await loadPricing(domainName, newYears);
        }
    }, [domainName, searchStatus, loadPricing]);

    // --- BTC Registration Steps ---

    const handleBtcStep1_ReserveFee = useCallback(async () => {
        if (!provider || !address || !walletAddress) return;
        setTxPending(true);
        setTxError('');
        setBtcStep('reserve-fee');

        try {
            const result = await registerDomainBtcReserveTx(domainName, years, walletAddress, provider, address);
            setTxHashes((prev) => ({ ...prev, 'btc-reserve-fee': result.txHash }));
            setBtcStep('reserve-fee-done');
        } catch (err) {
            setTxError(err instanceof Error ? err.message : 'Reserve fee transaction failed');
            setBtcStep('idle');
        } finally {
            setTxPending(false);
        }
    }, [provider, address, walletAddress, domainName, years]);

    const handleBtcStep2_ReserveResolver = useCallback(async () => {
        if (!provider || !address || !walletAddress) return;
        setTxPending(true);
        setTxError('');
        setBtcStep('reserve-resolver');

        try {
            const result = await reserveDomainTx(domainName, years, walletAddress, provider, address);
            setTxHashes((prev) => ({ ...prev, 'btc-reserve-resolver': result.txHash }));
            setBtcStep('reserve-resolver-done');
        } catch (err) {
            setTxError(err instanceof Error ? err.message : 'Resolver reservation failed');
            setBtcStep('reserve-fee-done');
        } finally {
            setTxPending(false);
        }
    }, [provider, address, walletAddress, domainName, years]);

    const handleBtcStep3_CompleteResolver = useCallback(async () => {
        if (!provider || !address || !walletAddress) return;
        setTxPending(true);
        setTxError('');
        setBtcStep('complete-resolver');

        try {
            const result = await completeRegistrationTx(domainName, walletAddress, provider, address);
            setTxHashes((prev) => ({ ...prev, 'btc-complete-resolver': result.txHash }));
            setBtcStep('complete-resolver-done');
        } catch (err) {
            setTxError(err instanceof Error ? err.message : 'Complete registration failed');
            setBtcStep('reserve-resolver-done');
        } finally {
            setTxPending(false);
        }
    }, [provider, address, walletAddress, domainName]);

    const handleBtcStep4_CompleteMarketplace = useCallback(async () => {
        if (!provider || !address || !walletAddress) return;
        setTxPending(true);
        setTxError('');
        setBtcStep('complete-marketplace');

        try {
            const result = await registerDomainBtcCompleteTx(domainName, walletAddress, provider, address);
            setTxHashes((prev) => ({ ...prev, 'btc-complete-marketplace': result.txHash }));
            setBtcStep('complete-marketplace-done');
        } catch (err) {
            setTxError(err instanceof Error ? err.message : 'Marketplace completion failed');
            setBtcStep('complete-resolver-done');
        } finally {
            setTxPending(false);
        }
    }, [provider, address, walletAddress, domainName]);

    // --- MOTO Registration Steps ---

    const handleMotoStep1_Approve = useCallback(async () => {
        if (!provider || !address || !walletAddress || !pricing) return;
        setTxPending(true);
        setTxError('');
        setMotoStep('approve');

        try {
            const marketplaceAddress = Address.fromString(MARKETPLACE_CONTRACT_ADDRESS);
            // Approve enough for the resolver price + marketplace fee
            const approvalAmount = pricing.totalPriceSats * 2n; // generous approval
            const result = await increaseAllowanceTx(marketplaceAddress, approvalAmount, walletAddress, provider, address);
            setTxHashes((prev) => ({ ...prev, 'moto-approve': result.txHash }));
            setMotoStep('approve-done');
        } catch (err) {
            setTxError(err instanceof Error ? err.message : 'MOTO approval failed');
            setMotoStep('idle');
        } finally {
            setTxPending(false);
        }
    }, [provider, address, walletAddress, pricing]);

    const handleMotoStep2_Register = useCallback(async () => {
        if (!provider || !address || !walletAddress || !pricing) return;
        setTxPending(true);
        setTxError('');
        setMotoStep('register');

        try {
            const result = await registerDomainMotoTx(domainName, years, pricing.totalPriceSats, walletAddress, provider, address);
            setTxHashes((prev) => ({ ...prev, 'moto-register': result.txHash }));
            setMotoStep('register-done');
        } catch (err) {
            setTxError(err instanceof Error ? err.message : 'MOTO registration failed');
            setMotoStep('approve-done');
        } finally {
            setTxPending(false);
        }
    }, [provider, address, walletAddress, domainName, years, pricing]);

    const isRegistrationComplete =
        (paymentPath === 'btc' && btcStep === 'complete-marketplace-done') ||
        (paymentPath === 'moto' && motoStep === 'register-done');

    function getBtcStepStatus(step: BtcStep): 'pending' | 'confirmed' | 'failed' {
        if (btcStep === step) return 'pending';
        const stepOrder: BtcStep[] = ['idle', 'reserve-fee', 'reserve-fee-done', 'reserve-resolver', 'reserve-resolver-done', 'complete-resolver', 'complete-resolver-done', 'complete-marketplace', 'complete-marketplace-done'];
        return stepOrder.indexOf(btcStep) > stepOrder.indexOf(step) ? 'confirmed' : 'failed';
    }

    function getMotoStepStatus(step: MotoStep): 'pending' | 'confirmed' | 'failed' {
        if (motoStep === step) return 'pending';
        const stepOrder: MotoStep[] = ['idle', 'approve', 'approve-done', 'register', 'register-done'];
        return stepOrder.indexOf(motoStep) > stepOrder.indexOf(step) ? 'confirmed' : 'failed';
    }

    return (
        <PageContainer>
            <WalletGuard message="Connect your wallet to register a new .btc domain.">
                <div className="max-w-2xl mx-auto animate-fade-in">
                    {/* Header */}
                    <div className="mb-8">
                        <p className="label text-xs mb-3 tracking-[0.25em]">DOMAIN REGISTRATION</p>
                        <h1 className="font-display text-4xl font-bold tracking-tight">
                            Register Domain
                        </h1>
                        <p className="text-on-surface-muted text-sm mt-2">
                            Register a new .btc domain through the marketplace.
                        </p>
                    </div>

                    {/* Step 1: Search */}
                    <div className="card p-6 mb-6">
                        <h2 className="label mb-4">Step 1: Search for a Domain</h2>
                        <div className="flex gap-3">
                            <div className="flex-1 flex items-center rounded-lg bg-surface-container border border-outline overflow-hidden">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch(); }}
                                    placeholder="Enter domain name"
                                    className="flex-1 px-4 py-3 bg-transparent text-on-surface font-mono text-sm placeholder:text-on-surface-muted focus:outline-none"
                                />
                                <span className="pr-3 text-on-surface-muted text-sm font-mono">.btc</span>
                            </div>
                            <button
                                onClick={() => void handleSearch()}
                                disabled={searchStatus === 'searching' || !isReady}
                                className="btn-primary px-6 disabled:opacity-50"
                            >
                                {searchStatus === 'searching' ? (
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Check'
                                )}
                            </button>
                        </div>

                        {searchStatus === 'error' && searchError && (
                            <p className="text-error text-xs mt-3 font-mono">{searchError}</p>
                        )}

                        {/* Search Result */}
                        {searchStatus === 'taken' && (
                            <div className="mt-4 px-4 py-3 rounded-lg bg-error/5 border border-error/10">
                                <div className="flex items-center gap-3">
                                    <DomainName name={domainName} size="sm" />
                                    <DomainBadge status="active" />
                                </div>
                                <p className="text-on-surface-muted text-xs mt-2">
                                    This domain is already registered. Try a different name or check the marketplace.
                                </p>
                            </div>
                        )}

                        {searchStatus === 'available' && (
                            <div className="mt-4 px-4 py-3 rounded-lg bg-success/5 border border-success/10">
                                <div className="flex items-center gap-3">
                                    <DomainName name={domainName} size="sm" />
                                    <DomainBadge status="available" />
                                </div>
                                <p className="text-success text-xs mt-2 font-mono">
                                    This domain is available for registration.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Pricing & Years */}
                    {searchStatus === 'available' && (
                        <div className="card p-6 mb-6">
                            <h2 className="label mb-4">Step 2: Choose Duration & Payment</h2>

                            {/* Year selector */}
                            <div className="mb-6">
                                <p className="text-on-surface-muted text-xs mb-3">Registration Period</p>
                                <div className="flex gap-2">
                                    {YEAR_OPTIONS.map((y) => (
                                        <button
                                            key={y}
                                            onClick={() => void handleYearChange(y)}
                                            className={`px-4 py-2 rounded-full text-sm font-mono transition-colors ${
                                                years === y
                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                    : 'bg-surface-container text-on-surface-muted border border-outline hover:text-on-surface'
                                            }`}
                                        >
                                            {y}y
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pricing breakdown */}
                            {pricingLoading ? (
                                <div className="flex items-center gap-2 py-4">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-on-surface-muted text-xs font-mono">Fetching price...</span>
                                </div>
                            ) : pricing ? (
                                <div className="rounded-lg bg-surface-container-low p-4 mb-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-on-surface-muted text-xs">Base Price ({years} year{years > 1 ? 's' : ''})</span>
                                            <span className="font-mono text-sm text-on-surface">{formatBtcPrice(pricing.totalPriceSats)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-on-surface-muted text-xs">Marketplace Fee ({Number(feeRate) / 100}%)</span>
                                            <span className="font-mono text-sm text-on-surface">{formatBtcPrice(marketplaceFee)}</span>
                                        </div>
                                        <div className="border-t border-outline-variant my-1" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-on-surface text-xs font-semibold">Total</span>
                                            <span className="font-mono text-sm text-primary font-semibold">{formatBtcPrice(totalCostBtc)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Payment type toggle */}
                            <div className="mb-6">
                                <p className="text-on-surface-muted text-xs mb-3">Payment Method</p>
                                <div className="flex rounded-full border border-outline overflow-hidden w-fit">
                                    <button
                                        onClick={() => setPaymentPath('btc')}
                                        className={`px-6 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                                            paymentPath === 'btc'
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-on-surface-muted hover:text-on-surface'
                                        }`}
                                    >
                                        BTC
                                    </button>
                                    <button
                                        onClick={() => setPaymentPath('moto')}
                                        className={`px-6 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                                            paymentPath === 'moto'
                                                ? 'bg-accent/10 text-accent'
                                                : 'text-on-surface-muted hover:text-on-surface'
                                        }`}
                                    >
                                        MOTO
                                    </button>
                                </div>
                            </div>

                            {/* Proceed button */}
                            {pricing && (
                                <button
                                    onClick={() => setStep(3)}
                                    className="btn-primary w-full text-center py-3 text-sm"
                                >
                                    Proceed to Registration
                                </button>
                            )}
                        </div>
                    )}

                    {/* Step 3: Registration Steps */}
                    {step === 3 && searchStatus === 'available' && pricing && !isRegistrationComplete && (
                        <div className="card p-6 mb-6 glow-border">
                            <h2 className="label mb-4">Step 3: Register</h2>

                            {txError && (
                                <div className="mb-4 px-4 py-3 rounded-lg bg-error/5 border border-error/10">
                                    <p className="text-error text-xs font-mono">{txError}</p>
                                </div>
                            )}

                            {/* BTC Path */}
                            {paymentPath === 'btc' && (
                                <div className="flex flex-col gap-4">
                                    {/* Step A: Reserve & Pay Marketplace Fee */}
                                    <div className={`rounded-lg p-4 border ${btcStep === 'idle' ? 'border-outline bg-surface-container' : 'border-outline-variant bg-surface-container-low'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-mono text-on-surface">A</span>
                                                <span className="text-sm text-on-surface">Reserve & Pay Marketplace Fee</span>
                                            </div>
                                            {btcStep !== 'idle' && <TxStatus status={getBtcStepStatus('reserve-fee')} />}
                                        </div>
                                        {txHashes['btc-reserve-fee'] && (
                                            <div className="ml-9 mb-2"><TxLink txHash={txHashes['btc-reserve-fee']} /></div>
                                        )}
                                        {btcStep === 'idle' && (
                                            <button
                                                onClick={() => void handleBtcStep1_ReserveFee()}
                                                disabled={txPending}
                                                className="btn-primary w-full mt-2 text-center disabled:opacity-50"
                                            >
                                                {txPending ? 'Sending...' : `Pay ${formatBtcPrice(marketplaceFee)} Fee`}
                                            </button>
                                        )}
                                    </div>

                                    {/* Step B: Reserve on Resolver (pay domain price) */}
                                    <div className={`rounded-lg p-4 border ${btcStep === 'reserve-fee-done' ? 'border-outline bg-surface-container' : 'border-outline-variant bg-surface-container-low'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-mono text-on-surface">B</span>
                                                <span className="text-sm text-on-surface">Reserve on Resolver (Pay Domain Price)</span>
                                            </div>
                                            {(btcStep !== 'idle' && btcStep !== 'reserve-fee' && btcStep !== 'reserve-fee-done') && <TxStatus status={getBtcStepStatus('reserve-resolver')} />}
                                        </div>
                                        {txHashes['btc-reserve-resolver'] && (
                                            <div className="ml-9 mb-2"><TxLink txHash={txHashes['btc-reserve-resolver']} /></div>
                                        )}
                                        {btcStep === 'reserve-fee-done' && (
                                            <button
                                                onClick={() => void handleBtcStep2_ReserveResolver()}
                                                disabled={txPending}
                                                className="btn-primary w-full mt-2 text-center disabled:opacity-50"
                                            >
                                                {txPending ? 'Sending...' : `Pay ${formatBtcPrice(pricing.totalPriceSats)} to Resolver`}
                                            </button>
                                        )}
                                    </div>

                                    {/* Step C: Complete Registration on Resolver */}
                                    <div className={`rounded-lg p-4 border ${btcStep === 'reserve-resolver-done' ? 'border-outline bg-surface-container' : 'border-outline-variant bg-surface-container-low'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-mono text-on-surface">C</span>
                                                <span className="text-sm text-on-surface">Complete Registration on Resolver</span>
                                            </div>
                                            {(btcStep !== 'idle' && btcStep !== 'reserve-fee' && btcStep !== 'reserve-fee-done' && btcStep !== 'reserve-resolver' && btcStep !== 'reserve-resolver-done') && <TxStatus status={getBtcStepStatus('complete-resolver')} />}
                                        </div>
                                        {txHashes['btc-complete-resolver'] && (
                                            <div className="ml-9 mb-2"><TxLink txHash={txHashes['btc-complete-resolver']} /></div>
                                        )}
                                        {btcStep === 'reserve-resolver-done' && (
                                            <button
                                                onClick={() => void handleBtcStep3_CompleteResolver()}
                                                disabled={txPending}
                                                className="btn-primary w-full mt-2 text-center disabled:opacity-50"
                                            >
                                                {txPending ? 'Sending...' : 'Complete Registration'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Step D: Complete on Marketplace */}
                                    <div className={`rounded-lg p-4 border ${btcStep === 'complete-resolver-done' ? 'border-outline bg-surface-container' : 'border-outline-variant bg-surface-container-low'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-mono text-on-surface">D</span>
                                                <span className="text-sm text-on-surface">Finalize on Marketplace</span>
                                            </div>
                                            {btcStep === 'complete-marketplace-done' && <TxStatus status="confirmed" />}
                                        </div>
                                        {txHashes['btc-complete-marketplace'] && (
                                            <div className="ml-9 mb-2"><TxLink txHash={txHashes['btc-complete-marketplace']} /></div>
                                        )}
                                        {btcStep === 'complete-resolver-done' && (
                                            <button
                                                onClick={() => void handleBtcStep4_CompleteMarketplace()}
                                                disabled={txPending}
                                                className="btn-primary w-full mt-2 text-center disabled:opacity-50"
                                            >
                                                {txPending ? 'Sending...' : 'Finalize Registration'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* MOTO Path */}
                            {paymentPath === 'moto' && (
                                <div className="flex flex-col gap-4">
                                    {/* Step A: Approve MOTO */}
                                    <div className={`rounded-lg p-4 border ${motoStep === 'idle' ? 'border-outline bg-surface-container' : 'border-outline-variant bg-surface-container-low'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-mono text-on-surface">A</span>
                                                <span className="text-sm text-on-surface">Approve MOTO Spending</span>
                                            </div>
                                            {motoStep !== 'idle' && <TxStatus status={getMotoStepStatus('approve')} />}
                                        </div>
                                        {txHashes['moto-approve'] && (
                                            <div className="ml-9 mb-2"><TxLink txHash={txHashes['moto-approve']} /></div>
                                        )}
                                        {motoStep === 'idle' && (
                                            <button
                                                onClick={() => void handleMotoStep1_Approve()}
                                                disabled={txPending}
                                                className="btn-accent w-full mt-2 text-center disabled:opacity-50"
                                            >
                                                {txPending ? 'Sending...' : 'Approve MOTO'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Step B: Register with MOTO */}
                                    <div className={`rounded-lg p-4 border ${motoStep === 'approve-done' ? 'border-outline bg-surface-container' : 'border-outline-variant bg-surface-container-low'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-mono text-on-surface">B</span>
                                                <span className="text-sm text-on-surface">Register with MOTO</span>
                                            </div>
                                            {motoStep === 'register-done' && <TxStatus status="confirmed" />}
                                        </div>
                                        {txHashes['moto-register'] && (
                                            <div className="ml-9 mb-2"><TxLink txHash={txHashes['moto-register']} /></div>
                                        )}
                                        {motoStep === 'approve-done' && (
                                            <button
                                                onClick={() => void handleMotoStep2_Register()}
                                                disabled={txPending}
                                                className="btn-accent w-full mt-2 text-center disabled:opacity-50"
                                            >
                                                {txPending ? 'Sending...' : 'Register Domain'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Success */}
                    {isRegistrationComplete && (
                        <div className="card p-8 text-center glow-border">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                                <svg className="w-8 h-8 text-success" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h2 className="font-display text-2xl font-bold text-on-surface mb-2">
                                Registration Complete
                            </h2>
                            <div className="mb-4">
                                <DomainName name={domainName} size="lg" />
                            </div>
                            <p className="text-on-surface-muted text-sm mb-6">
                                Your domain has been registered for {years} year{years > 1 ? 's' : ''}.
                            </p>

                            {/* Tx summary */}
                            <div className="rounded-lg bg-surface-container-low p-4 text-left">
                                <p className="label mb-2">Transaction History</p>
                                {Object.entries(txHashes).map(([label, hash]) => (
                                    <div key={label} className="flex items-center justify-between py-1">
                                        <span className="text-on-surface-muted text-xs font-mono">{label}</span>
                                        <TxLink txHash={hash} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </WalletGuard>
        </PageContainer>
    );
}

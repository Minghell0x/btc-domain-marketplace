import type { ReactElement } from 'react';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { Address } from '@btc-vision/transaction';
import type { AbstractRpcProvider } from 'opnet';
import { getProvider } from '../services/ProviderService';

interface WalletBalance {
    total: number;
    confirmed: number;
    unconfirmed: number;
    csv75_total: number;
    csv75_unlocked: number;
    csv75_locked: number;
    usd_value: string;
}

interface WalletState {
    address: Address | null;
    walletAddress: string | null;
    publicKey: string | null;
    hashedMLDSAKey: string | null;
    addressHex: string | null;
    isConnected: boolean;
    displayAddress: string;
    connect: () => void;
    disconnect: () => void;
    provider: AbstractRpcProvider | null;
    balance: WalletBalance | null;
    connecting: boolean;
}

const WalletContext = createContext<WalletState | null>(null);

export function useWallet(): WalletState {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error('useWallet must be used within WalletProvider');
    return ctx;
}

function formatAddress(addr: string, chars: number = 6): string {
    if (addr.length <= chars * 2 + 3) return addr;
    return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function WalletProvider({ children }: { children: ReactNode }): ReactElement {
    const wc = useWalletConnect();
    const [addressHex, setAddressHex] = useState<string | null>(null);

    useEffect(() => {
        async function resolveAddress(): Promise<void> {
            if (wc.walletAddress && wc.publicKey) {
                try {
                    if (wc.hashedMLDSAKey) {
                        setAddressHex('0x' + wc.hashedMLDSAKey.replace(/^0x/, ''));
                        return;
                    }
                    const provider = getProvider();
                    const resolved = await provider.getPublicKeyInfo(wc.walletAddress, false);
                    if (resolved) {
                        setAddressHex(resolved.toHex());
                    }
                } catch (err) {
                    console.error('[Marketplace] Failed to resolve address hex:', err);
                }
            } else {
                setAddressHex(null);
            }
        }
        void resolveAddress();
    }, [wc.walletAddress, wc.publicKey, wc.hashedMLDSAKey]);

    const state = useMemo<WalletState>(() => {
        const isConnected = wc.publicKey !== null;
        return {
            address: wc.address,
            walletAddress: wc.walletAddress,
            publicKey: wc.publicKey,
            hashedMLDSAKey: wc.hashedMLDSAKey,
            addressHex,
            isConnected,
            displayAddress: wc.walletAddress ? formatAddress(wc.walletAddress) : '',
            connect: () => wc.openConnectModal(),
            disconnect: () => wc.disconnect(),
            provider: wc.provider,
            balance: wc.walletBalance as WalletBalance | null,
            connecting: wc.connecting,
        };
    }, [wc, addressHex]);

    return (
        <WalletContext.Provider value={state}>
            {children}
        </WalletContext.Provider>
    );
}

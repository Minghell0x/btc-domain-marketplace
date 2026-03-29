import type { ReactElement } from 'react';
import { useWallet } from '../../contexts/WalletContext';

export function WalletButton(): ReactElement {
    const { isConnected, displayAddress, connect, disconnect, connecting } = useWallet();

    if (connecting) {
        return (
            <button
                disabled
                className="px-5 py-2.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-sm"
            >
                Connecting...
            </button>
        );
    }

    if (isConnected) {
        return (
            <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface font-mono text-sm">
                    {displayAddress}
                </span>
                <button
                    onClick={disconnect}
                    className="px-4 py-2 rounded-full border border-outline text-on-surface-variant text-sm hover:bg-surface-container-high transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={connect}
            className="px-5 py-2.5 rounded-full bg-primary text-black font-semibold text-sm hover:bg-primary-dim transition-colors"
        >
            Connect Wallet
        </button>
    );
}

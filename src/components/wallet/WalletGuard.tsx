import type { ReactElement } from 'react';
import { useWallet } from '../../contexts/WalletContext';

interface WalletGuardProps {
    children: React.ReactNode;
    message?: string;
}

export function WalletGuard({ children, message }: WalletGuardProps): ReactElement {
    const { isConnected, connect } = useWallet();

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
                    <svg className="w-8 h-8 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                    </svg>
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-display font-semibold text-on-surface mb-2">
                        Wallet Required
                    </h2>
                    <p className="text-on-surface-variant text-sm max-w-md">
                        {message ?? 'Connect your wallet to access this page.'}
                    </p>
                </div>
                <button
                    onClick={connect}
                    className="px-6 py-3 rounded-full bg-primary text-black font-semibold text-sm hover:bg-primary-dim transition-colors"
                >
                    Connect Wallet
                </button>
            </div>
        );
    }

    return <>{children}</>;
}

import type { ReactElement } from 'react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMarketplaceContract, getResolverContract } from '../services/ContractService';
import { getProvider } from '../services/ProviderService';
import { BLOCK_POLL_INTERVAL } from '../config/constants';

interface ContractState {
    isReady: boolean;
    error: string | null;
    currentBlock: number;
}

const ContractContext = createContext<ContractState>({
    isReady: false,
    error: null,
    currentBlock: 0,
});

export function useContracts(): ContractState {
    return useContext(ContractContext);
}

export function ContractProvider({ children }: { children: ReactNode }): ReactElement {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentBlock, setCurrentBlock] = useState(0);

    useEffect(() => {
        async function init(): Promise<void> {
            try {
                getMarketplaceContract();
                getResolverContract();
                const provider = getProvider();
                const height = await provider.getBlockNumber();
                setCurrentBlock(Number(height));
                setIsReady(true);
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to connect to OPNet';
                setError(msg);
                console.error('[Marketplace] Contract init failed:', err);
            }
        }
        void init();
    }, []);

    useEffect(() => {
        if (!isReady) return;
        const interval = setInterval(async () => {
            try {
                const provider = getProvider();
                const height = await provider.getBlockNumber();
                setCurrentBlock(Number(height));
            } catch {
                // non-critical
            }
        }, BLOCK_POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [isReady]);

    return (
        <ContractContext.Provider value={{ isReady, error, currentBlock }}>
            {children}
        </ContractContext.Provider>
    );
}

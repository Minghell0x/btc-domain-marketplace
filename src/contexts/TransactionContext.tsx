import type { ReactElement } from 'react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type TxType = 'reserve-purchase' | 'complete-purchase' | 'buy-moto' | 'list' | 'cancel-listing'
    | 'make-offer' | 'accept-offer' | 'cancel-offer' | 'approve' | 'register-reserve'
    | 'register-complete' | 'register-moto' | 'escrow';

interface PendingTx {
    id: string;
    type: TxType;
    domainName: string;
    status: 'pending' | 'confirmed' | 'failed';
    txHash?: string;
    error?: string;
    createdAt: number;
}

interface TransactionState {
    pendingTxs: PendingTx[];
    addTransaction: (tx: Omit<PendingTx, 'id' | 'createdAt'>) => string;
    updateTransaction: (id: string, update: Partial<PendingTx>) => void;
    clearCompleted: () => void;
}

const TransactionContext = createContext<TransactionState | null>(null);

let txCounter = 0;

export function useTransactions(): TransactionState {
    const ctx = useContext(TransactionContext);
    if (!ctx) throw new Error('useTransactions must be used within TransactionProvider');
    return ctx;
}

export function TransactionProvider({ children }: { children: ReactNode }): ReactElement {
    const [pendingTxs, setPendingTxs] = useState<PendingTx[]>([]);

    const addTransaction = useCallback((tx: Omit<PendingTx, 'id' | 'createdAt'>): string => {
        const id = `tx_${++txCounter}_${Date.now()}`;
        setPendingTxs((prev) => [...prev, { ...tx, id, createdAt: Date.now() }]);
        return id;
    }, []);

    const updateTransaction = useCallback((id: string, update: Partial<PendingTx>) => {
        setPendingTxs((prev) =>
            prev.map((tx) => (tx.id === id ? { ...tx, ...update } : tx)),
        );
    }, []);

    const clearCompleted = useCallback(() => {
        setPendingTxs((prev) => prev.filter((tx) => tx.status === 'pending'));
    }, []);

    return (
        <TransactionContext.Provider value={{ pendingTxs, addTransaction, updateTransaction, clearCompleted }}>
            {children}
        </TransactionContext.Provider>
    );
}

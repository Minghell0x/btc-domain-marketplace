import type { ReactElement } from 'react';

interface TxStatusProps {
    status: 'pending' | 'confirmed' | 'failed';
    txHash?: string;
}

export function TxStatus({ status, txHash: _txHash }: TxStatusProps): ReactElement {
    const styles = {
        pending: 'text-warning',
        confirmed: 'text-success',
        failed: 'text-error',
    } as const;

    return (
        <div className="flex items-center gap-2">
            {status === 'pending' && (
                <div className="w-3 h-3 border-2 border-warning border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'confirmed' && (
                <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            )}
            {status === 'failed' && (
                <svg className="w-3 h-3 text-error" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            )}
            <span className={`text-xs font-mono uppercase ${styles[status]}`}>{status}</span>
        </div>
    );
}

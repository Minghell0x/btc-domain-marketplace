import type { ReactElement } from 'react';
import { EXPLORER_TX_URL } from '../../config/constants';

interface TxLinkProps {
    txHash: string;
    short?: boolean;
}

export function TxLink({ txHash, short = true }: TxLinkProps): ReactElement {
    const display = short ? `${txHash.slice(0, 8)}...${txHash.slice(-6)}` : txHash;
    return (
        <a
            href={`${EXPLORER_TX_URL}${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-primary hover:underline"
        >
            {display}
        </a>
    );
}

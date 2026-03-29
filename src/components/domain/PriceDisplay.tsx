import type { ReactElement } from 'react';
import { formatBtcPrice } from '../../utils/formatting';

interface PriceDisplayProps {
    btcPrice?: bigint;
    motoPrice?: bigint;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
} as const;

export function PriceDisplay({ btcPrice, motoPrice, size = 'md' }: PriceDisplayProps): ReactElement {
    return (
        <div className="flex flex-col gap-1">
            {btcPrice !== undefined && btcPrice > 0n && (
                <span className={`price-btc ${sizeClasses[size]}`}>
                    {formatBtcPrice(btcPrice)}
                </span>
            )}
            {motoPrice !== undefined && motoPrice > 0n && (
                <span className={`price-moto ${sizeClasses[size]}`}>
                    {Number(motoPrice).toLocaleString()} MOTO
                </span>
            )}
        </div>
    );
}

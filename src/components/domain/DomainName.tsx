import type { ReactElement } from 'react';

interface DomainNameProps {
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
} as const;

export function DomainName({ name, size = 'md' }: DomainNameProps): ReactElement {
    return (
        <span className={`inline-flex items-baseline gap-0.5 ${sizeClasses[size]}`}>
            <span className="domain-name">{name}</span>
            <span className="domain-suffix">.btc</span>
        </span>
    );
}

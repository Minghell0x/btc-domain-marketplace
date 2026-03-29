import type { ReactElement } from 'react';

interface DomainBadgeProps {
    status: 'listed' | 'reserved' | 'sold' | 'active' | 'expiring' | 'available';
}

const badgeStyles: Record<string, string> = {
    listed: 'bg-primary/10 text-primary',
    reserved: 'bg-warning/10 text-warning',
    sold: 'bg-success/10 text-success',
    active: 'bg-success/10 text-success',
    expiring: 'bg-warning/10 text-warning',
    available: 'bg-primary/10 text-primary',
} as const;

export function DomainBadge({ status }: DomainBadgeProps): ReactElement {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest ${badgeStyles[status] ?? badgeStyles.listed}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status}
        </span>
    );
}

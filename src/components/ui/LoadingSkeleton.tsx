import type { ReactElement } from 'react';

interface LoadingSkeletonProps {
    type?: 'card' | 'text' | 'stat';
    count?: number;
}

export function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps): ReactElement {
    const items = Array.from({ length: count }, (_, i) => i);

    if (type === 'text') {
        return (
            <div className="space-y-2">
                {items.map((i) => (
                    <div key={i} className="h-4 bg-surface-container-high rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
                ))}
            </div>
        );
    }

    if (type === 'stat') {
        return (
            <div className="flex gap-4">
                {items.map((i) => (
                    <div key={i} className="flex-1 h-20 bg-surface-container-high rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((i) => (
                <div key={i} className="card p-5 h-48 animate-pulse">
                    <div className="h-6 w-3/4 bg-surface-container-highest rounded mb-4" />
                    <div className="h-4 w-1/2 bg-surface-container-highest rounded mb-2" />
                    <div className="h-4 w-2/3 bg-surface-container-highest rounded" />
                </div>
            ))}
        </div>
    );
}

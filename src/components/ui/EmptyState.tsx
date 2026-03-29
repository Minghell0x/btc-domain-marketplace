import type { ReactElement } from 'react';

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps): ReactElement {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
                <svg className="w-6 h-6 text-on-surface-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-on-surface">{title}</h3>
            {description && <p className="text-sm text-on-surface-variant max-w-md text-center">{description}</p>}
            {action && (
                <button onClick={action.onClick} className="btn-primary mt-2">
                    {action.label}
                </button>
            )}
        </div>
    );
}

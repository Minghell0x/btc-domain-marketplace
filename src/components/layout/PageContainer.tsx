import type { ReactElement } from 'react';
interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps): ReactElement {
    return (
        <main className={`max-w-[1400px] mx-auto px-6 pt-24 pb-16 ${className}`}>
            {children}
        </main>
    );
}

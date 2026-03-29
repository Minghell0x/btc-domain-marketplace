import type { ReactElement } from 'react';
import { useContracts } from '../../contexts/ContractContext';

export function Footer(): ReactElement {
    const { currentBlock } = useContracts();

    return (
        <footer className="border-t border-outline-variant mt-auto">
            <div className="max-w-[1400px] mx-auto px-6 py-8">
                {/* Top */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    <span className="font-display text-lg font-bold text-primary">CYBER</span>
                    <div className="flex items-center gap-6 text-xs text-on-surface-muted">
                        <span>TWITTER</span>
                        <span>DISCORD</span>
                        <span>DOCS</span>
                        <span>TERMS</span>
                    </div>
                </div>
                {/* Bottom */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t border-outline-variant">
                    <p className="text-xs text-on-surface-muted">
                        2024 KINETIC TERMINAL. SYSTEM STATUS: BLOCK {currentBlock.toLocaleString()}
                    </p>
                    <p className="text-xs text-on-surface-muted font-mono">
                        // NODE CONNECTED
                    </p>
                </div>
            </div>
        </footer>
    );
}

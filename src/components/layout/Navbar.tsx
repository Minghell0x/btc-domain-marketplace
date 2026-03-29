import type { ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletButton } from '../wallet/WalletButton';

const NAV_LINKS = [
    { label: 'EXPLORE', path: '/' },
    { label: 'LIST', path: '/list' },
    { label: 'REGISTER', path: '/register' },
    { label: 'MY ACTIVITY', path: '/my/activity' },
] as const;

export function Navbar(): ReactElement {
    const location = useLocation();

    return (
        <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
            <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <span className="font-display text-xl font-bold text-primary tracking-tight">
                        CYBER
                    </span>
                </Link>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-1">
                    {NAV_LINKS.map(({ label, path }) => {
                        const isActive = path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(path);
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-colors ${
                                    isActive
                                        ? 'bg-surface-container-high text-primary'
                                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                                }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>

                {/* Wallet */}
                <WalletButton />
            </div>
        </nav>
    );
}

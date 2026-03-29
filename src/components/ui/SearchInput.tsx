import { useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { cleanDomainInput, isValidDomainName } from '../../utils/validation';

interface SearchInputProps {
    size?: 'default' | 'hero';
    placeholder?: string;
}

export function SearchInput({ size = 'default', placeholder }: SearchInputProps): ReactElement {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (): void => {
        const cleaned = cleanDomainInput(query);
        if (isValidDomainName(cleaned)) {
            navigate(`/domain/${cleaned}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter') handleSearch();
    };

    const isHero = size === 'hero';

    return (
        <div className={`glow-border rounded-full flex items-center ${isHero ? 'h-14' : 'h-11'} bg-surface-container/50`}>
            <div className="pl-4 pr-2 text-on-surface-muted">
                <svg className={`${isHero ? 'w-5 h-5' : 'w-4 h-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder ?? 'Search for your legacy .btc domain...'}
                className={`flex-1 bg-transparent outline-none text-on-surface placeholder:text-on-surface-muted font-body ${isHero ? 'text-base' : 'text-sm'}`}
            />
            <button
                onClick={handleSearch}
                className={`btn-primary mr-1 ${isHero ? 'px-6 py-2.5' : 'px-4 py-1.5 text-xs'}`}
            >
                SEARCH
            </button>
        </div>
    );
}

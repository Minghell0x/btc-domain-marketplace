export function isValidDomainName(name: string): boolean {
    if (!name || name.length === 0 || name.length > 64) return false;
    return /^[a-z0-9][a-z0-9-]*$/.test(name);
}

export function cleanDomainInput(input: string): string {
    let cleaned = input.toLowerCase().trim();
    if (cleaned.endsWith('.btc')) {
        cleaned = cleaned.slice(0, -4);
    }
    return cleaned;
}

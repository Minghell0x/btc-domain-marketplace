import { getContract, type BitcoinInterfaceAbi } from 'opnet';
import { Address } from '@btc-vision/transaction';
import type { AbstractRpcProvider } from 'opnet';
import { MARKETPLACE_CONTRACT_ADDRESS, RESOLVER_CONTRACT_ADDRESS, NETWORK } from '../config/constants';
import { getProvider } from './ProviderService';
import { BtcDomainMarketplaceAbi } from '../abi/BtcDomainMarketplace.abi';
import { BtcNameResolverAbi } from '../abi/BtcNameResolver.abi';
import { OP20Abi } from '../abi/OP20.abi';
import type { IBtcDomainMarketplace } from '../abi/BtcDomainMarketplace';
import type { IBtcNameResolver } from '../abi/BtcNameResolver';
import type { IOP20 } from '../abi/OP20';

const MarketplaceABI = BtcDomainMarketplaceAbi as unknown as BitcoinInterfaceAbi;
const ResolverABI = BtcNameResolverAbi as unknown as BitcoinInterfaceAbi;
const OP20ABI = OP20Abi as unknown as BitcoinInterfaceAbi;

// Read-only marketplace contract (singleton)
let readMarketplace: IBtcDomainMarketplace | null = null;

export function getMarketplaceContract(): IBtcDomainMarketplace {
    if (!readMarketplace) {
        const provider = getProvider();
        readMarketplace = getContract<IBtcDomainMarketplace>(
            MARKETPLACE_CONTRACT_ADDRESS,
            MarketplaceABI,
            provider,
            NETWORK,
        );
    }
    return readMarketplace;
}

export function getMarketplaceWriteContract(
    walletProvider: AbstractRpcProvider,
    sender: Address,
): IBtcDomainMarketplace {
    return getContract<IBtcDomainMarketplace>(
        MARKETPLACE_CONTRACT_ADDRESS,
        MarketplaceABI,
        walletProvider,
        NETWORK,
        sender,
    );
}

// Read-only resolver contract (singleton)
let readResolver: IBtcNameResolver | null = null;

export function getResolverContract(): IBtcNameResolver {
    if (!readResolver) {
        const provider = getProvider();
        readResolver = getContract<IBtcNameResolver>(
            RESOLVER_CONTRACT_ADDRESS,
            ResolverABI,
            provider,
            NETWORK,
        );
    }
    return readResolver;
}

export function getResolverWriteContract(
    walletProvider: AbstractRpcProvider,
    sender: Address,
): IBtcNameResolver {
    return getContract<IBtcNameResolver>(
        RESOLVER_CONTRACT_ADDRESS,
        ResolverABI,
        walletProvider,
        NETWORK,
        sender,
    );
}

// OP20 token contract (e.g., MOTO) - not singleton since address varies
export function getOP20Contract(tokenAddress: string): IOP20 {
    const provider = getProvider();
    return getContract<IOP20>(
        tokenAddress,
        OP20ABI,
        provider,
        NETWORK,
    );
}

export function getOP20WriteContract(
    tokenAddress: string,
    walletProvider: AbstractRpcProvider,
    sender: Address,
): IOP20 {
    return getContract<IOP20>(
        tokenAddress,
        OP20ABI,
        walletProvider,
        NETWORK,
        sender,
    );
}

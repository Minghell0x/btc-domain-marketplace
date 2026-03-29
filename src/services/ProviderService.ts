import { JSONRpcProvider } from 'opnet';
import { RPC_URL, NETWORK } from '../config/constants';

let provider: JSONRpcProvider | null = null;

export function getProvider(): JSONRpcProvider {
    if (!provider) {
        provider = new JSONRpcProvider({
            url: RPC_URL,
            network: NETWORK,
        });
    }
    return provider;
}

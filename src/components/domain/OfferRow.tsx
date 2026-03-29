import type { ReactElement } from 'react';
import type { Offer } from '../../types';
import { formatBtcPrice, formatAddress, blocksToTime } from '../../utils/formatting';
import { useContracts } from '../../contexts/ContractContext';

interface OfferRowProps {
    offer: Offer;
    isOwner: boolean;
    isBuyer: boolean;
    onAccept?: () => void;
    onCancel?: () => void;
}

export function OfferRow({ offer, isOwner, isBuyer, onAccept, onCancel }: OfferRowProps): ReactElement {
    const { currentBlock } = useContracts();
    const isExpired = currentBlock > 0 && BigInt(currentBlock) > offer.expiryBlock;
    const blocksLeft = offer.expiryBlock - BigInt(currentBlock);

    return (
        <tr className="border-b border-outline-variant last:border-0 hover:bg-surface-container/30 transition-colors">
            <td className="py-3 px-3 font-mono text-xs text-on-surface-muted">#{offer.index}</td>
            <td className="py-3 px-3 font-mono text-xs text-on-surface">{formatAddress(offer.buyerHex)}</td>
            <td className="py-3 px-3">
                {offer.btcAmount > 0n ? (
                    <span className="price-btc text-xs">{formatBtcPrice(offer.btcAmount)}</span>
                ) : (
                    <span className="price-moto text-xs">{Number(offer.motoAmount).toLocaleString()} MOTO</span>
                )}
            </td>
            <td className="py-3 px-3 font-mono text-xs text-on-surface-muted">
                {isExpired ? (
                    <span className="text-error">Expired</span>
                ) : (
                    `${blocksToTime(blocksLeft)} left`
                )}
            </td>
            <td className="py-3 px-3 text-right">
                {offer.isActive && !isExpired && (
                    <div className="flex items-center gap-2 justify-end">
                        {isOwner && onAccept && (
                            <button onClick={onAccept} className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors">
                                Accept
                            </button>
                        )}
                        {isBuyer && onCancel && (
                            <button onClick={onCancel} className="px-3 py-1 rounded-full bg-error/10 text-error-muted text-xs font-semibold hover:bg-error/20 transition-colors">
                                Cancel
                            </button>
                        )}
                    </div>
                )}
                {!offer.isActive && (
                    <span className="text-xs text-on-surface-muted font-mono">Inactive</span>
                )}
            </td>
        </tr>
    );
}

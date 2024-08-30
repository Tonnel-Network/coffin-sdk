import { beginCell, Cell } from '@ton/core';


export function packPrices(pricesPackedCell: Cell, pricesPackedSignature: Buffer): Cell {
    return beginCell()
        .storeRef(pricesPackedCell)
        .storeBuffer(pricesPackedSignature)
        .endCell();
}
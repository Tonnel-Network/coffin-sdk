import { Dictionary } from '@ton/core';
import { MAINNET_ASSETS_ID } from '../constants';
import { PriceData } from '../types/Common';
import { Cell } from '@ton/ton';

export async function getPrices(endpoints: string[] = ["https://api.tonnel.network/coffin/getPrices"], checkPrices = MAINNET_ASSETS_ID): Promise<PriceData> {
    if (endpoints.length == 0) {
        throw new Error("Empty endpoint list");
    }
    // fetch data from all endpoints

    const rawPrices: any[] = [];
    for (const endpoint of endpoints) {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${endpoint}`);
        }
        rawPrices.push(await response.json());
    }
    // {
    //     priceCell: string;
    //     pricesPackedCell: string;
    //     pricesPackedSignature: string;
    // }
    return {
        dict: Cell.fromBoc(Buffer.from(rawPrices[0].pricesPackedCell,'hex'))[0].beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigVarUint(4)),
        dataCell: Cell.fromBoc(Buffer.from(rawPrices[0].priceCell,'hex'))[0]

    };
}

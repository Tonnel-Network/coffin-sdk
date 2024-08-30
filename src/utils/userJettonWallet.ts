import { Address, beginCell, Cell, storeStateInit } from '@ton/core';
import { JETTON_MASTER_ADDRESSES, JETTON_WALLETS_CODE, MAINNET_ASSETS_ID } from '../constants';
import { CHAIN } from '@tonconnect/sdk';

export function getUserJettonWallet(ownerAddress: Address, assetID: bigint, network: CHAIN): Address {
    const builder = beginCell().storeCoins(0).storeAddress(ownerAddress);
    let jettonWalletCode: Cell;
    switch (assetID) {
        case MAINNET_ASSETS_ID.USDT:
            builder.storeAddress(JETTON_MASTER_ADDRESSES.USDT[network])
            jettonWalletCode = JETTON_WALLETS_CODE.USDT[network]
            break;
        case MAINNET_ASSETS_ID.SHIT:
            if (network === CHAIN.TESTNET) {
                builder.storeAddress(JETTON_MASTER_ADDRESSES.SHIT[network])
                jettonWalletCode = JETTON_WALLETS_CODE.SHIT[network]
            } else {
                throw new Error('SHIT is not supported on Mainnet');

            }
            break;
        default:
            throw new Error('Unsupported asset');
    }
    const data = builder.storeRef(jettonWalletCode).endCell();
    const stateInit = beginCell()
        .store(
            storeStateInit({
                code: jettonWalletCode,
                data: data,
            }),
        )
        .endCell();
    return new Address(0, stateInit.hash());
}

import { Address, Contract, ContractProvider, Dictionary } from '@ton/core';
import { UserData, UserLiteData } from '../types/User';
import { parseUserData, parseUserLiteData } from '../api/parser';
import { AssetConfig, ExtendedAssetData } from '../types/Master';
import { LiquidationBaseData } from './MasterContract';
import { ASSET_ID } from '../constants';

/**
 * User contract wrapper
 */
export class EvaaUser implements Contract {
    readonly address: Address;
    private lastSync = 0;
    private _liteData?: UserLiteData;
    private _data?: UserData;

    /**
     * Create user contract wrapper from address
     * @param address user contract address
     */
    static createFromAddress(address: Address) {
        return new EvaaUser(address);
    }

    private constructor(address: Address) {
        this.address = address;
    }

    /**
     * Get user contract lite data, when prices are not available
     * @param provider contract provider. Passed automatically when opened by client
     * @param assetsData assets data
     * @param assetsConfig assets config
     */
    async getSyncLite(
        provider: ContractProvider,
        assetsData: Dictionary<bigint, ExtendedAssetData>,
        assetsConfig: Dictionary<bigint, AssetConfig>,
    ) {
        const state = (await provider.getState()).state;
        if (state.type === 'active') {
            this._liteData = parseUserLiteData(state.data!.toString('base64url'), assetsData, assetsConfig);
            this.lastSync = Math.floor(Date.now() / 1000);
        } else {
            this._liteData = undefined;
            this._data = { type: 'inactive' };
        }
    }

    /**
     * Calculate full user data from lite data and prices
     * @param assetsData assets data
     * @param assetsConfig assets config
     * @param prices prices
     * @returns true if user data was calculated
     */
    calculateUserData(
        assetsData: Dictionary<bigint, ExtendedAssetData>,
        assetsConfig: Dictionary<bigint, AssetConfig>,
        prices: Dictionary<bigint, bigint>,
    ): boolean {
        if (this._liteData) {
            this._data = parseUserData(this._liteData, assetsData, assetsConfig, prices);
            return true;
        }
        return false;
    }

    /**
     * Get full user data
     * @param provider contract provider. Passed automatically when opened by client
     * @param assetsData assets data
     * @param assetsConfig assets config
     * @param prices prices
     */
    async getSync(
        provider: ContractProvider,
        assetsData: Dictionary<bigint, ExtendedAssetData>,
        assetsConfig: Dictionary<bigint, AssetConfig>,
        prices: Dictionary<bigint, bigint>,
    ) {
        const state = (await provider.getState()).state;
        if (state.type === 'active') {
            this._liteData = parseUserLiteData(state.data!.toString('base64url'), assetsData, assetsConfig);
            this._data = parseUserData(this._liteData, assetsData, assetsConfig, prices);
            this.lastSync = Math.floor(Date.now() / 1000);
        } else {
            this._data = { type: 'inactive' };
        }
    }

    /**
     * Get user contract lite data
     * @returns user lite data if available, otherwise undefined
     */
    get liteData(): UserLiteData | undefined {
        return this._liteData;
    }

    /**
     * Get user contract full data
     * @returns user data if available  , otherwise undefined
     */
    get data(): UserData | undefined {
        return this._data;
    }

    /**
     * Get if user is liquidable
     * @returns true if user is liquidable
     */
    get isLiquidable(): boolean {
        if (!this._data || this._data.type === 'inactive') {
            return false;
        }

        return this._data.liquidationData.liquidable;
    }

    /**
     * Get liquidation parameters for passing to liquidation message
     * @returns liquidation parameters if user is liquidable, otherwise undefined
     */
    get liquidationParameters(): LiquidationBaseData | undefined {
        if (!this._data || this._data.type === 'inactive' || !this._data.liquidationData.liquidable) {
            return undefined;
        }

        return {
            borrowerAddress: this._data.ownerAddress,
            loanAsset: this._data.liquidationData.greatestLoanAsset,
            collateralAsset: this._data.liquidationData.greatestCollateralAsset,
            minCollateralAmount: this._data.liquidationData.minCollateralAmount,
            liquidationAmount: this._data.liquidationData.liquidationAmount,
            tonLiquidation: this._data.liquidationData.greatestLoanAsset === ASSET_ID.TON,
        };
    }
}

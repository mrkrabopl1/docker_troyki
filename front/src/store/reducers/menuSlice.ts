import { createSlice } from "@reduxjs/toolkit"
import dropFileType from '../../types/dropFile'



type SizeType = {
    [key: string]: number
}
interface IField {
    show: boolean,
    sticky: boolean,
    shop: {
        id: number,
        size: string
    }[],
    firmMap: Record<string, number>;
    cartCount: number,
    isVerified: boolean,
    collections: Record<string, Record<string, string>>,
    firms: string[],
    categories: { id: number, category_name: string, image_path: string }[],
    typesVal: { [key: string]: { name: string, category_name: string, category_key: string, type_key: string, category_id: number } },
    discountRules: Record<string, string>;
    sizeTables: Record<string, any>;
}

const initialState: IField = {
    show: true,
    sticky: true,
    shop: [],
    cartCount: 0,
    isVerified: false,
    collections: {},
    categories: [],
    typesVal: {},
    firms: [],
    firmMap: {},
    discountRules: {},
    sizeTables: {},
}

const menuSlice = createSlice({
    name: "menu",
    initialState,
    reducers: {
        show(state, action) {
            state.show = action.payload
        },
        sticky(state, action) {
            state.sticky = action.payload
        },
        shopAction(state, action) {
            state.shop = [...action.payload]
        },
        cartCountAction(state, action) {
            state.cartCount = action.payload
        },
        verified(state, action) {
            state.isVerified = action.payload
        },
        collections(state, action) {
            state.collections = { ...action.payload }
        },
        categories(state, action) {
            state.categories = { ...action.payload }
        },
        types(state, action) {
            state.typesVal = { ...action.payload }
        },
        setFirms(state, action) {
            state.firms = [...action.payload]
        },
        setFirmMap(state, action) {
            state.firmMap = { ...action.payload };
        },
        setDiscountRules(state, action) {
            state.discountRules = action.payload;
        },
        setSizeTables(state, action) {
            state.sizeTables = action.payload;
        },
    }

});

export const { show, sticky, shopAction, cartCountAction, verified, collections, categories, types, setFirms, setFirmMap, setDiscountRules, setSizeTables } = menuSlice.actions

export default menuSlice.reducer
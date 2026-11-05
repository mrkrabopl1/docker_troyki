// src/store/reducers/menuSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import dropFileType from '../../types/dropFile';
import { Firm, Line } from "src/types/modules";

// ============================================================
// BRANDING
// ============================================================

export interface FontItem {
    id: number;
    family: string;
    slug: string;
    url: string;
    weight: number;
    style: string;
    version: number;
}

export interface BrandingState {
    logo_url: string;
    logo_alt: string;
    logo_version: number;
    font_body_id: number | null;
    font_display_id: number | null;
    fonts: FontItem[];
}

const defaultBranding: BrandingState = {
    logo_url: '/troyki_logo.svg',
    logo_alt: 'TROYKI_BENCH',
    logo_version: 0,
    font_body_id: null,
    font_display_id: null,
    fonts: [],
};

// ============================================================
// STATE
// ============================================================

interface IField {
    show: boolean;
    sticky: boolean;
    shop: {
        id: number;
        size: string;
    }[];
    firmMap: Record<string, Firm>;
    lineMap: Record<string, Line>;
    cartCount: number;
    isVerified: boolean;
    collections: Record<string, Record<string, string>>;
    firms: string[];
    categories: { id: number; category_name: string; image_path: string }[];
    typesVal: {
        [key: string]: {
            name: string;
            category_name: string;
            category_key: string;
            type_key: string;
            category_id: number;
        };
    };
    discountRules: Record<string, string>;
    sizeTables: Record<string, any>;
    showBrandsModal: boolean;
    activeCart: boolean;
    branding: BrandingState; // 👈
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
    lineMap: {},
    firmMap: {},
    discountRules: {},
    sizeTables: {},
    showBrandsModal: false,
    activeCart: false,
    branding: defaultBranding, // 👈
};

// ============================================================
// SLICE
// ============================================================

const menuSlice = createSlice({
    name: "menu",
    initialState,
    reducers: {
        setActiveCart(state, action) {
            state.activeCart = action.payload;
        },
        show(state, action) {
            state.show = action.payload;
        },
        setShowBrandsModal(state, action) {
            state.showBrandsModal = action.payload;
        },
        sticky(state, action) {
            state.sticky = action.payload;
        },
        shopAction(state, action) {
            state.shop = [...action.payload];
        },
        cartCountAction(state, action) {
            state.cartCount = action.payload;
        },
        verified(state, action) {
            state.isVerified = action.payload;
        },
        collections(state, action) {
            state.collections = { ...action.payload };
        },
        categories(state, action) {
            state.categories = { ...action.payload };
        },
        types(state, action) {
            state.typesVal = { ...action.payload };
        },
        setFirms(state, action) {
            state.firms = [...action.payload];
        },
        setFirmMap(state, action) {
            state.firmMap = { ...action.payload };
        },
        setLineMap: (state, action) => {
            state.lineMap = action.payload;
        },
        setDiscountRules(state, action) {
            state.discountRules = action.payload;
        },
        setSizeTables(state, action) {
            state.sizeTables = action.payload;
        },
        setBranding(state, action) {
            state.branding = { ...state.branding, ...action.payload };
        },
    },
});

export const {
    show,
    sticky,
    shopAction,
    cartCountAction,
    verified,
    collections,
    categories,
    types,
    setFirms,
    setFirmMap,
    setDiscountRules,
    setSizeTables,
    setLineMap,
    setShowBrandsModal,
    setActiveCart,
    setBranding, // 👈
} = menuSlice.actions;

export default menuSlice.reducer;
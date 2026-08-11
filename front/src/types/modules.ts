export interface CheckBoxType {
    id: string | number;
    enable: boolean;
    activeData: boolean;
    name: string;
}


export interface Firm {
    id: number;
    name: string;
    slug: string;
}
export interface Line {
  id: number;
  name: string;
  slug: string;
  brand_id: number;
}


// types/modules.ts
// types/modules.ts
export interface CollectionSettings {
    filters?: {
        sizes: string[];
        firms: number[];
        types: number[];
        price: [number, number];
        rule_ids: number[];
        lines: number[];
        bodytypes: string[];
        in_store: boolean;
    };
    max_items?: number;
    show_out_of_stock?: boolean;
    sort_by?: 'price_asc' | 'price_desc' | 'popular' | 'newest';
}

export interface Collection {
    id: number;
    slug: string;
    product_ids?: number[];
    name: string;
    description?: string;
    type: 'dynamic' | 'manual' | 'hybrid';
    settings: CollectionSettings;
    is_active: boolean;
    product_count?: number;
    created_at?: string;
    updated_at?: string;
}
export interface EditCollection {
    collection: {
        slug: string;
        id: number;
        name: string;
        description?: string;
        type: 'dynamic' | 'manual' | 'hybrid';
        is_active: boolean;
        product_count?: number;
        created_at?: string;
        updated_at?: string;
    }
    product_ids?: number[];
    settings: CollectionSettings;

}
export interface CollectionDetail extends Collection {
    products: any[];
    total: number;
}

export interface PageWidget {
    id: number;
    name: string;
    type: 'products_slider' | 'banner_slider' | 'brands_scroller';
    sort_order: number;
    is_active: boolean;
    collection_id: number;
    created_at?: string;
    updated_at?: string;
}


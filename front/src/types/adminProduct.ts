// types/adminProduct.ts
export interface ProductInfoResponse {
  id?: number;
  article: string;
  name: string;
  description?: string;
  firm: string;
  category_id: number;
  type_id: number;
  line?: string;
  bodytype: 'man' | 'woman' | 'unisex';
  image_path?: string;
  image_count?: number;
  info: string;
  discount?: Record<string, number>;
  store?: Record<string, number>;
  minprice?: number;
  status: 'active' | 'inactive' | 'draft';
  sizes: ProductSizeInfo[];
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
}
export interface BrandLine {
    id?: number;
    brand_id?: number;
    name: string;
    description?: string;
    image_path?: string;
    season?: string;
    year?: number;
    is_active?: boolean;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
}
export interface FirmFormData {
    id?: number;
    name: string;
    slug?: string;
    description?: string;
    image_path?: string;
    website?: string;
    country?: string;
    founded_year?: number;
    is_active?: boolean;
    sort_order?: number;
    lines?: BrandLine[];
}
export interface ProductFormData {
  id?: number;
  article: string;
  name: string;
  description?: string;
  firm: string;
  category_id: number;
  type_id: number;
  line?: string;
  bodytype: 'man' | 'woman' | 'unisex';
  images?: string[];
  image_count?: number;
  info: string;
  discount?: Record<string, number>;
  store?: Record<string, number>;
  minprice?: number;
  status: 'active' | 'inactive' | 'draft';
  sizes: ProductSizeInfo[];
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
}
export interface ProductInfo {
  image_path: string;
  name: string;
  discount?: Record<string, number>;
  store?: Record<string, number>;
  firm?: string;
  id?: number;
  minprice?: number;
  is_active: boolean;
  type_id?: number;
  category_id?: number;

}
export interface ProductSizeInfo {
  price: number;
  size: string;
  discount?: number;
  quantity?: number;
  sku?: string;
}

export interface ProductStatusUpdate {
  product_ids: number[];
  status: 'active' | 'draft' | 'featured' | 'sale';
}

export interface ProductFilters {
  category?: number;
  type?: number;
  firm?: string;
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface ProductsResponse {
  products: AdminProductItem[];
  totalCount: number;
  filters: {
    firms: Record<string, number>;
    categories: Record<string, number>;
    types: Record<string, number>;
  };
}

export interface AdminProductItem {
  id: number;
  article: string;
  name: string;
  firm: string;
  image_path: string;
  minprice: number;
  is_active: boolean;
  is_featured: boolean;
  discount?: number;
  created_at: string;
  updated_at: string;
}
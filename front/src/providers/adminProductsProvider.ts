// providers/adminProductProvider.ts
import axios from 'axios';
import { ProductFormData, ProductStatusUpdate, ProductFilters, ProductInfoResponse, FirmFormData } from 'src/types/adminProduct';
const adminApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});
// Получение списка продуктов с фильтрацией


// Получение продукта по ID
const getAdminProductById = async (
  id: number,
  callback: (data: ProductInfoResponse) => void
): Promise<void> => {
  try {
    const response = await adminApi.get(`/admin/products/${id}`);
    callback(response.data);
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// Создание продукта
const createAdminProduct = async (
  data: ProductFormData,
  callback: (response: { id: number; message: string }) => void
): Promise<void> => {
  try {
    console.debug('Creating product with data:', data);
    const response = await adminApi.post('/admin/products', data);
    callback(response.data);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Обновление продукта
const updateAdminProduct = async (
  id: number,
  data: Partial<ProductFormData>,
  callback: (response: { message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.put(`/admin/products/${id}`, data);
    callback(response.data);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};
const getAdminProductsAndFilters = async (callback: (val: any) => void, page: number, size: number, sortType: number) => {
  try {
    const response = await adminApi.get(`/admin/productsAndFilters`,
      {
        params: {
          page: page,
          size: size,
          sortType: sortType
        }
      });
    callback(response.data);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}
const getAdminProducts = async (callback: (val: any) => void, page: number, size: number, filters: any, sortType: number, name: string) => {
  try {
    const response = await adminApi.post(`/admin/products/search`, {
      page: page,
      size: size,
      sortType: sortType,
      name: name,
      filters: filters
    });
    callback(response.data);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}
// Удаление продукта
const deleteAdminProduct = async (
  id: number,
  callback: (response: { message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.delete(`/admin/products/${id}`);
    callback(response.data);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Массовое обновление статусов


// Обновление видимости одного товара
const updateProductVisibility = async (
  productId: number,
  isActive: boolean,
  callback: (response: { message: string }) => void
): Promise<void> => {
  try {
    console.debug(isActive?"active":"dreft","fmdpsmfsdmfsdkmfldskm")
    const response = await adminApi.patch(`/admin/products/${productId}/status`, {
      status: isActive?"active":"draft"
    });
    callback(response.data);
  } catch (error) {
    console.error('Error updating product visibility:', error);
    throw error;
  }
};


// Загрузка изображения продукта
const uploadProductImage = async (
  id: number,
  file: File,
  callback: (response: { image_path: string }) => void
): Promise<void> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await adminApi.post(`/admin/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    callback(response.data);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
export const uploadTempImage = async (
  sessionID: string,
  file: File,
  callback: (response: { image_path: string }) => void
): Promise<void> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await adminApi.post(`/admin/tempImage/${sessionID}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    callback(response.data);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteTempImage = async (
  sessionID: string,
  filename: string,
  callback: (response: { images: string[], temp_id: string, message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.delete(`/admin/tempImage/${sessionID}`, {
      params: { filename }
    });
    callback(response.data);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
// Получение справочных данных (категории, типы, бренды)
const getProductDictionary = async (
  callback: (data: {
    categories: any[];
    types: any[];
    firms: string[];
  }) => void
): Promise<void> => {
  try {
    const response = await adminApi.get('/admin/products/dictionary');
    callback(response.data);
  } catch (error) {
    console.error('Error fetching dictionary:', error);
    throw error;
  }
};
const deleteProductImage = async (
  productId: number,
  imagePath: string,
  callback: (response: { message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.delete(
      `/admin/products/${productId}/image`, 
      { data: { imagePath } }
    );
    callback(response.data);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Получение статистики
const getStats = async (
  callback: (data: any) => void
): Promise<void> => {
  try {
    const response = await adminApi.get('/admin/dashboard/stats');
    callback(response.data);
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};
export interface VisibilityFilters {
  sizes?: string[];
  price?: number[];
  firms?: string[];
  bodytypes?: string[];
  lines?: string[];
  types?: number[];
  store?: boolean;
  withPrice?: boolean;
  discount?: boolean;
  is_active?: boolean;
  search?: string;
  category_id?: number;
  type_id?: number;
  name?: string;
}
export interface BulkVisibilityUpdate {
  product_ids?: number[];
  filters?: VisibilityFilters;
  is_active: boolean;
}
const bulkUpdateVisibility = async (
  data: BulkVisibilityUpdate,
  callback: (response: { updated_count: number; message: string }) => void
): Promise<void> => {
  try {
    console.debug('Bulk updating visibility with data:', data);
    const response = await adminApi.patch('/admin/products/bulk-visibility', data);
    callback(response.data);
  } catch (error) {
    console.error('Error bulk updating visibility:', error);
    throw error;
  }
};

// Обновление видимости по фирме
const updateFirmVisibility = async (
  firm: string,
  isActive: boolean,
  callback: (response: { updated_count: number; message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.patch('/admin/products/bulk-visibility', {
      filters: { firms: [firm] },
      is_active: isActive
    });
    callback(response.data);
  } catch (error) {
    console.error('Error updating firm visibility:', error);
    throw error;
  }
};

// Обновление видимости по типу товара
const updateTypeVisibility = async (
  typeId: number,
  isActive: boolean,
  callback: (response: { updated_count: number; message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.patch('/admin/products/bulk-visibility', {
      filters: { types: [typeId] },
      is_active: isActive
    });
    callback(response.data);
  } catch (error) {
    console.error('Error updating type visibility:', error);
    throw error;
  }
};

// Обновление видимости по категории
const updateCategoryVisibility = async (
  categoryId: number,
  isActive: boolean,
  callback: (response: { updated_count: number; message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.patch('/admin/products/bulk-visibility', {
      filters: { categories: [categoryId] },
      is_active: isActive
    });
    callback(response.data);
  } catch (error) {
    console.error('Error updating category visibility:', error);
    throw error;
  }
};

const getVisibilityStats = async (
  callback: (data: {
    total_products: number;
    active_products: number;
    inactive_products: number;
    active_percent: number;
    by_firm: Record<string, { total: number; active: number }>;
    by_type: Record<string, { total: number; active: number }>;
  }) => void
): Promise<void> => {
  try {
    const response = await adminApi.get('/admin/products/visibility/stats');
    callback(response.data);
  } catch (error) {
    console.error('Error fetching visibility stats:', error);
    throw error;
  }
};
const createFirm = async (
  data: FormData,
  callback: (response: any) => void
): Promise<void> => {
  try {
    const response = await adminApi.post('/admin/firms', data, {
      headers: {
        'Content-Type': 'multipart/form-data', // Явно указываем
      }
    });
    callback(response.data);
  } catch (error) {
    console.error('Error creating firm:', error);
    throw error;
  }
};

// Обновление продукта
const updateFirm = async (
  id: number,
  data: FormData,
  callback: (response: { message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.put(`/admin/products/${id}`, data);
    callback(response.data);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};


const getBrandsWithLines = async (
  params
): Promise<any> => {
  try {
    const response = await adminApi.get(`/admin/brandsWithLines`, { params });
    return response.data
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

const getBrandsStats = async (
  params
): Promise<any> => {
  try {
    console.debug('Fetching brand stats with params:', params);
    const response = await adminApi.get(`/admin/firms/stats`, { params });
    return response.data
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};


const getBrandData = async (
  id: number,
  callback: (response: any) => void

): Promise<void> => {
  try {
    const response = await adminApi.get(`/admin/brands/${id}`);
    callback(response.data);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};


const updateBrandData = async (
  id: number,
  data: any,
): Promise<void> => {
  try {
    const response = await adminApi.post(`/admin/brands/${id}`, data);
    return response.data
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};
export const bulkUpdateBrandStatus = async (ids: number[], status: string) => {
    const response = await adminApi.put('/admin/brands/bulk-status', { ids, status });
    return response.data;
};
interface dataUpdate { select_all?: boolean; search?: string; exclude_ids?: number[]; brand_ids?: number[]; }
export const bulkUpdateBrandSortOrder = async (ids: dataUpdate, sortOrder: number) => {
    const response = await adminApi.put('/admin/brands/bulk-sort-order', { ids, sort_order: sortOrder });
    return response.data;
};


export const bulkUpdateBrandActive = async (data: dataUpdate, isActive: boolean) => {
  console.debug("dsdad")
    const response = await adminApi.put('/admin/brands/bulk-active', { ...data, is_active: isActive });
    return response.data;
};
const bulkUpdateProductsPrice = async (
  data: {
    product_ids?: number[]
    select_all?: boolean
    exclude_ids?: number[]
    price_type: 'set' | 'increase' | 'decrease'
    price_value: number
  },
  callback: (response: { updated_count: number; message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.patch('/admin/products/bulk-price', data);
    callback(response.data);
  } catch (error) {
    console.error('Error bulk updating prices:', error);
    throw error;
  }
};

const bulkUpdateProductStatus = async (
  data: {
    product_ids?: number[]
    select_all?: boolean
    filters?: any
    search?: string
    exclude_ids?: number[]
    status: string,
  },
  callback: (response: { updated: number; message: string }) => void
): Promise<void> => {
  try {
    console.debug('Bulk updating status with data:', data);
    const response = await adminApi.patch('/admin/products/bulk-status', data);
    callback(response.data);
  } catch (error) {
    console.error('Error updating product statuses:', error);
    throw error;
  }
};

// Массовое обновление скидок товаров
const bulkUpdateProductsDiscount = async (
  data: {
    product_ids?: number[]
    select_all?: boolean
    filters?: any
    search?: string
    exclude_ids?: number[]
    rule_id: number,
  },
  callback: (response: { updated_count: number; message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.patch('/admin/discount-rules/products', data);
    callback(response.data);
  } catch (error) {
    console.error('Error bulk updating discounts:', error);
    throw error;
  }
};

export {
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  bulkUpdateProductStatus,
  uploadProductImage,
  getProductDictionary,
  getStats,
  bulkUpdateVisibility,
  updateFirmVisibility,
  updateTypeVisibility,
  updateCategoryVisibility,
  getVisibilityStats,
  getAdminProducts,
  updateProductVisibility,
  getAdminProductsAndFilters,
  deleteProductImage,
  updateFirm,
  createFirm,
  getBrandsWithLines,
  getBrandData,
  updateBrandData,
  getBrandsStats,
  bulkUpdateProductsPrice,
  bulkUpdateProductsDiscount, 
  
};
import axios from 'axios';

const adminApi = axios.create({
    baseURL: `${API_URL}/admin`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// Типы
export interface SizeProduct {
    id: number;
    name: string;
    article: string;
    firm: string;
    price: number;
    quantity: number;
    in_stock: boolean;
}

export interface SizeInfo {
    size_key: string;
    product_count: number;
    total_quantity: number;
    avg_price: number;
    min_price: number;
    max_price: number;
}

export interface SizesResponse {
    sizes: SizeInfo[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Получение всех размеров
export const getSizes = async (
    search: string = '',
    page: number = 1,
    limit: number = 20
): Promise<SizesResponse> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('offset', String((page - 1) * limit));
    if (limit) params.append('limit', String(limit));
    
    const response = await adminApi.get(`/sizes?${params.toString()}`);
    return response.data;
};

// Получение товаров для конкретного размера
export const getSizeProducts = async (sizeKey: string): Promise<{ products: SizeProduct[], total: number }> => {
    const response = await adminApi.get(`/sizes/${encodeURIComponent(sizeKey)}/products`);
    return response.data;
};

// Удаление размера у всех товаров
export const deleteSize = async (sizeKey: string): Promise<{ success: boolean; affectedProducts: number }> => {
    const response = await adminApi.delete('/sizes', {
        data: { sizeKey }
    });
    return response.data;
};

// Удаление размера у конкретного товара
export const deleteSizeFromProduct = async (productId: number, sizeKey: string): Promise<{ success: boolean }> => {
    const response = await adminApi.delete('/sizes/product', {
        data: { productId, sizeKey }
    });
    return response.data;
};
export const renameSize = async (oldSizeKey: string, newSizeKey: string): Promise<{ success: boolean }> => {
    const response = await adminApi.put('/sizes', {
        oldSizeKey,
        newSizeKey
    });
    return response.data;
};
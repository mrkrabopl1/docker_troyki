// providers/adminCollectionsProvider.ts
import axios from 'axios';
import { Collection, CollectionDetail, CollectionSettings } from 'src/types/modules';


const adminApi = axios.create({
    baseURL: `${API_URL}/admin`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// ============ АДМИНСКИЕ МЕТОДЫ ============

// GET /admin/collections
export const getCollections = async (): Promise<Collection[]> => {
    const response = await adminApi.get('/collections');
    return response.data;
};

// GET /admin/collections/:id
export const getCollection = async (id: number): Promise<any> => {
    const response = await adminApi.get(`/collections/${id}`);
    return response.data;
};

// POST /admin/collections
export const createCollection = async (data: Omit<Collection, 'id' | 'created_at' | 'updated_at' | 'product_count'>): Promise<Collection> => {
    const response = await adminApi.post('/collections', data);
    return response.data;
};

// PUT /admin/collections/:id
export const updateCollection = async (
    id: number,
    data: Partial<Omit<Collection, 'id' | 'created_at' | 'updated_at' | 'product_count'>>
): Promise<Collection> => {
    const response = await adminApi.put(`/collections/${id}`, data);
    return response.data;
};

// DELETE /admin/collections/:id
export const deleteCollection = async (id: number): Promise<void> => {
    await adminApi.delete(`/collections/${id}`);
};

// POST /admin/collections/reorder
export const reorderCollections = async (collectionIds: number[]): Promise<void> => {
    await adminApi.post('/collections/reorder', { collection_ids: collectionIds });
};

// POST /admin/collections/:id/products
export const addProductsToCollection = async (
    id: number,
    productIds: number[]
): Promise<void> => {
    await adminApi.post(`/collections/${id}/products`, { product_ids: productIds });
};

// DELETE /admin/collections/:id/products
export const removeProductsFromCollection = async (
    id: number,
    productIds: number[]
): Promise<void> => {
    await adminApi.delete(`/collections/${id}/products`, {
        data: { product_ids: productIds }
    });
};

// POST /admin/collections/:id/products/reorder
export const reorderCollectionProducts = async (
    id: number,
    productIds: number[]
): Promise<void> => {
    await adminApi.post(`/collections/${id}/products/reorder`, { product_ids: productIds });
};

// ============ ПУБЛИЧНЫЕ МЕТОДЫ ============

const publicApi = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// GET /collections
export const getActiveCollections = async (): Promise<Collection[]> => {
    const response = await publicApi.get('/collections');
    return response.data;
};

// GET /collections/:slug
export const getCollectionBySlug = async (slug: string): Promise<CollectionDetail> => {
    const response = await publicApi.get(`/collections/${slug}`);
    return response.data;
};

// GET /collections/:slug/products
export const getCollectionProducts = async (
    slug: string,
    page: number = 1,
    limit: number = 20
): Promise<{
    products: any[];
    total: number;
    page: number;
    totalPages: number;
}> => {
    const response = await publicApi.get(`/collections/${slug}/products`, {
        params: { page, limit }
    });
    return response.data;
};
// providers/adminPromoCodesProvider.ts
import axios from 'axios';
import { PromoCode } from 'src/types/modules';

const adminApi = axios.create({
    baseURL: `${API_URL}/admin`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

const publicApi = axios.create({
    baseURL: `${API_URL}`,
    withCredentials: true
});

// ============ ADMIN ============

// GET /admin/promo-codes
export const getPromoCodes = async (): Promise<PromoCode[]> => {
    const response = await adminApi.get('/promo-codes');
    return response.data;
};

// POST /admin/promo-codes
export const createPromoCode = async (data: Omit<PromoCode, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<PromoCode> => {
    const response = await adminApi.post('/promo-codes', data);
    return response.data;
};

// GET /admin/promo-codes/:id
export const getPromoCode = async (id: number): Promise<PromoCode> => {
    const response = await adminApi.get(`/promo-codes/${id}`);
    return response.data;
};

// PUT /admin/promo-codes/:id
export const updatePromoCode = async (
    id: number,
    data: Partial<Omit<PromoCode, 'id' | 'created_at' | 'updated_at' | 'usage_count'>>
): Promise<PromoCode> => {
    const response = await adminApi.put(`/promo-codes/${id}`, data);
    return response.data;
};

// DELETE /admin/promo-codes/:id
export const deletePromoCode = async (id: number): Promise<void> => {
    await adminApi.delete(`/promo-codes/${id}`);
};

// GET /admin/promo-codes/:id/usage?customer_id=123
export const checkPromoCodeUsage = async (id: number, customerId: number): Promise<{ used_count: number }> => {
    const response = await adminApi.get(`/promo-codes/${id}/usage`, {
        params: { customer_id: customerId }
    });
    return response.data;
};

// ============ PUBLIC ============

// GET /promo-codes/:code
export const validatePromoCode = async (params:any): Promise<PromoCode> => {
    const response = await publicApi.get(`/promo-codes/${params.code}`, {
        params: {
            hash: params.hash
        }
    });
    return response.data;
}
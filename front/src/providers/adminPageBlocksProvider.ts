// providers/adminPageWidgetsProvider.ts
import axios from 'axios';
import { PageWidget } from 'src/types/modules';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const adminApi = axios.create({
    baseURL: `${API_URL}/admin`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// GET /admin/page-widgets
export const getPageWidgets = async (): Promise<PageWidget[]> => {
    const response = await adminApi.get('/page-widgets');
    return response.data;
};

// POST /admin/page-widgets
export const createPageWidget = async (data: Omit<PageWidget, 'id' | 'created_at' | 'updated_at'>): Promise<PageWidget> => {
    const response = await adminApi.post('/page-widgets', data);
    return response.data;
};

// PUT /admin/page-widgets/:id
export const updatePageWidget = async (
    id: number,
    data: Partial<Omit<PageWidget, 'id' | 'created_at' | 'updated_at'>>
): Promise<PageWidget> => {
    const response = await adminApi.put(`/page-widgets/${id}`, data);
    return response.data;
};

// DELETE /admin/page-widgets/:id
export const deletePageWidget = async (id: number): Promise<void> => {
    await adminApi.delete(`/page-widgets/${id}`);
};

// POST /admin/page-widgets/reorder
export const reorderPageWidgets = async (order: number[]): Promise<void> => {
    await adminApi.post('/page-widgets/reorder', { order });
};

// GET /admin/page-widgets/:id
export const getPageWidget = async (id: number): Promise<PageWidget> => {
    const response = await adminApi.get(`/page-widgets/${id}`);
    return response.data;
};
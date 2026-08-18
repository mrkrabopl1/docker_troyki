import axios from 'axios';
const adminApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});
// Получение статистики линеек с фильтрацией и пагинацией
export const getLinesStats = async (params: URLSearchParams): Promise<any> => {
    try {
        const response = await adminApi.get(`/admin/lines/stats`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching lines stats:', error);
        throw error;
    }
};

// Получение данных одной линейки
export const getLineData = async (id: number): Promise<any> => {
    try {
        const response = await adminApi.get(`/admin/lines/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching line data:', error);
        throw error;
    }
};

// Создание новой линейки
export const createLine = async (data: FormData): Promise<any> => {
    try {
        const response = await adminApi.post(`/admin/lines`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating line:', error);
        throw error;
    }
};

// Обновление линейки
export const updateLineData = async (id: number, data: FormData | Record<string, any>): Promise<any> => {
    try {
        const isFormData = data instanceof FormData;
        const response = await adminApi.post(`/admin/lines/${id}`, data, {
            headers: isFormData ? {
                'Content-Type': 'multipart/form-data',
            } : {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating line:', error);
        throw error;
    }
};

// Удаление линейки
export const deleteLine = async (id: number): Promise<any> => {
    try {
        const response = await adminApi.delete(`/admin/lines/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting line:', error);
        throw error;
    }
};

// Массовое обновление приоритета линеек
export const bulkUpdateLineSortOrder = async (
    data: { select_all?: boolean; search?: string; exclude_ids?: number[]; ids?: number[] },
    sortOrder: number
): Promise<any> => {
    try {
        const response = await adminApi.put('/admin/lines/bulk-sort-order', {
            ...data,
            sort_order: sortOrder
        });
        return response.data;
    } catch (error) {
        console.error('Error bulk updating line sort order:', error);
        throw error;
    }
};

// Массовое обновление активности линеек
export const bulkUpdateLineActive = async (
    data: { select_all?: boolean; search?: string; exclude_ids?: number[]; ids?: number[] },
    isActive: boolean
): Promise<any> => {
    try {
        const response = await adminApi.put('/admin/lines/bulk-active', {
            ...data,
            is_active: isActive
        });
        return response.data;
    } catch (error) {
        console.error('Error bulk updating line active:', error);
        throw error;
    }
};

// Массовое обновление статуса линеек (если нужно)
export const bulkUpdateLineStatus = async (ids: number[], status: string): Promise<any> => {
    try {
        const response = await adminApi.put('/admin/lines/bulk-status', { ids, status });
        return response.data;
    } catch (error) {
        console.error('Error bulk updating line status:', error);
        throw error;
    }
};

// Получение линеек бренда
export const getBrandLines = async (brandId: number, params?: URLSearchParams): Promise<any> => {
    try {
        const response = await adminApi.get(`/admin/brands/${brandId}/lines`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching brand lines:', error);
        throw error;
    }
};

// Получение всех линеек (для селектов и т.д.)
export const getAllLines = async (params?: URLSearchParams): Promise<any> => {
    try {
        const response = await adminApi.get(`/admin/lines`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching all lines:', error);
        throw error;
    }
};
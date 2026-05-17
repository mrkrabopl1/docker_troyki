// src/providers/adminProvider.ts
import axios from 'axios';



const adminApi = axios.create({
    baseURL: `${API_URL}/admin`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// ========== ТИПЫ ==========

export interface OrderFilters {
    page?: number;
    limit?: number;
    status?: string;
    delivery_type?: string;
    search?: string;
    sort_by?: string;
}

export interface AdminFilters {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
    limit?: number;
    is_active?: boolean;
}

export interface LogFilters {
    page?: number;
    page_size?: number;
    admin_id?: number;
    action?: string;
    entity_type?: string;
    date_from?: string;
    date_to?: string;
}

export interface UserFilters {
    page?: number;
    page_size?: number;
    search?: string;
    sort_by?: string;
    type?: 'registered' | 'unregistered';
}

// ========== ЗАКАЗЫ ==========

export const getOrders = async (filters: OrderFilters) => {
    const response = await adminApi.get('/orders', { params: filters });
    return response.data;
};

export const getOrderDetails = async (id: number) => {
    const response = await adminApi.get(`/orders/${id}`);
    return response.data;
};

export const updateOrderStatus = async (id: number, status: string) => {
    const response = await adminApi.put(`/orders/${id}/status`, { status });
    return response.data;
};

// ========== ПОЛЬЗОВАТЕЛИ ==========

export const getUsers = async (filters: UserFilters) => {
    const response = await adminApi.get('/users', { params: filters });
    return response.data;
};

export const getUserDetails = async (id: number) => {
    const response = await adminApi.get(`/users/${id}`);
    return response.data;
};

export const updateUserRole = async (id: number, role: string) => {
    const response = await adminApi.put(`/users/${id}/role`, { role });
    return response.data;
};

// ========== АДМИНИСТРАТОРЫ (только superadmin) ==========

export const getAdmins = async (filters: AdminFilters) => {
    const response = await adminApi.get('/admins', { params: filters });
     console.log('Full response:', response);  // Что здесь?
    console.log('Admins field:', response.data);
    return response.data;
};

export const createAdmin = async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
}) => {
    const response = await adminApi.post('/admins', data);
    return response.data;
};

export const updateAdmin = async (id: number, data: {
    name?: string;
    role?: string;
    is_active?: boolean;
    password?: string;
}) => {
    const response = await adminApi.put(`/admins/${id}`, data);
    return response.data;
};

export const deleteAdmin = async (id: number) => {
    const response = await adminApi.delete(`/admins/${id}`);
    return response.data;
};

// ========== ЛОГИ (только superadmin) ==========

export const getLogs = async (filters: LogFilters) => {
    const response = await adminApi.get('/logs', { params: filters });
    return response.data;
};

// ========== ДАШБОРД ==========

export const getDashboardStats = async () => {
    const response = await adminApi.get('/dashboard/stats');
    return response.data;
};

// ========== БАННЕРЫ ==========

export const getBanners = async () => {
    const response = await adminApi.get('/banners');
    return response.data;
};

export const createBanner = async (data: FormData) => {
    const response = await adminApi.post('/banners', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateBanner = async (id: number, data: FormData) => {
    const response = await adminApi.put(`/banners/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteBanner = async (id: number) => {
    const response = await adminApi.delete(`/banners/${id}`);
    return response.data;
};

// ========== АУТЕНТИФИКАЦИЯ ==========

export const getAdminMe = async () => {
    const response = await adminApi.get('/auth/me');
    return response.data;
};

export const adminLogin = async (email: string, password: string) => {
    const response = await adminApi.post('/auth/login', { email, password });
    return response.data;
};

export const adminLogout = async () => {
    const response = await adminApi.post('/auth/logout');
    return response.data;
};

// ========== ИНТЕРСЕПТОРЫ ==========

adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Перенаправление на страницу логина при истечении сессии
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);




// src/providers/adminProvider.ts

// ========== ТИПЫ ДЛЯ СКИДОК ==========

export interface DiscountRuleItem {
    item_type: 'brand' | 'line' | 'product';
    item_id: number;
    item_name?: string;
}

export interface DiscountRule {
    id: number;
    name: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    starts_at: string;
    ends_at: string | null;
    is_active: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
    items?: DiscountRuleItem[];
}

export interface CreateDiscountRuleInput {
    name: string;
    description?: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    starts_at: string;
    ends_at?: string;
    priority?: number;
    items: {
        item_type: 'brand' | 'line' | 'product';
        item_id: number;
    }[];
}

// ========== СКИДКИ ==========

interface dataUpdate { select_all?: boolean; search?: string; exclude_ids?: number[]; brand_ids?: number[];item_type: string; }

export const bulkAddRuleItems = async (ruleId: number, data: dataUpdate) => {
    const response = await adminApi.post(`/discount-rules/${ruleId}/items`, data);
    return response.data;
};
export const getDiscountRules = async (page = 1, limit = 20) => {
    const response = await adminApi.get('/discount-rules', { 
        params: { page, limit } 
    });
    return response.data;
};

export const getActiveDiscountRules = async (page = 1, limit = 20) => {
    const response = await adminApi.get('/discount-rules/active', { 
        params: { page, limit } 
    });
    return response.data;
};

export const getDiscountRule = async (id: number) => {
    const response = await adminApi.get(`/discount-rules/${id}`);
    return response.data;
};
export const sqlExecute = async (data) => {
    const response = await adminApi.post(`/sql/execute`, data);
    return response.data;
};
export const createDiscountRule = async (data: CreateDiscountRuleInput) => {
    const response = await adminApi.post('/discount-rules', data);
    return response.data;
};

export const updateDiscountRule = async (id: number, data: Partial<CreateDiscountRuleInput>) => {
    const response = await adminApi.put(`/discount-rules/${id}`, data);
    return response.data;
};

export const deleteDiscountRule = async (id: number) => {
    const response = await adminApi.delete(`/discount-rules/${id}`);
    return response.data;
};

export const toggleDiscountRule = async (id: number) => {
    const response = await adminApi.post(`/discount-rules/${id}/toggle`);
    return response.data;
};

export const addRuleItems = async (ruleId: number, items: { item_type: string; item_id: number }[]) => {
    const response = await adminApi.post(`/discount-rules/${ruleId}/items`, { items });
    return response.data;
};

export const removeRuleItem = async (ruleId: number, itemType: string, itemId: number) => {
    const response = await adminApi.delete(`/discount-rules/${ruleId}/items`, {
        data: { item_type: itemType, item_id: itemId }
    });
    return response.data;
};

// Получить скидки для бренда/линейки
export const getEntityDiscounts = async (entityType: 'brand' | 'line' | 'product', entityId: number) => {
    const response = await adminApi.get(`/discount-rules/by-entity`, {
        params: { entity_type: entityType, entity_id: entityId }
    });
    return response.data;
};
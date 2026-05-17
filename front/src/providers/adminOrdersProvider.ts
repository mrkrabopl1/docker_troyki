import axios from 'axios';

const adminApi = axios.create({
    baseURL: '/admin',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// ========== ЗАКАЗЫ ==========

export interface OrderFilters {
    status?: string;
    delivery_type?: string;
    date_from?: string;
    date_to?: string;
    customer_id?: number;
    search?: string;
    sort_by?: string;
    page?: number;
    page_size?: number;
}

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

export const getCustomers = async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    sort_by?: string;
}) => {
    const response = await adminApi.get('/users/customers', { params });
    return response.data;
};

export const getCustomerDetails = async (id: number) => {
    const response = await adminApi.get(`/users/customers/${id}`);
    return response.data;
};

export const getUnregisteredCustomers = async (params: {
    page?: number;
    page_size?: number;
    search?: string;
}) => {
    const response = await adminApi.get('/users/unregistered', { params });
    return response.data;
};

// ========== АДМИНИСТРАТОРЫ ==========

export const getAdmins = async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
    is_active?: boolean;
}) => {
    const response = await adminApi.get('/admins', { params });
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

export const updateAdmin = async (id: number, data: any) => {
    const response = await adminApi.put(`/admins/${id}`, data);
    return response.data;
};

export const deleteAdmin = async (id: number) => {
    const response = await adminApi.delete(`/admins/${id}`);
    return response.data;
};

// ========== ЛОГИ ==========

export const getLogs = async (params: {
    page?: number;
    page_size?: number;
    admin_id?: number;
    action?: string;
    entity_type?: string;
    date_from?: string;
    date_to?: string;
}) => {
    const response = await adminApi.get('/logs', { params });
    return response.data;
};

// ========== ДАШБОРД ==========

export const getDashboardStats = async () => {
    const response = await adminApi.get('/dashboard/stats');
    return response.data;
};
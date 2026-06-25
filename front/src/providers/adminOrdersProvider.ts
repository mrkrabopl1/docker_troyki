import axios from 'axios';
import { UpdateOrderStatusRequest, UpdateOrderStatusResponse } from 'src/types/adminOrders';
const adminApi = axios.create({
    baseURL: `${API_URL}/admin`,
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
    console.debug('Fetching orders with filters:', filters);
    const response = await adminApi.get('/orders',{params:filters});
    return response.data;
};

export const getOrderDetails = async (id: number) => {
    const response = await adminApi.get(`/orders/${id}`);
    return response.data;
};



// providers/adminOrdersProvider.ts
export const updateOrderStatus = async (
    id: number, 
    data: UpdateOrderStatusRequest
): Promise<UpdateOrderStatusResponse> => {
    try {
        const response = await adminApi.put<UpdateOrderStatusResponse>(
            `/orders/${id}/status`, 
            data
        );
        return response.data;
    } catch (error: any) {
        // Пробрасываем понятную ошибку
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Failed to update order status');
    }
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
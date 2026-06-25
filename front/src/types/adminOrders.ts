export interface UpdateOrderStatusRequest {
    status: string;
    reason?: string;
    reason_code?: string;
}

export interface UpdateOrderStatusResponse {
    message: string;
    order_id: number;
    old_status: string;
    new_status: string;
}
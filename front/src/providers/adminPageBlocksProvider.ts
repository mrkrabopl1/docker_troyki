import axios from 'axios';

const adminApi = axios.create({
    baseURL: `${API_URL}/admin`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

export interface PageBlock {
    id?: number;
    name: string;
    sort_order: number;
    is_active: boolean;
    filters: {
        sizes: string[];
        firms: number[];
        types: number[];
        price: [number, number];
        rule_ids: number[];
        in_store:boolean
    };
    min_items: number;
    max_items: number;
    type:string
}

// GET /admin/page-blocks
export const getPageBlocks = async (): Promise<PageBlock[]> => {
    const response = await adminApi.get('/page-blocks');
    return response.data;
};

// POST /admin/page-blocks
export const createPageBlock = async (data: Omit<PageBlock, 'id'>): Promise<PageBlock> => {
    const response = await adminApi.post('/page-blocks', data);
    return response.data;
};

// PUT /admin/page-blocks/:id
export const updatePageBlock = async (id: number, data: Partial<PageBlock>): Promise<PageBlock> => {
    const response = await adminApi.put(`/page-blocks/${id}`, data);
    return response.data;
};

// DELETE /admin/page-blocks/:id
export const deletePageBlock = async (id: number): Promise<void> => {
    await adminApi.delete(`/page-blocks/${id}`);
};

// POST /admin/page-blocks/reorder
export const reorderPageBlocks = async (blockIds: number[]): Promise<void> => {
    await adminApi.post('/page-blocks/reorder', { block_ids: blockIds });
};

// POST /admin/page-blocks/preview
export const previewProductsByFilters = async (
    filters: PageBlock['filters'],
    limit?: number
): Promise<any[]> => {
    const response = await adminApi.post('/page-blocks/preview', { filters, limit });
    return response.data;
};
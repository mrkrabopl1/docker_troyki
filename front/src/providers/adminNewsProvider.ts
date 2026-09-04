// src/providers/adminNewsProvider.ts

import axios from 'axios';
import { 
    NewsBlock, 
    NewsItem, 
    NewsListResponse,
    NewsFilters,
    CreateNewsBlockData, 
    UpdateNewsBlockData, 
    CreateNewsItemData, 
    UpdateNewsItemData 
} from 'src/types/news';


const adminApi = axios.create({
    baseURL: `${API_URL}/admin`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

const publicApi = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// ============================================
// PUBLIC API - НОВОСТИ
// ============================================

/**
 * Получить список новостей с фильтрацией и пагинацией
 */
export const getNewsList = async (filters?: NewsFilters): Promise<NewsListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.search) {
        params.append('search', filters.search);
    }
    if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy);
    }
    if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
    }
    if (filters?.page) {
        params.append('page', String(filters.page));
    }
    if (filters?.limit) {
        params.append('limit', String(filters.limit));
    }

    const url = `/news${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('[getNewsList] Запрос:', url);

    // 🔥 ПРОВЕРКА: на сервере или на клиенте
    if (typeof window === 'undefined') {
        // На сервере используем fetch
        const baseUrl = API_URL;
        const response = await fetch(`${baseUrl}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('[getNewsList] Ошибка fetch:', response.status, response.statusText);
            throw new Error(`Failed to fetch news: ${response.status}`);
        }

        const data = await response.json();
        console.log('[getNewsList] Получено новостей:', data.blocks?.length || 0);
        return data;
    }

    // На клиенте используем axios
    const response = await publicApi.get(url);
    return response.data;
};

/**
 * Получить одну новость по slug или ID
 */
export const getNewsBySlug = async (slugOrId: string): Promise<{ block: NewsBlock; items: NewsItem[] }> => {
    console.log('[getNewsBySlug] Запрос:', slugOrId);

    if (typeof window === 'undefined') {
        // На сервере используем fetch
        const baseUrl = API_URL;
        const response = await fetch(`${baseUrl}/news/${slugOrId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('[getNewsBySlug] Ошибка fetch:', response.status, response.statusText);
            throw new Error(`Failed to fetch news: ${response.status}`);
        }

        const data = await response.json();
        console.log('[getNewsBySlug] Новость найдена:', data.block?.title);
        return data;
    }

    // На клиенте используем axios
    const response = await publicApi.get(`/news/${slugOrId}`);
    return response.data;
};

/**
 * Получить похожие новости
 */
export const getRelatedNews = async (id: number, limit: number = 3): Promise<NewsBlock[]> => {
    console.log('[getRelatedNews] Запрос для id:', id, 'limit:', limit);

    if (typeof window === 'undefined') {
        // На сервере используем fetch
        const baseUrl = API_URL;
        const response = await fetch(`${baseUrl}/news/${id}/related?limit=${limit}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('[getRelatedNews] Ошибка fetch:', response.status, response.statusText);
            return [];
        }

        const data = await response.json();
        return data;
    }

    // На клиенте используем axios
    const response = await publicApi.get(`/news/${id}/related`, { params: { limit } });
    return response.data;
};

/**
 * Увеличить просмотры
 */
export const incrementNewsView = async (id: number): Promise<void> => {
    try {
        await publicApi.post(`/news/${id}/view`);
    } catch (error) {
        console.error('[incrementNewsView] Ошибка:', error);
    }
};

/**
 * Лайкнуть новость
 */
export const toggleNewsLike = async (id: number): Promise<void> => {
    try {
        await publicApi.post(`/news/${id}/like`);
    } catch (error) {
        console.error('[toggleNewsLike] Ошибка:', error);
    }
};

// ============================================
// ADMIN API - NEWS BLOCKS
// ============================================

/**
 * Получить все новостные блоки (для админки)
 */
export const getNewsBlocks = async (): Promise<NewsBlock[]> => {
    const response = await adminApi.get('/news-blocks');
    return response.data;
};

/**
 * Получить один блок с элементами (для админки)
 */
export const getNewsBlock = async (id: number): Promise<{ block: NewsBlock; items: NewsItem[] }> => {
    const response = await adminApi.get(`/news-blocks/${id}`);
    return response.data;
};

/**
 * Создать новостной блок
 */
export const createNewsBlock = async (data: CreateNewsBlockData | FormData): Promise<NewsBlock> => {
    const isFormData = data instanceof FormData;
    const response = await adminApi.post('/news-blocks', data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data.block;
};

/**
 * Обновить новостной блок
 */
export const updateNewsBlock = async (id: number, data: UpdateNewsBlockData | FormData): Promise<NewsBlock> => {
    const isFormData = data instanceof FormData;
    const response = await adminApi.put(`/news-blocks/${id}`, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data.block;
};

/**
 * Удалить новостной блок
 */
export const deleteNewsBlock = async (id: number): Promise<void> => {
    await adminApi.delete(`/news-blocks/${id}`);
};

/**
 * Изменить порядок блоков
 */
export const reorderNewsBlocks = async (order: number[]): Promise<void> => {
    await adminApi.patch('/news-blocks/reorder', { order });
};

// ============================================
// ADMIN API - NEWS ITEMS
// ============================================

/**
 * Получить элементы блока
 */
export const getNewsItems = async (blockId: number): Promise<NewsItem[]> => {
    const response = await adminApi.get(`/news-blocks/${blockId}/items`);
    return response.data;
};

/**
 * Создать элемент новости
 */
export const createNewsItem = async (blockId: number, data: CreateNewsItemData | FormData): Promise<NewsItem> => {
    const isFormData = data instanceof FormData;
    const response = await adminApi.post(`/news-blocks/${blockId}/items`, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data.item;
};

/**
 * Обновить элемент новости
 */
export const updateNewsItem = async (id: number, data: UpdateNewsItemData | FormData): Promise<NewsItem> => {
    const isFormData = data instanceof FormData;
    const response = await adminApi.put(`/news-items/${id}`, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data.item;
};

/**
 * Удалить элемент новости
 */
export const deleteNewsItem = async (id: number): Promise<void> => {
    await adminApi.delete(`/news-items/${id}`);
};

/**
 * Изменить порядок элементов
 */
export const reorderNewsItems = async (blockId: number, order: number[]): Promise<void> => {
    await adminApi.patch('/news-items/reorder', { block_id: blockId, order });
};
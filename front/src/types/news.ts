// src/types/news.ts

// ============================================
// ОСНОВНЫЕ ТИПЫ
// ============================================

export interface NewsBlock {
    id: number;
    title: string;
    cover_image_url: string | null;
    cover_alt_text: string | null;
    is_active: boolean;
    published_at: string;
    created_at: string;
    updated_at: string;
    views_count: number;
    likes_count: number;
    sort_order: number;
    items?: NewsItem[];
}

export interface NewsItem {
    id: number;
    news_block_id: number;
    item_type: 'header' | 'text' | 'image';
    content: string | null;
    image_url: string | null;
    link_url: string | null;
    layout: 'horizontal' | 'vertical' | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// ============================================
// ДЛЯ СПИСКА НОВОСТЕЙ (PUBLIC API)
// ============================================

/**
 * Ответ API для списка новостей
 */
export interface NewsListResponse {
    blocks: NewsBlock[];
    total: number;
    page: number;
    limit: number;
}

/**
 * Фильтры для списка новостей
 */
export interface NewsFilters {
    search?: string;
    sortBy?: 'published_at' | 'views_count' | 'likes_count';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

// ============================================
// ДЛЯ CRUD ОПЕРАЦИЙ (ADMIN API)
// ============================================

/**
 * Создание новостного блока
 */
export type CreateNewsBlockData = {
    title: string;
    cover_image_url?: string | null;
    cover_alt_text?: string | null;
    is_active: boolean;
    published_at?: string;
    sort_order?: number;
};

/**
 * Обновление новостного блока
 */
export type UpdateNewsBlockData = {
    title?: string;
    cover_image_url?: string | null;
    cover_alt_text?: string | null;
    is_active?: boolean;
    published_at?: string;
    sort_order?: number;
};

/**
 * Создание элемента новости
 */
export type CreateNewsItemData = {
    item_type: 'header' | 'text' | 'image';
    content?: string | null;
    image_url?: string | null;
    link_url?: string | null;
    layout?: 'horizontal' | 'vertical' | null;
    sort_order?: number;
};

/**
 * Обновление элемента новости
 */
export type UpdateNewsItemData = {
    item_type?: 'header' | 'text' | 'image';
    content?: string | null;
    image_url?: string | null;
    link_url?: string | null;
    layout?: 'horizontal' | 'vertical' | null;
    sort_order?: number;
};

/**
 * Форма для создания/редактирования элемента (без id)
 */
export type NewsItemFormData = {
    item_type: 'header' | 'text' | 'image';
    content: string;
    image_url: string;
    link_url: string;
    layout: 'horizontal' | 'vertical';
    sort_order: number;
};
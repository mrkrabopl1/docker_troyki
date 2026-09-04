// src/pages/news/NewsList.tsx

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAppDispatch } from 'src/store/hooks/redux';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { NewsBlock, NewsFilters } from 'src/types/news';
import { getNewsList } from 'src/providers/adminNewsProvider';
import s from './style.module.css';

interface NewsListProps {
    initialData?: {
        news?: {
            blocks: NewsBlock[];
            total: number;
            page: number;
            limit: number;
        };
    };
}

const NewsList: React.FC<NewsListProps> = ({ initialData }) => {
    const dispatch = useAppDispatch();
    
    // Данные из SSR или пустые
    const initialNews = initialData?.news?.blocks || [];
    const initialTotal = initialData?.news?.total || 0;
    const initialPage = initialData?.news?.page || 1;
    const initialLimit = initialData?.news?.limit || 10;

    const [news, setNews] = useState<NewsBlock[]>(initialNews);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(initialTotal);
    const [filters, setFilters] = useState<NewsFilters>({
        search: '',
        sortBy: 'published_at',
        sortOrder: 'desc',
        page: initialPage,
        limit: initialLimit,
    });

    useEffect(() => {
        dispatch(finishLoading());
    }, [dispatch]);

    // Клиентская загрузка при изменении фильтров
    const loadNews = useCallback(async (newFilters: NewsFilters) => {
        setLoading(true);
        try {
            const response = await getNewsList(newFilters);
            setNews(response.blocks);
            setTotal(response.total);
        } catch (error) {
            console.error('Error loading news:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFilters = { ...filters, search: e.target.value, page: 1 };
        setFilters(newFilters);
        loadNews(newFilters);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [sortBy, sortOrder] = e.target.value.split('-');
        const newFilters = {
            ...filters,
            sortBy: sortBy as 'published_at' | 'views_count' | 'likes_count',
            sortOrder: sortOrder as 'asc' | 'desc',
            page: 1
        };
        setFilters(newFilters);
        loadNews(newFilters);
    };

    const handlePageChange = (newPage: number) => {
        const newFilters = { ...filters, page: newPage };
        setFilters(newFilters);
        loadNews(newFilters);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const totalPages = Math.ceil(total / (filters.limit || 10));

    const getPreviewText = (block: NewsBlock) => {
        if (!block.items) return '';
        const textItem = block.items.find(i => i.item_type === 'text');
        return textItem?.content || '';
    };

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h1>Новости</h1>
                <p className={s.subtitle}>Свежие новости и обновления</p>
            </div>

            {/* Фильтры и поиск */}
            <div className={s.filters}>
                <div className={s.searchWrapper}>
                    <input
                        type="text"
                        placeholder="Поиск по новостям..."
                        value={filters.search}
                        onChange={handleSearch}
                        className={s.searchInput}
                    />
                    <span className={s.searchIcon}>🔍</span>
                    {filters.search && (
                        <button 
                            className={s.clearBtn}
                            onClick={() => {
                                const newFilters = { ...filters, search: '', page: 1 };
                                setFilters(newFilters);
                                loadNews(newFilters);
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className={s.sortWrapper}>
                    <select 
                        value={`${filters.sortBy}-${filters.sortOrder}`}
                        onChange={handleSortChange}
                        className={s.sortSelect}
                    >
                        <option value="published_at-desc">По дате (сначала новые)</option>
                        <option value="published_at-asc">По дате (сначала старые)</option>
                        <option value="views_count-desc">По просмотрам</option>
                        <option value="likes_count-desc">По лайкам</option>
                    </select>
                </div>
            </div>

            {/* Список новостей */}
            {loading ? (
                <div className={s.loader}>Загрузка новостей...</div>
            ) : news.length === 0 ? (
                <div className={s.emptyState}>
                    <p>Новостей не найдено</p>
                    {filters.search && (
                        <button 
                            className={s.clearSearch}
                            onClick={() => {
                                const newFilters = { ...filters, search: '', page: 1 };
                                setFilters(newFilters);
                                loadNews(newFilters);
                            }}
                        >
                            Очистить поиск
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className={s.newsGrid}>
                        {news.map((item) => (
                            <Link 
                                href={`/news/${item.id}`} 
                                key={item.id}
                                className={s.newsCard}
                            >
                                {item.cover_image_url && (
                                    <div className={s.cardImage}>
                                        <img 
                                            src={item.cover_image_url} 
                                            alt={item.cover_alt_text || item.title} 
                                        />
                                    </div>
                                )}
                                <div className={s.cardContent}>
                                    <h2>{item.title}</h2>
                                    <div className={s.cardMeta}>
                                        <span>📅 {formatDate(item.published_at)}</span>
                                        <span>👁️ {item.views_count}</span>
                                        <span>❤️ {item.likes_count}</span>
                                    </div>
                                    {getPreviewText(item) && (
                                        <p className={s.cardPreview}>
                                            {getPreviewText(item).slice(0, 150)}...
                                        </p>
                                    )}
                                    <span className={s.readMore}>Читать далее →</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Пагинация */}
                    {totalPages > 1 && (
                        <div className={s.pagination}>
                            <button
                                onClick={() => handlePageChange(filters.page! - 1)}
                                disabled={filters.page === 1}
                                className={s.pageBtn}
                            >
                                ← Назад
                            </button>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = filters.page!;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (filters.page! <= 3) {
                                    pageNum = i + 1;
                                } else if (filters.page! >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = filters.page! - 2 + i;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`${s.pageBtn} ${pageNum === filters.page ? s.active : ''}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            
                            <button
                                onClick={() => handlePageChange(filters.page! + 1)}
                                disabled={filters.page === totalPages}
                                className={s.pageBtn}
                            >
                                Вперед →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NewsList;
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getCollection } from "src/providers/merchProvider";
import MerchFieldWithScroll from 'src/modules/merchField/MerchFieldWithScroll';

interface MerchItem {
    name: string;
    imgs: string[];
    id: string;
    price: string;
    className?: string;
    total_count: number;
}

const PAGE_SIZE = 9;
const ROW_SIZE = 3; // 3 элемента в строке

const CollectionPage3: React.FC = () => {
    const params = useParams<{ collection: string }>();
    const collection = params.collection || '';
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [collectionData, setCollectionData] = useState<MerchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [gridView] = useState(false);
    
    const scrollPositionRef = useRef(0);
    const loadingRef = useRef(loading);
    loadingRef.current = loading;

    const fetchCollection = useCallback(async (page: number) => {
        if (loadingRef.current) return;
        
        setLoading(true);
        loadingRef.current = true;
        
        try {
            const data = await new Promise<MerchItem[]>(resolve => {
                getCollection({
                    name: collection,
                    page,
                    size: PAGE_SIZE
                }, resolve);
            });
            
            if (data.length > 0) {
                const totalCount = data[0]?.total_count || 0;
                const calculatedPages = Math.ceil(totalCount / PAGE_SIZE);
                
                setTotalItems(totalCount);
                
                if (page === 1) {
                    setCollectionData(data);
                } else {
                    setCollectionData(prev => [...prev, ...data]);
                }
                
                setHasMore(page < calculatedPages);
            }
            
        } catch (error) {
            console.error('Error fetching collection:', error);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [collection]);

    const initializeCollection = useCallback(async () => {
        setCurrentPage(1);
        setCollectionData([]);
        setTotalItems(0);
        setHasMore(true);
        scrollPositionRef.current = 0;
        await fetchCollection(1);
    }, [fetchCollection]);

    useEffect(() => {
        initializeCollection();
    }, [collection]);

    const handleScrollToBottom = useCallback(() => {
        if (hasMore && !loadingRef.current) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchCollection(nextPage);
        }
    }, [hasMore, currentPage, fetchCollection]);

    // НОВАЯ ФУНКЦИЯ: подгрузка предыдущих данных
    const handleScrollToTop = useCallback(() => {
        if (currentPage > 1 && !loadingRef.current) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            
            // Загружаем предыдущие данные и добавляем в начало
            setLoading(true);
            loadingRef.current = true;
            
            getCollection({
                name: collection,
                page: prevPage,
                size: PAGE_SIZE
            }, (data: MerchItem[]) => {
                setCollectionData(prev => [...data, ...prev]);
                setLoading(false);
                loadingRef.current = false;
            });
        }
    }, [currentPage, collection]);

    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    const handleScrollPosition = useCallback((currentIndex: number, visibleRange: { start: number; end: number }) => {
        scrollPositionRef.current = currentIndex;
        
        const loadedRows = Math.ceil(collectionData.length / ROW_SIZE);
        
        // Подгрузка при скролле ВНИЗ (к концу)
        if (visibleRange.end >= loadedRows - 2) {
            handleScrollToBottom();
        }
        
        // Подгрузка при скролле ВВЕРХ (к началу)
        if (visibleRange.start <= 2 && currentPage > 1) {
            handleScrollToTop();
        }
    }, [collectionData.length, currentPage, handleScrollToBottom, handleScrollToTop]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                <h1>Коллекция: {collection}</h1>
                <p>Страница: {currentPage} из {totalPages || '?'}</p>
                <p>Товаров: {collectionData.length} из {totalItems || '?'}</p>
                <p>Загружено строк: {Math.ceil(collectionData.length / ROW_SIZE)}</p>
                {loading && <p>Загрузка...</p>}
            </div>
            
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <MerchFieldWithScroll
                    data={collectionData}
                    size={ROW_SIZE}
                    onScrollPosition={handleScrollPosition}
                    onScrollToBottom={handleScrollToBottom}
                    onScrollToTop={handleScrollToTop} // ПЕРЕДАЕМ НОВЫЙ КОЛБЕК
                    loading={loading}
                    totalItems={totalItems}
                />
            </div>
        </div>
    );
};

export default React.memo(CollectionPage3);
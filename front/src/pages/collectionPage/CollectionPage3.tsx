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
const ROW_SIZE = 3;

const CollectionPage3: React.FC = () => {
    const params = useParams<{ collection: string }>();
    const collection = params.collection || '';
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [collectionData, setCollectionData] = useState<MerchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    const loadingRef = useRef(false);
    const fetchQueueRef = useRef<Promise<any>>(Promise.resolve());

    const fetchCollection = useCallback(async (page: number, prepend = false) => {
        if (loadingRef.current) return;
        
        loadingRef.current = true;
        setLoading(true);
        
        try {
            const data = await new Promise<MerchItem[]>((resolve) => {
                getCollection({
                    name: collection,
                    page,
                    size: PAGE_SIZE
                }, resolve);
            });
            
            if (data.length > 0) {
                const totalCount = data[0]?.total_count || 0;
                setTotalItems(totalCount);
                
                if (prepend) {
                    setCollectionData(prev => [...data, ...prev]);
                } else {
                    setCollectionData(prev => [...prev, ...data]);
                }
                
                const totalPages = Math.ceil(totalCount / PAGE_SIZE);
                setHasMore(page < totalPages);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Error fetching collection:', error);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [collection]);

    const initializeCollection = useCallback(async () => {
        setCollectionData([]);
        setTotalItems(0);
        setHasMore(true);
        setCurrentPage(1);
        await fetchCollection(1, false);
    }, [fetchCollection]);

    useEffect(() => {
        initializeCollection();
    }, [collection, initializeCollection]);

    const handleScrollToBottom = useCallback(() => {
        const nextPage = currentPage + 1;
        if (hasMore && !loadingRef.current && nextPage <= Math.ceil(totalItems / PAGE_SIZE)) {
            fetchCollection(nextPage, false);
        }
    }, [currentPage, hasMore, totalItems, fetchCollection]);

    const handleScrollToTop = useCallback(() => {
        const prevPage = currentPage - 1;
        if (prevPage >= 1 && !loadingRef.current) {
            fetchCollection(prevPage, true);
        }
    }, [currentPage, fetchCollection]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <MerchFieldWithScroll
                    data={collectionData}
                    size={ROW_SIZE}
                    onScrollToBottom={handleScrollToBottom}
                    onScrollToTop={handleScrollToTop}
                    loading={loading}
                    totalItems={totalItems}
                />
            </div>
        </div>
    );
};

export default React.memo(CollectionPage3);
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { getCollection } from "src/providers/merchProvider";
import MerchField from 'src/modules/merchField/MerchField';

interface MerchItem {
    name: string;
    imgs: string[];
    id: string;
    price: string;
    className?: string;
    total_count: number;
}

const PAGE_SIZE = 9;

const loadingStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    height: '60px'
};

const spinnerStyles: React.CSSProperties = {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
};

const messageStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
    fontSize: '14px'
};

const SpinAnimation: React.FC = () => (
    <style>
        {`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}
    </style>
);

const CollectionPage: React.FC = () => {
    const router = useRouter();
    const collection = router.query.collection as string || '';
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [collectionData, setCollectionData] = useState<MerchItem[]>([]);
    const [gridView] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    const observer = useRef<IntersectionObserver>();
    const lastItemRef = useRef<HTMLDivElement>(null);

    const fetchCollection = useCallback(async (page: number) => {
        if (isLoading) return;
        
        setIsLoading(true);
        try {
            const data = await new Promise<MerchItem[]>(resolve => {
                getCollection({
                    name: collection,
                    page,
                    size: PAGE_SIZE
                }, resolve);
            });
            
            if (data.length === 0) {
                setHasMore(false);
                return;
            }
            
            setTotalPages(Math.ceil((data[0]?.total_count || 0) / PAGE_SIZE));
            
            if (page === 1) {
                setCollectionData(data);
            } else {
                setCollectionData(prevData => [...prevData, ...data]);
            }
            
            setCurrentPage(page);

        } catch (error) {
            console.error('Error fetching collection:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [collection, isLoading]);

    useEffect(() => {
        setCollectionData([]);
        setCurrentPage(1);
        setHasMore(true);
        setIsLoading(false);
        if (collection) {
            fetchCollection(1);
        }
    }, [collection]);

    useEffect(() => {
        if (isLoading || !hasMore) return;

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && hasMore && !isLoading) {
                fetchCollection(currentPage + 1);
            }
        };

        observer.current = new IntersectionObserver(observerCallback, {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        });

        if (lastItemRef.current) {
            observer.current.observe(lastItemRef.current);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [isLoading, hasMore, currentPage, fetchCollection]);

    return (
        <div>
            <SpinAnimation />
            
            <MerchField 
                size={gridView ? 2 : 3} 
                data={collectionData} 
            />
            
            {hasMore && (
                <div ref={lastItemRef} style={loadingStyles}>
                    {isLoading && <div style={spinnerStyles}></div>}
                </div>
            )}
            
            {!hasMore && collectionData.length > 0 && (
                <div style={messageStyles}>
                    Все товары загружены
                </div>
            )}
            
            {!hasMore && collectionData.length === 0 && !isLoading && (
                <div style={messageStyles}>
                    В этой коллекции пока нет товаров
                </div>
            )}
        </div>
    );
};

export default React.memo(CollectionPage);
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getCollection } from "src/providers/merchProvider";
import MerchFieldWithPageSwitcher from 'src/modules/merchField/MerchFieldWithPageSwitcher';
import { set } from 'ol/transform';

interface MerchItem {
    name: string;
    imgs: string[];
    id: string;
    price: string;
    className?: string;
    total_count: number;
}

interface CollectionResponse {
    pages: number;
    merchInfo: MerchItem[];
}

const PAGE_SIZE = 9;

const CollectionPage: React.FC = () => {
    // Properly typed useParams with string index signature
    const params = useParams<{ collection: string }>();
    const collection = params.collection || '';
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [collectionData, setCollectionData] = useState<MerchItem[]>([]);
    const [gridView] = useState(false);

    const fetchCollection = useCallback(async (page: number) => {
        try {
            const data = await new Promise< MerchItem[]>(resolve => {
                getCollection({
                    name: collection,
                    page,
                    size: PAGE_SIZE
                }, resolve);
            });
            setTotalPages(Math.ceil((data[0]?.total_count || 0) / PAGE_SIZE));
            setCollectionData(data);

        } catch (error) {
            console.error('Error fetching collection:', error);
        }
    }, [collection]);

    const initializeCollection = useCallback(async () => {
        try {
            await fetchCollection(1);
        } catch (error) {
            console.error('Error initializing collection:', error);
        }
    }, [collection, fetchCollection]);

    useEffect(() => {
        initializeCollection();
    }, [initializeCollection]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        fetchCollection(page);
    }, [fetchCollection]);

    return (
        <div>
            <MerchFieldWithPageSwitcher 
                onChange={handlePageChange} 
                currentPage={currentPage} 
                pages={totalPages} 
                heightRow={500} 
                size={gridView ? 2 : 3} 
                data={collectionData} 
            />
        </div>
    );
};

export default React.memo(CollectionPage);
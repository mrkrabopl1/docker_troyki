// modules/merchField/AdminMerchFieldGrid.tsx
import React, { useMemo, memo, useState } from 'react';
import AdminMerchBlockGrid from './AdminMerchBlockGrid';
import PageController from 'src/components/contentSlider/slidersSwitchers/PageController';
import s from './adminMerchFieldGrid.module.css';
import { ProductInfo } from 'src/types/adminProduct';

interface AdminMerchFieldGridProps {
    products: ProductInfo[];
    selectedProducts: Set<number>;
    currentPage: number;
    totalPages: number;
    defaultColumns?: number;
    onPageChange: (page: number) => void;
    onSelectProduct: (id: number) => void;
    onStatusToggle: (id: number, isActive: boolean) => void;
    loading?: boolean;
}

const AdminMerchFieldGrid: React.FC<AdminMerchFieldGridProps> = memo(({
    products,
    selectedProducts,
    currentPage,
    totalPages,
    defaultColumns = 4,
    onPageChange,
    onSelectProduct,
    onStatusToggle,
    loading
}) => {
    const [columns, setColumns] = useState(defaultColumns);

    // Динамический стиль для grid
    const gridStyle = useMemo(() => ({
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '16px'
    }), [columns]);

    const rows = useMemo(() => {
        const result = [];
        const items = [...products];
        
        while (items.length > 0) {
            const rowItems = items.splice(0, columns);
            result.push(rowItems);
        }
        
        return result;
    }, [products, columns]);

    const handleColumnsChange = (newColumns: number) => {
        if (newColumns >= 2 && newColumns <= 6) {
            setColumns(newColumns);
        }
    };

    if (loading) {
        return (
            <div className={s.loaderContainer}>
                <div className={s.loader}>Загрузка...</div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className={s.emptyContainer}>
                <div className={s.emptyText}>Товары не найдены</div>
            </div>
        );
    }

    return (
        <div className={s.container}>
            {/* Панель управления сеткой */}
            <div className={s.gridControls}>
                <span className={s.gridLabel}>Колонок:</span>
                <div className={s.gridButtons}>
                    {[2, 3, 4, 5, 6].map(col => (
                        <button
                            key={col}
                            className={`${s.gridBtn} ${columns === col ? s.active : ''}`}
                            onClick={() => handleColumnsChange(col)}
                        >
                            {col}
                        </button>
                    ))}
                </div>
            </div>

            <div className={s.productsGrid}>
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} style={gridStyle}>
                        {row.map(product => (
                            <AdminMerchBlockGrid
                                key={product.id}
                                data={product}
                                isSelected={selectedProducts.has(product.id)}
                                onSelect={() => onSelectProduct(product.id)}
                                onStatusToggle={(isActive) => onStatusToggle(product.id, isActive)}
                            />
                        ))}
                    </div>
                ))}
            </div>
            
            {totalPages > 1 && (
                <div className={s.paginationWrapper}>
                    <PageController
                        currentPosition={currentPage}
                        positions={totalPages}
                        callback={onPageChange}
                    />
                </div>
            )}
        </div>
    );
});

AdminMerchFieldGrid.displayName = 'AdminMerchFieldGrid';

export default AdminMerchFieldGrid;
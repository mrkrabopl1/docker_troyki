// modules/merchField/AdminMerchField.tsx
import React, { memo } from 'react';
import AdminMerchBlock from './AdminMerchBlock';
import PageController from 'src/components/contentSlider/slidersSwitchers/PageController';
import s from './adminMerchField.module.css';
import {ProductInfo} from 'src/types/adminProduct'



interface AdminMerchFieldProps {
    products: ProductInfo[];
    selectedProducts: Set<number>;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onSelectProduct: (id: number) => void;
    onStatusToggle: (id: number, isActive: boolean) => void;
    loading?: boolean;
}

const AdminMerchField: React.FC<AdminMerchFieldProps> = memo(({
    products,
    selectedProducts,
    currentPage,
    totalPages,
    onPageChange,
    onSelectProduct,
    onStatusToggle,
    loading
}) => {
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
            <div className={s.productsList}>
                {products.map(product => (
                    <AdminMerchBlock
                        key={product.id}
                        data={product}
                        isSelected={selectedProducts.has(product.id)}
                        onSelect={() => onSelectProduct(product.id)}
                        onStatusToggle={(isActive) => onStatusToggle(product.id, isActive)}
                    />
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

AdminMerchField.displayName = 'AdminMerchField';

export default AdminMerchField;
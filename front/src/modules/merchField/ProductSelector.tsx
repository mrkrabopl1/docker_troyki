// components/ProductSelector/ProductSelector.tsx
import React, { useState, useEffect } from 'react'
import SearchWithList from 'src/modules/searchWithList/SearchWithList'
import s from './productSelector.module.css'

interface Product {
    id: number
    name: string
    image_path?: string
    price?: number
    article?: string
}

interface ProductSelectorProps {
    // Данные (приходят снаружи)
    products: Product[]
    selectedIds: number[]
    isLoading?: boolean
    total?: number
    searchQuery?: string
    
    // Колбэки (вызывают родителя)
    onChange: (ids: number[]) => void
    onSearch: (query: string) => void
    onLoadMore?: () => void
    
    // Настройки
    multiple?: boolean
    maxItems?: number
    placeholder?: string
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
    products = [],
    selectedIds = [],
    isLoading = false,
    total = 0,
    searchQuery = '',
    onChange,
    onSearch,
    onLoadMore,
    multiple = true,
    maxItems = 500,
    placeholder = 'Поиск товаров...'
}) => {
    const [selected, setSelected] = useState<number[]>(selectedIds)
    
    // Синхронизация с внешними изменениями
    useEffect(() => {
        setSelected(selectedIds)
    }, [selectedIds])
    
    const toggleProduct = (productId: number) => {
        let newSelected: number[]
        
        if (!multiple) {
            newSelected = selected.includes(productId) ? [] : [productId]
        } else {
            newSelected = selected.includes(productId)
                ? selected.filter(id => id !== productId)
                : selected.length < maxItems ? [...selected, productId] : selected
        }
        
        setSelected(newSelected)
        onChange(newSelected)
    }
    
    const clearAll = () => {
        setSelected([])
        onChange([])
    }
    
    const isSelected = (productId: number) => selected.includes(productId)
    
    return (
        <div className={s.container}>
            {/* Поиск */}
            <div className={s.header}>
                <SearchWithList
                    val={searchQuery}
                    searchCallback={onSearch}
                    selectList={() => {}}
                />
                <span className={s.count}>
                    {selected.length} / {maxItems}
                </span>
            </div>
            
            {/* Список товаров */}
            <div className={s.productsGrid}>
                {isLoading ? (
                    <div className={s.loader}>Загрузка...</div>
                ) : products.length === 0 ? (
                    <div className={s.empty}>Товары не найдены</div>
                ) : (
                    products.map((product) => (
                        <div
                            key={product.id}
                            className={`${s.productItem} ${isSelected(product.id) ? s.selected : ''}`}
                            onClick={() => toggleProduct(product.id)}
                        >
                            <input
                                type={multiple ? 'checkbox' : 'radio'}
                                checked={isSelected(product.id)}
                                onChange={() => {}}
                            />
                            {product.image_path && (
                                <img src={product.image_path} alt={product.name} />
                            )}
                            <div className={s.productInfo}>
                                <span className={s.productName}>{product.name}</span>
                                {product.article && (
                                    <span className={s.article}>Арт: {product.article}</span>
                                )}
                                <span className={s.productPrice}>
                                    {product.price?.toLocaleString()} ₽
                                </span>
                            </div>
                            {isSelected(product.id) && (
                                <span className={s.checkmark}>✓</span>
                            )}
                        </div>
                    ))
                )}
            </div>
            
            {/* Футер */}
            <div className={s.footer}>
                <span className={s.selectedCount}>
                    Выбрано: {selected.length}
                    {total > 0 && ` (всего: ${total})`}
                </span>
                <div className={s.actions}>
                    {onLoadMore && products.length < total && (
                        <button 
                            className={s.loadMoreBtn}
                            onClick={onLoadMore}
                            disabled={isLoading}
                        >
                            Загрузить еще
                        </button>
                    )}
                    {selected.length > 0 && (
                        <button 
                            className={s.clearBtn} 
                            onClick={clearAll}
                        >
                            Очистить
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProductSelector
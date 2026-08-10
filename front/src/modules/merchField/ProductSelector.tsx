// components/ProductSelector/ProductSelector.tsx
import React, { useState, useEffect, useMemo } from 'react'
import SearchWithList from 'src/modules/searchWithList/SearchWithList'
import PageController from 'src/components/contentSlider/slidersSwitchers/PageController'
import s from './productSelector.module.css'

interface Product {
    id: number
    name: string
    image_path?: string
    price?: number
    article?: string
    status?: string
}

interface ProductSelectorProps {
    // Данные
    products: Product[]
    selectedIds: number[]
    isLoading?: boolean
    total?: number
    searchQuery?: string
    currentPage?: number
    
    // Колбэки
    onChange: (ids: number[]) => void
    onSearch: (query: string) => void
    onPageChange: (page: number) => void  // Вместо onLoadMore
    onViewSelected?: (any) => void
    
    // Настройки
    multiple?: boolean
    maxItems?: number
    placeholder?: string
    showViewSelected?: boolean
    pageSize?: number
}

type ViewMode = 'all' | 'selected'

const ProductSelector: React.FC<ProductSelectorProps> = ({
    products = [],
    selectedIds = [],
    isLoading = false,
    total = 0,
    searchQuery = '',
    currentPage = 1,
    onChange,
    onSearch,
    onPageChange,
    onViewSelected,
    multiple = true,
    maxItems = 500,
    placeholder = 'Поиск товаров...',
    showViewSelected = true,
    pageSize = 20
}) => {
    const [selected, setSelected] = useState<number[]>(selectedIds)
    const [viewMode, setViewMode] = useState<ViewMode>('all')
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
    const [loadingSelected, setLoadingSelected] = useState(false)
    
    // Синхронизация с внешними изменениями
    useEffect(() => {
        setSelected(selectedIds)
    }, [selectedIds])
    
    // Получаем товары для режима "Выбранные"
    useEffect(() => {
        if (viewMode === 'selected' && selectedIds.length > 0) {
            const hasSelectedData = selectedProducts.length > 0 && 
                selectedProducts.every(p => selectedIds.includes(p.id))
            
            if (!hasSelectedData && onViewSelected) {
                onViewSelected(viewMode)
            }
        }
    }, [viewMode, selectedIds, selectedProducts, onViewSelected])
    
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
        if (selected.length === 0) return
        if (!confirm('Удалить все выбранные товары?')) return
        setSelected([])
        onChange([])
    }
    
    const isSelected = (productId: number) => selected.includes(productId)
    
    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode)
        if (onViewSelected) {
           onViewSelected(mode)
        }
    }
    
    // Определяем какие товары показывать
    const displayProducts = useMemo(() => {
        if (viewMode === 'selected') {
            return products.filter(p => selectedIds.includes(p.id))
        }
        return products
    }, [products, selectedIds, viewMode])
    
    const selectedCount = selected.length
    const totalPages = Math.ceil(total / pageSize)
    
    return (
        <div className={s.container}>
            {/* Поиск и переключатели */}
            <div className={s.header}>
                <div className={s.searchWrapper}>
                    <SearchWithList
                        val={searchQuery}
                        searchCallback={onSearch}
                        selectList={() => {}}
                       
                    />
                </div>
                
                <div className={s.headerControls}>
                    {showViewSelected && (
                        <div className={s.viewToggle}>
                            <button
                                className={`${s.viewBtn} ${viewMode === 'all' ? s.active : ''}`}
                                onClick={() => handleViewModeChange('all')}
                            >
                                Все ({total})
                            </button>
                            <button
                                className={`${s.viewBtn} ${viewMode === 'selected' ? s.active : ''}`}
                                onClick={() => handleViewModeChange('selected')}
                            >
                                Выбранные ({selectedCount})
                            </button>
                        </div>
                    )}
                    <span className={s.count}>
                        {selectedCount} / {maxItems}
                    </span>
                </div>
            </div>
            
            {/* Индикатор режима "Выбранные" */}
            {viewMode === 'selected' && (
                <div className={s.selectedModeIndicator}>
                    <span>📌 Показываются только выбранные товары</span>
                    <button onClick={() => handleViewModeChange('all')}>
                        Показать все ({total})
                    </button>
                </div>
            )}
            
            {/* Список товаров */}
            <div className={s.productsGrid}>
                {isLoading || loadingSelected ? (
                    <div className={s.loader}>Загрузка...</div>
                ) : displayProducts.length === 0 ? (
                    <div className={s.empty}>
                        {viewMode === 'selected' 
                            ? 'Нет выбранных товаров' 
                            : 'Товары не найдены'}
                    </div>
                ) : (
                    displayProducts.map((product) => {
                        const selected = isSelected(product.id)
                        return (
                            <div
                                key={product.id}
                                className={`${s.productItem} ${selected ? s.selected : ''}`}
                                onClick={() => toggleProduct(product.id)}
                            >
                                <input
                                    type={multiple ? 'checkbox' : 'radio'}
                                    checked={selected}
                                    onChange={() => {}}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {product.image_path ? (
                                    <img src={product.image_path} alt={product.name} />
                                ) : (
                                    <div className={s.noImage}>📦</div>
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
                                {selected && (
                                    <span className={s.checkmark}>✓</span>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
            
            {/* Пагинация */}
            {viewMode === 'all' && totalPages > 1 && (
                <div className={s.paginationWrapper}>
                    <PageController
                        currentPosition={currentPage}
                        positions={totalPages}
                        callback={onPageChange}
                        seenPage={3}
                    />
                </div>
            )}
            
            {/* Футер */}
            <div className={s.footer}>
                <div className={s.footerLeft}>
                    <span className={s.selectedCount}>
                        Выбрано: <strong>{selectedCount}</strong>
                        {total > 0 && viewMode === 'all' && ` (всего: ${total})`}
                    </span>
                    {viewMode === 'all' && (
                        <span className={s.pageInfo}>
                            Страница {currentPage} из {totalPages}
                        </span>
                    )}
                </div>
                
                <div className={s.footerActions}>
                    {selectedCount > 0 && (
                        <button 
                            className={s.clearBtn} 
                            onClick={clearAll}
                        >
                            ✕ Очистить все
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProductSelector
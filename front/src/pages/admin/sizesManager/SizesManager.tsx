// pages/admin/SizeManagement/AdminSizeManagement.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Search from 'src/components/search/Search';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';
import { 
    getSizes, 
    getSizeProducts, 
    deleteSize, 
    deleteSizeFromProduct,
    renameSize,
    SizeInfo,
    SizeProduct 
} from 'src/providers/adminSizeProvider';
import s from './style.module.css';

const AdminSizeManagement: React.FC = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [sizes, setSizes] = useState<SizeInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalSizes, setTotalSizes] = useState(0);
    const [selectedSize, setSelectedSize] = useState<SizeInfo | null>(null);
    const [sizeProducts, setSizeProducts] = useState<SizeProduct[]>([]);
    const [showSizeProducts, setShowSizeProducts] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [sizeToDelete, setSizeToDelete] = useState<string | null>(null);
    const [sizeToRename, setSizeToRename] = useState<SizeInfo | null>(null);
    const [newSizeName, setNewSizeName] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [renameError, setRenameError] = useState('');
    const limit = 20;

    const loadSizes = useCallback(async (page: number = currentPage) => {
        setLoading(true);
        try {
            const data = await getSizes(searchQuery, page, limit);
            setSizes(data.sizes || []);
            setTotalSizes(data.total || 0);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error loading sizes:', error);
        } finally {
            setLoading(false);
            dispatch(finishLoading());
        }
    }, [searchQuery, dispatch]);

    useEffect(() => {
        loadSizes(1);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadSizes(1);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadSizes(page);
    };

    const handleDeleteSize = (sizeKey: string) => {
        const size = sizes.find(s => s.size_key === sizeKey);
        if (!size) return;
        setSizeToDelete(sizeKey);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteSize = async () => {
        if (!sizeToDelete) return;
        
        setDeleting(true);
        try {
            const result = await deleteSize(sizeToDelete);
            await loadSizes(currentPage);
            setShowDeleteConfirm(false);
            setSizeToDelete(null);
            alert(`Размер "${sizeToDelete}" удален у ${result.affectedProducts} товаров`);
        } catch (error) {
            console.error('Error deleting size:', error);
            alert('Ошибка при удалении размера');
        } finally {
            setDeleting(false);
        }
    };

    const handleRenameSize = (size: SizeInfo) => {
        setSizeToRename(size);
        setNewSizeName(size.size_key);
        setRenameError('');
        setShowRenameModal(true);
    };

    const confirmRenameSize = async () => {
        if (!sizeToRename) return;
        
        const trimmedName = newSizeName.trim();
        if (!trimmedName) {
            setRenameError('Название размера не может быть пустым');
            return;
        }

        if (trimmedName === sizeToRename.size_key) {
            setShowRenameModal(false);
            return;
        }

        // Проверяем, не существует ли уже такой размер
        if (sizes.some(s => s.size_key === trimmedName)) {
            setRenameError(`Размер "${trimmedName}" уже существует`);
            return;
        }

        setRenaming(true);
        setRenameError('');
        try {
            await renameSize(sizeToRename.size_key, trimmedName);
            setShowRenameModal(false);
            await loadSizes(currentPage);
            alert(`Размер "${sizeToRename.size_key}" переименован в "${trimmedName}"`);
        } catch (error: any) {
            console.error('Error renaming size:', error);
            setRenameError(error.response?.data?.error || 'Ошибка при переименовании размера');
        } finally {
            setRenaming(false);
        }
    };

    const handleOpenSizeProducts = async (size: SizeInfo) => {
        try {
            const data = await getSizeProducts(size.size_key);
            setSelectedSize(size);
            setSizeProducts(data.products || []);
            setShowSizeProducts(true);
        } catch (error) {
            console.error('Error loading size products:', error);
            alert('Ошибка при загрузке товаров');
        }
    };

    const handleDeleteSizeFromProduct = async (productId: number, sizeKey: string) => {
        if (!confirm(`Удалить размер "${sizeKey}" у товара?`)) return;
        
        try {
            await deleteSizeFromProduct(productId, sizeKey);
            const data = await getSizeProducts(sizeKey);
            setSizeProducts(data.products || []);
            await loadSizes(currentPage);
            alert('Размер удален у товара');
        } catch (error) {
            console.error('Error removing size from product:', error);
            alert('Ошибка при удалении размера');
        }
    };

    const formatPrice = (price: number) => {
        return price ? price.toLocaleString() + ' ₽' : '—';
    };

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2>📏 Управление размерами</h2>
                <div className={s.searchWrapper}>
                    <Search
                        val={searchQuery}
                        searchCallback={(value) => setSearchQuery(value)}
                        placeholder="Поиск размеров..."
                    />
                </div>
            </div>

            <div className={s.stats}>
                <span>📊 Всего размеров: <strong>{totalSizes}</strong></span>
                <span>📦 Всего товаров: <strong>{sizes.reduce((acc, size) => acc + size.product_count, 0)}</strong></span>
                <span>📈 Общее количество: <strong>{sizes.reduce((acc, size) => acc + size.total_quantity, 0)}</strong></span>
            </div>

            <div className={s.tableWrapper}>
                <table className={s.sizesTable}>
                    <thead>
                        <tr>
                            <th>Размер</th>
                            <th>Товаров</th>
                            <th>Количество</th>
                            <th>Средняя цена</th>
                            <th>Диапазон цен</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className={s.loadingCell}>Загрузка...</td>
                            </tr>
                        ) : sizes.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={s.emptyCell}>
                                    {searchQuery ? 'Размеры не найдены' : 'Нет размеров'}
                                </td>
                            </tr>
                        ) : (
                            sizes.map(size => (
                                <tr key={size.size_key} className={s.sizeRow}>
                                    <td className={s.sizeKey}>{size.size_key}</td>
                                    <td>{size.product_count}</td>
                                    <td>{size.total_quantity}</td>
                                    <td>{formatPrice(size.avg_price)}</td>
                                    <td>
                                        {size.min_price === size.max_price 
                                            ? formatPrice(size.min_price)
                                            : `${formatPrice(size.min_price)} - ${formatPrice(size.max_price)}`
                                        }
                                    </td>
                                    <td className={s.actions}>
                                        <button 
                                            className={s.viewBtn}
                                            onClick={() => handleOpenSizeProducts(size)}
                                        >
                                            📋 Просмотр
                                        </button>
                                        <button 
                                            className={s.renameBtn}
                                            onClick={() => handleRenameSize(size)}
                                        >
                                            ✏️ Переименовать
                                        </button>
                                        <button 
                                            className={s.deleteBtn}
                                            onClick={() => handleDeleteSize(size.size_key)}
                                        >
                                            🗑️ Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className={s.pagination}>
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        ←
                    </button>
                    <span>{currentPage} / {totalPages}</span>
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        →
                    </button>
                </div>
            )}

            {/* Модальное окно с товарами */}
            {showSizeProducts && selectedSize && (
                <div className={s.modalOverlay} onClick={() => setShowSizeProducts(false)}>
                    <div className={s.modalPanel} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>Товары с размером "{selectedSize.size_key}"</h3>
                            <button onClick={() => setShowSizeProducts(false)}>✕</button>
                        </div>
                        <div className={s.sizeInfo}>
                            <span>📦 Товаров: <strong>{selectedSize.product_count}</strong></span>
                            <span>📈 Количество: <strong>{selectedSize.total_quantity}</strong></span>
                            <span>💰 Средняя цена: <strong>{formatPrice(selectedSize.avg_price)}</strong></span>
                        </div>
                        <div className={s.productList}>
                            {sizeProducts.length === 0 ? (
                                <div className={s.emptyList}>Нет товаров с этим размером</div>
                            ) : (
                                sizeProducts.map(product => (
                                    <div key={product.id} className={s.productItem}>
                                        <div 
                                            className={s.productInfo}
                                            onClick={() => router.push(`/admin/products/${product.id}`)}
                                        >
                                            <span className={s.productName}>{product.name}</span>
                                            {product.article && (
                                                <span className={s.productArticle}>Арт: {product.article}</span>
                                            )}
                                            <span className={s.productFirm}>{product.firm}</span>
                                            <span className={s.productPrice}>{formatPrice(product.price)}</span>
                                            <span className={s.productQuantity}>×{product.quantity}</span>
                                            <span className={`${s.productStock} ${product.in_stock ? s.inStock : s.outOfStock}`}>
                                                {product.in_stock ? '✅ В наличии' : '❌ Нет'}
                                            </span>
                                        </div>
                                        <button 
                                            className={s.removeSizeBtn}
                                            onClick={() => handleDeleteSizeFromProduct(product.id, selectedSize.size_key)}
                                            title="Удалить размер у товара"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно переименования */}
            {showRenameModal && sizeToRename && (
                <div className={s.modalOverlay} onClick={() => setShowRenameModal(false)}>
                    <div className={s.renameModal} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>✏️ Переименовать размер</h3>
                            <button onClick={() => setShowRenameModal(false)}>✕</button>
                        </div>
                        <div className={s.renameContent}>
                            <div className={s.renameField}>
                                <label>Старое название:</label>
                                <input 
                                    type="text" 
                                    value={sizeToRename.size_key} 
                                    disabled 
                                    className={s.oldNameInput}
                                />
                            </div>
                            <div className={s.renameField}>
                                <label>Новое название:</label>
                                <input 
                                    type="text" 
                                    value={newSizeName} 
                                    onChange={(e) => {
                                        setNewSizeName(e.target.value);
                                        setRenameError('');
                                    }}
                                    placeholder="Введите новое название размера"
                                    className={s.newNameInput}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') confirmRenameSize();
                                        if (e.key === 'Escape') setShowRenameModal(false);
                                    }}
                                />
                            </div>
                            {renameError && (
                                <div className={s.renameError}>{renameError}</div>
                            )}
                            <div className={s.renameInfo}>
                                ⚠️ Размер будет переименован у <strong>{sizeToRename.product_count}</strong> товаров
                            </div>
                        </div>
                        <div className={s.renameActions}>
                            <button 
                                className={s.cancelBtn} 
                                onClick={() => setShowRenameModal(false)}
                            >
                                Отмена
                            </button>
                            <button 
                                className={s.renameConfirmBtn} 
                                onClick={confirmRenameSize}
                                disabled={renaming || !newSizeName.trim() || newSizeName.trim() === sizeToRename.size_key}
                            >
                                {renaming ? 'Переименование...' : 'Переименовать'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно подтверждения удаления */}
            {showDeleteConfirm && sizeToDelete && (
                <div className={s.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
                    <div className={s.confirmModal} onClick={e => e.stopPropagation()}>
                        <h3>⚠️ Удалить размер "{sizeToDelete}"?</h3>
                        <p>
                            Размер будет удален у всех товаров. 
                            {sizes.find(s => s.size_key === sizeToDelete)?.product_count > 0 && 
                                ` Будет затронуто ${sizes.find(s => s.size_key === sizeToDelete)?.product_count} товаров.`
                            }
                        </p>
                        <p className={s.warning}>
                            💡 Если у товара останется только этот размер, он будет заменен на "no_size"
                        </p>
                        <div className={s.confirmActions}>
                            <button 
                                className={s.confirmDeleteBtn} 
                                onClick={confirmDeleteSize}
                                disabled={deleting}
                            >
                                {deleting ? 'Удаление...' : 'Да, удалить'}
                            </button>
                            <button 
                                className={s.cancelBtn} 
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSizeManagement;
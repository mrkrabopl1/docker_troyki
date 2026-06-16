// src/pages/admin/BrandsManager/AdminBrandsManager.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import SearchWithList from 'src/modules/searchWithList/SearchWithList';
import FirmForm from 'src/modules/admin/firmForm/FirmForm';
import DiscountManager from 'src/modules/admin/discountManager/DiscountManager';
import s from './style.module.css';
import Combobox from 'src/components/combobox/Combobox';
import NumInput from 'src/components/input/NumInput';
import { finishLoading } from 'src/store/reducers/loadingSlice'
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import {
    updateBrandData,
    getBrandsStats,
    bulkUpdateBrandSortOrder,
    bulkUpdateBrandActive
} from 'src/providers/adminProductsProvider';
import {
    getDiscountRules,
    bulkAddRuleItems
} from 'src/providers/adminProvider';
import Scroller from 'src/components/scroller/Scroller';

type BulkAction = 'none' | 'discount' | 'sort_order' | 'active';
type SelectMode = 'none' | 'page' | 'all';

const AdminBrandsManager: React.FC = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBrands, setTotalBrands] = useState(0);
    const [sortField, setSortField] = useState('sort_order');
    const [sortDirection, setSortDirection] = useState('asc');
    const activeCount = useRef(0);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [draggedBrand, setDraggedBrand] = useState<any>(null);

    // Mass management
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkAction, setBulkAction] = useState<BulkAction>('none');
    const [selectMode, setSelectMode] = useState<SelectMode>('none');
    const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
    const [excludedBrandIds, setExcludedBrandIds] = useState<number[]>([]);
    const [allRules, setAllRules] = useState<any[]>([]);
    const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
    const [selectedSortOrder, setSelectedSortOrder] = useState(0);
    const [selectedActive, setSelectedActive] = useState<boolean | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState<string | null>(null);

    const pageSize = 20;
    const searchTimeoutRef = useRef<any>();

    const loadBrands = useCallback(async () => {
        setLoading(true);
        try {
            let sortType = 0;
            if (sortField && sortDirection) {
                const sortMap: Record<string, Record<string, number>> = {
                    name: { asc: 1, desc: 2 },
                    sort_order: { asc: 3, desc: 4 },
                    total_products: { asc: 5, desc: 6 },
                    created_at: { asc: 7, desc: 8 },
                    lines_count: { asc: 9, desc: 10 },
                    is_active: { asc: 11, desc: 12 },
                    brand_discount_percent: { asc: 13, desc: 14 }
                };
                sortType = sortMap[sortField]?.[sortDirection] || 0;
            }

            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('pageSize', pageSize.toString());
            if (searchQuery) params.append('name', searchQuery);
            if (sortType > 0) params.append('sortType', sortType.toString());

            const data = await getBrandsStats(params);
            dispatch(finishLoading());
            setBrands(data.brands || data || []);
            setTotalBrands(data.total_count || 0);
            activeCount.current = data.active_count || 0;
            setTotalPages(Math.ceil((data.total_count || 0) / pageSize));
        } catch (error) {
            console.error('Error loading brands:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, sortField, sortDirection, currentPage]);

    const loadAllRules = async () => {
        try {
            const data = await getDiscountRules(1, 100);
            setAllRules(data.rules || []);
        } catch (error) {
            console.error('Error loading rules:', error);
        }
    };

    useEffect(() => {
        loadBrands();
    }, [loadBrands]);

    useEffect(() => {
        if (bulkMode && bulkAction === 'discount') loadAllRules();
    }, [bulkMode, bulkAction]);

    const handleSearch = (value: string) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery(value);
            setCurrentPage(1);
        }, 300);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleUpdateBrand = async (formData: FormData) => {
        if (!selectedBrand) return;
        setFormLoading(true);
        try {
            await updateBrandData(selectedBrand.id, formData);
            await loadBrands();
            setShowEditModal(false);
            setSelectedBrand(null);
        } catch (error) {
            console.error('Error updating brand:', error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleActive = async (brand: any) => {
        try {
            const formData = new FormData();
            // formData.append('is_active', !brand.is_active);
            await updateBrandData(brand.id, { 'is_active': !brand.is_active });
            await loadBrands();
        } catch (error) {
            console.error('Error toggling brand active:', error);
        }
    };
    const sortOrderTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());
    const toggleTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

    // Debounce для sort order с numInput
    const handleSortOrderChange = useCallback(async (brandId: number, value: number) => {
        // Очищаем предыдущий таймер для этого бренда
        if (sortOrderTimers.current.has(brandId)) {
            clearTimeout(sortOrderTimers.current.get(brandId));
        }

        // Устанавливаем новый таймер
        const timer = setTimeout(async () => {
            try {
                await updateBrandData(brandId, { sort_order: value });
                await loadBrands();
                // Удаляем таймер после выполнения
                sortOrderTimers.current.delete(brandId);
            } catch (error) {
                console.error('Error updating sort order:', error);
                sortOrderTimers.current.delete(brandId);
            }
        }, 500); // 500ms debounce

        sortOrderTimers.current.set(brandId, timer);
    }, [loadBrands, updateBrandData]);
    // ---- Selection helpers ----
    const isBrandSelected = (brandId: number) => {
        if (selectMode === 'all') {
            return !excludedBrandIds.includes(brandId);
        }
        return selectedBrandIds.includes(brandId);
    };

    const toggleBrandSelection = (brandId: number) => {
        if (selectMode === 'all') {
            setExcludedBrandIds(prev =>
                prev.includes(brandId)
                    ? prev.filter(id => id !== brandId)
                    : [...prev, brandId]
            );
        } else {
            setSelectedBrandIds(prev =>
                prev.includes(brandId)
                    ? prev.filter(id => id !== brandId)
                    : [...prev, brandId]
            );
        }
    };

    const getSelectedCount = () => {
        if (selectMode === 'all') {
            return totalBrands - excludedBrandIds.length;
        }
        return selectedBrandIds.length;
    };

    const toggleAllBrands = () => {
        if (selectMode === 'none') {
            // Select current page
            setSelectedBrandIds(brands.map((b: any) => b.id));
            setSelectMode('page');
        } else if (selectMode === 'page' && totalBrands > pageSize) {
            // Select all matching the current search
            setSelectMode('all');
            setSelectedBrandIds([]);
            setExcludedBrandIds([]);
        } else {
            // Deselect all
            setSelectMode('none');
            setSelectedBrandIds([]);
            setExcludedBrandIds([]);
        }
    };

    const enterBulkMode = (action: BulkAction) => {
        setBulkMode(true);
        setBulkAction(action);
        setSelectMode('none');
        setSelectedBrandIds([]);
        setExcludedBrandIds([]);
        setBulkResult(null);
        setSelectedRuleId(null);
        setSelectedSortOrder(0);
        setSelectedActive(null);
    };

    const exitBulkMode = () => {
        setBulkMode(false);
        setBulkAction('none');
        setSelectMode('none');
        setSelectedBrandIds([]);
        setExcludedBrandIds([]);
        setBulkResult(null);
        setSelectedRuleId(null);
        setSelectedSortOrder(0);
        setSelectedActive(null);
    };

    const handleBulkApply = async () => {
        const selectedCount = getSelectedCount();
        if (selectedCount === 0) return;
        setBulkLoading(true);
        setBulkResult(null);
        try {
            // Build payload based on selection mode
            const basePayload = selectMode === 'all'
                ? { select_all: true, search: searchQuery, exclude_ids: excludedBrandIds }
                : { ids: selectedBrandIds };

            if (bulkAction === 'discount' && selectedRuleId) {
                // bulkAddRuleItems expects item_type and item_ids. For 'all' mode we pass the whole payload.
                await bulkAddRuleItems(selectedRuleId, {
                    item_type: 'brand',
                    ...basePayload
                });
                setBulkResult(`Скидка применена к ${selectedCount} брендам`);
            } else if (bulkAction === 'sort_order') {
                await bulkUpdateBrandSortOrder(basePayload, selectedSortOrder);
                setBulkResult(`Приоритет обновлён у ${selectedCount} брендов`);
            } else if (bulkAction === 'active' && selectedActive !== null) {
                await bulkUpdateBrandActive(basePayload, selectedActive);
                setBulkResult(`Активность обновлена у ${selectedCount} брендов`);
            }
            await loadBrands();
        } catch (error) {
            console.error('Error bulk operation:', error);
            setBulkResult('Ошибка при выполнении операции');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleDragStart = (brand: any) => setDraggedBrand(brand);
    const handleDragOver = (e: React.DragEvent, targetBrand: any) => {
        e.preventDefault();
        if (!draggedBrand || draggedBrand.id === targetBrand.id) return;
        const row = e.currentTarget as HTMLElement;
        const rect = row.getBoundingClientRect();
        const y = e.clientY - rect.top;
        row.classList.remove(s.dropAbove, s.dropBelow);
        row.classList.add(y < rect.height / 2 ? s.dropAbove : s.dropBelow);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).classList.remove(s.dropAbove, s.dropBelow);
    };
    const handleDrop = async (e: React.DragEvent, targetBrand: any) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).classList.remove(s.dropAbove, s.dropBelow);
        if (!draggedBrand || draggedBrand.id === targetBrand.id) return;
        setDraggedBrand(null);
    };
    const handleDragEnd = () => {
        setDraggedBrand(null);
        document.querySelectorAll(`.${s.brandRow}`).forEach(row => {
            row.classList.remove(s.dropAbove, s.dropBelow);
        });
    };


    const handleApdateSoloSortOrder = useCallback(() => {

    }, [])

    const SortableHeader: React.FC<{ field: string; children: React.ReactNode }> = ({ field, children }) => (
        <th className={s.sortableHeader} onClick={() => handleSort(field)}>
            {children}
            {sortField === field && (
                <span className={s.sortIndicator}>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
            )}
        </th>
    );

    return (
        <div className={s.container}>
            <div className={s.header}>
                <div className={s.titleSection}>
                    <h2>Управление брендами</h2>
                    <span className={s.stats}>
                        Всего брендов: {totalBrands} | Активных: {activeCount.current}
                    </span>
                </div>
            </div>

            {/* Bulk action buttons */}
            <div className={s.bulkPanel}>
                {!bulkMode ? (
                    <div className={s.bulkButtons}>
                        <button className={`${s.bulkButton} ${s.bulkButtonDiscount}`} onClick={() => enterBulkMode('discount')}>
                            <span className={s.bulkButtonIcon}>🏷️</span>Скидка
                        </button>
                        <button className={`${s.bulkButton} ${s.bulkButtonStatus}`} onClick={() => enterBulkMode('sort_order')}>
                            <span className={s.bulkButtonIcon}>📋</span>Приоритет
                        </button>
                        <button className={`${s.bulkButton} ${s.bulkButtonActive}`} onClick={() => enterBulkMode('active')}>
                            <span className={s.bulkButtonIcon}>👁️</span>Активность
                        </button>
                    </div>
                ) : (
                    <div className={s.bulkControls}>
                        <span className={s.bulkInfo}>
                            Выбрано: {getSelectedCount()} из {totalBrands}
                        </span>

                        {bulkAction === 'discount' && (
                            <Combobox
                                data={allRules.reduce((acc, rule, i) => {
                                    acc[i] = `${rule.name} (${rule.discount_type === 'percentage' ? `-${rule.discount_value}%` : `-${rule.discount_value}₽`})`;
                                    return acc;
                                }, {} as Record<number, string>)}
                                placeholder="Выберите правило"
                                currentIndex={allRules.findIndex(r => r.id === selectedRuleId)}
                                onChangeIndex={(index) => setSelectedRuleId(allRules[Number(index)]?.id || null)}
                                width={280}
                            />
                        )}

                        {bulkAction === 'sort_order' && (
                            <NumInput min={0} max={999} value={selectedSortOrder} onChange={setSelectedSortOrder} />
                        )}

                        {bulkAction === 'active' && (
                            <Combobox
                                data={{ 0: 'Активен', 1: 'Неактивен' }}
                                placeholder="Выберите"
                                currentIndex={selectedActive === null ? -1 : (selectedActive ? 0 : 1)}
                                onChangeIndex={(index) => setSelectedActive(Number(index) === 0)}
                                width={180}
                            />
                        )}

                        <div className={s.bulkActions}>
                            <button className={s.bulkApplyBtn} onClick={handleBulkApply} disabled={
                                getSelectedCount() === 0 || bulkLoading ||
                                (bulkAction === 'discount' && !selectedRuleId) ||
                                (bulkAction === 'active' && selectedActive === null)
                            }>Применить</button>
                            <button className={s.bulkCancelBtn} onClick={exitBulkMode}>Отмена</button>
                        </div>

                        {bulkResult && (
                            <span className={`${s.bulkResult} ${bulkResult.includes('Ошибка') ? s.error : s.success}`}>
                                {bulkResult}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Select all banners */}
            {bulkMode && selectMode === 'none' && (
                <div className={s.selectAllBanner}>
                    <button onClick={toggleAllBrands} className={s.selectAllLink}>
                        Выбрать бренды на странице
                    </button>
                </div>
            )}
            {bulkMode && selectMode === 'page' && totalBrands > pageSize && (
                <div className={s.selectAllBanner}>
                    <span>Выбрано {selectedBrandIds.length} брендов на странице</span>
                    <button onClick={toggleAllBrands} className={s.selectAllLink}>
                        Выбрать все {totalBrands} брендов
                    </button>
                </div>
            )}
            {bulkMode && selectMode === 'all' && (
                <div className={s.selectAllBanner}>
                    <span>Выбраны все {getSelectedCount()} брендов</span>
                    <button onClick={toggleAllBrands} className={s.selectAllLink}>
                        Очистить выбор
                    </button>
                </div>
            )}

            <div className={s.controlsBar}>
                <SearchWithList val={searchQuery} searchCallback={handleSearch} />
            </div>

            <div className={s.tableWrapper}>
                <table className={s.brandsTable}>
                    <thead>
                        <tr>
                            {bulkMode && (
                                <th style={{ width: 40 }}>
                                    <input
                                        type="checkbox"
                                        checked={selectMode !== 'none'}
                                        onChange={toggleAllBrands}
                                        ref={input => {
                                            if (input) input.indeterminate = selectMode === 'page';
                                        }}
                                    />
                                </th>
                            )}
                            <th style={{ width: 60 }}>Изобр.</th>
                            <SortableHeader field="name">Название</SortableHeader>
                            <th>Страна</th>
                            <SortableHeader field="total_products">Товары</SortableHeader>
                            <SortableHeader field="lines_count">Линейки</SortableHeader>
                            <SortableHeader field="sort_order">Порядок</SortableHeader>
                            <SortableHeader field="is_active">Активность</SortableHeader>
                            <SortableHeader field="brand_discount_percent">Скидка</SortableHeader>
                            <th style={{ width: bulkMode ? 60 : 100 }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={bulkMode ? 11 : 10} className={s.loadingCell}>Загрузка...</td></tr>
                        ) : brands.length === 0 ? (
                            <tr><td colSpan={bulkMode ? 11 : 10} className={s.emptyCell}>
                                {searchQuery ? 'Бренды не найдены' : 'Нет добавленных брендов'}
                            </td></tr>
                        ) : (
                            brands.map((brand: any) => (
                                <tr
                                    key={brand.id}
                                    className={`${s.brandRow} ${!brand.is_active ? s.inactive : ''} ${draggedBrand?.id === brand.id ? s.dragging : ''}`}
                                    draggable={!bulkMode}
                                    onDragStart={() => !bulkMode && handleDragStart(brand)}
                                    onDragOver={(e) => !bulkMode && handleDragOver(e, brand)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => !bulkMode && handleDrop(e, brand)}
                                    onDragEnd={handleDragEnd}
                                >
                                    {bulkMode && (
                                        <td onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isBrandSelected(brand.id)}
                                                onChange={() => toggleBrandSelection(brand.id)}
                                            />
                                        </td>
                                    )}
                                    <td data-label="Фото" className={s.imageCell} onClick={() => !bulkMode && router.push("/admin/brands/" + brand.id)} style={{ cursor: bulkMode ? 'default' : 'pointer' }}>
                                        {brand.image_path ? <img src={brand.image_path} alt={brand.name} /> : <div className={s.noImage}>—</div>}
                                    </td>
                                    <td data-label="Название" className={s.nameCell} onClick={() => !bulkMode && router.push("/admin/brands/" + brand.id)} style={{ cursor: bulkMode ? 'default' : 'pointer' }}>
                                        <div className={s.brandName}>{brand.name}</div>
                                    </td>
                                    <td data-label="Страна">{brand.country || '—'}</td>
                                    <td data-label="Товары" className={s.productsCell}><span className={s.totalProducts}>{brand.total_products}</span></td>
                                    <td data-label="Линейки" className={s.linesCell}>{brand.lines_count > 0 ? brand.lines_count : '—'}</td>
                                    <td data-label="Порядок сортировки" className={s.sortOrderCell}>
                                        <NumInput disabled={bulkMode} value={brand.sort_order || 0} min={0} max={100} onChange={(val) => { handleSortOrderChange(brand.id, val) }} />
                                    </td>
                                    <td data-label="Статус" onClick={e => e.stopPropagation()}>
                                        <button className={`${s.statusToggle} ${brand.is_active ? s.active : s.inactive}`} onClick={() => handleToggleActive(brand)} disabled={bulkMode}>
                                            {brand.is_active ? '✓' : '✕'}
                                        </button>
                                    </td>
                                    <td data-label="Скидка" className={s.discountCell}>
                                        {brand.brand_discount_percent ? (
                                            <span className={s.discountBadge}>-{brand.brand_discount_percent}%</span>
                                        ) : <span className={s.noDiscount}>—</span>}
                                    </td>
                                    <td data-label="Действия" className={s.actionsCell} onClick={e => e.stopPropagation()}>
                                        {!bulkMode && (
                                            <>
                                                <button className={s.actionBtn} onClick={() => { setSelectedBrand(brand); setShowDiscountModal(true); }} title="Скидки">%</button>
                                                <button className={s.actionBtn} onClick={() => { setSelectedBrand(brand); setShowEditModal(true); }} title="Редактировать">✎</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className={s.pagination}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>←</button>
                    <span>{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>→</button>
                </div>
            )}

            <Modal active={showEditModal} onChange={() => { setShowEditModal(false); setSelectedBrand(null); }}>
                <Scroller onlyVertical={true} className={s.scrollStyle}>
                    <div className={s.firmModalContent}>
                        <FirmForm initialData={selectedBrand} onSubmit={handleUpdateBrand} onCancel={() => { setShowEditModal(false); setSelectedBrand(null); }} isLoading={formLoading} />
                    </div>
                </Scroller>
            </Modal>

            <Modal active={showDiscountModal} onChange={() => { setShowDiscountModal(false); setSelectedBrand(null); }}>
                {selectedBrand && (
                    <div style={{ display: "inline-block" }} onClick={e => e.stopPropagation()}>
                        <DiscountManager
                            entityType="brand" entityId={selectedBrand.id} entityName={selectedBrand.name}
                            onClose={() => { setShowDiscountModal(false); setSelectedBrand(null); loadBrands(); }}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminBrandsManager;
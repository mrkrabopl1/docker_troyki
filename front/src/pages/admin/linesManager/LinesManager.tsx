// src/pages/admin/LinesManager/AdminLinesManager.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import SearchWithList from 'src/modules/searchWithList/SearchWithList';
import LineForm from 'src/modules/admin/lineForm/LineForm';
import DiscountManager from 'src/modules/admin/discountManager/DiscountManager';
import s from './style.module.css';
import Combobox from 'src/components/combobox/Combobox';
import NumInput from 'src/components/input/NumInput';
import PageController from 'src/components/contentSlider/slidersSwitchers/PageController';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch, useAppSelector, useNavigate } from 'src/store/hooks/redux';
import {
    updateLineData,
    getLinesStats,
    bulkUpdateLineSortOrder,
    bulkUpdateLineActive,
    createLine,
    deleteLine,
    getAllLines,
} from 'src/providers/adminLinesProvider';
import {
    getDiscountRules,
    bulkAddRuleItems
} from 'src/providers/adminProvider';
import Scroller from 'src/components/scroller/Scroller';
import SearchableCheckboxColumn from 'src/modules/columnWithSerch/SearchableCheckboxColumn';

type BulkAction = 'none' | 'discount' | 'sort_order' | 'active' | 'delete';
type SelectMode = 'none' | 'page' | 'all';

const AdminLinesManager: React.FC = () => {
    const router = useRouter();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    
    // Получаем данные из Redux
    const firmMap = useAppSelector(state => state.menu.firmMap);
    const collections = useAppSelector(state => state.menu.collections);
    
    const [lines, setLines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLines, setTotalLines] = useState(0);
    const [sortField, setSortField] = useState('sort_order');
    const [sortDirection, setSortDirection] = useState('asc');
    const activeCount = useRef(0);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [selectedLine, setSelectedLine] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [draggedLine, setDraggedLine] = useState<any>(null);

    // Mass management
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkAction, setBulkAction] = useState<BulkAction>('none');
    const [selectMode, setSelectMode] = useState<SelectMode>('none');
    const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);
    const [excludedLineIds, setExcludedLineIds] = useState<number[]>([]);
    const [allRules, setAllRules] = useState<any[]>([]);
    const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
    const [selectedSortOrder, setSelectedSortOrder] = useState(0);
    const [selectedActive, setSelectedActive] = useState<boolean | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState<string | null>(null);
    const [brandFilter, setBrandFilter] = useState<number[]>([]);
    const [showBrandFilter, setShowBrandFilter] = useState(false);

    const pageSize = 20;
    const searchTimeoutRef = useRef<any>();

    // Формируем список брендов из Redux (только те, у которых есть линии)
    const brands = useMemo(() => {
        const brandsList: any[] = [];
        
        Object.entries(collections).forEach(([firmName, lines]) => {
            // Находим бренд по имени в firmMap
            const brandEntry = Object.values(firmMap).find(
                (firm: any) => firm.name === firmName
            );
            
            if (brandEntry && Object.keys(lines).length > 0) {
                brandsList.push({
                    id: brandEntry.id,
                    name: firmName,
                    slug: brandEntry.slug,
                    linesCount: Object.keys(lines).length
                });
            }
        });
        
        return brandsList;
    }, [collections, firmMap]);

    const loadLines = useCallback(async () => {
        setLoading(true);
        try {
            let sortType = 0;
            if (sortField && sortDirection) {
                const sortMap: Record<string, Record<string, number>> = {
                    name: { asc: 1, desc: 2 },
                    sort_order: { asc: 3, desc: 4 },
                    total_products: { asc: 5, desc: 6 },
                    created_at: { asc: 7, desc: 8 },
                    is_active: { asc: 9, desc: 10 },
                    discount_percent: { asc: 11, desc: 12 },
                    brand_name: { asc: 13, desc: 14 }
                };
                sortType = sortMap[sortField]?.[sortDirection] || 0;
            }

            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('pageSize', pageSize.toString());
            if (searchQuery) params.append('name', searchQuery);
            if (brandFilter.length > 0) {
                params.append('brand_ids', brandFilter.join(','));
            }
            if (sortType > 0) params.append('sortType', sortType.toString());

            const data = await getLinesStats(params);
            dispatch(finishLoading());
            setLines(data.lines || data || []);
            setTotalLines(data.total_count || 0);
            activeCount.current = data.active_count || 0;
            setTotalPages(Math.ceil((data.total_count || 0) / pageSize));
        } catch (error) {
            console.error('Error loading lines:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, sortField, sortDirection, currentPage, brandFilter]);

    const loadAllRules = async () => {
        try {
            const data = await getDiscountRules(1, 100);
            setAllRules(data.rules || []);
        } catch (error) {
            console.error('Error loading rules:', error);
        }
    };

    useEffect(() => {
        loadLines();
    }, [loadLines]);

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

    const handleUpdateLine = async (formData: FormData) => {
        if (!selectedLine) return;
        setFormLoading(true);
        try {
            await updateLineData(selectedLine.id, formData);
            await loadLines();
            setShowEditModal(false);
            setSelectedLine(null);
        } catch (error) {
            console.error('Error updating line:', error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleCreateLine = async (formData: FormData) => {
        setFormLoading(true);
        try {
            await createLine(formData);
            await loadLines();
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating line:', error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteLine = async (lineId: number) => {
        if (!confirm('Вы уверены, что хотите удалить эту линейку?')) return;
        try {
            await deleteLine(lineId);
            await loadLines();
        } catch (error) {
            console.error('Error deleting line:', error);
        }
    };

    const handleToggleActive = async (line: any) => {
        try {
            await updateLineData(line.id, { is_active: !line.is_active });
            await loadLines();
        } catch (error) {
            console.error('Error toggling line active:', error);
        }
    };

    const sortOrderTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

    const handleSortOrderChange = useCallback(async (lineId: number, value: number) => {
        if (sortOrderTimers.current.has(lineId)) {
            clearTimeout(sortOrderTimers.current.get(lineId));
        }

        const timer = setTimeout(async () => {
            try {
                await updateLineData(lineId, { sort_order: value });
                await loadLines();
                sortOrderTimers.current.delete(lineId);
            } catch (error) {
                console.error('Error updating sort order:', error);
                sortOrderTimers.current.delete(lineId);
            }
        }, 500);

        sortOrderTimers.current.set(lineId, timer);
    }, [loadLines]);

    // ---- Selection helpers ----
    const isLineSelected = (lineId: number) => {
        if (selectMode === 'all') {
            return !excludedLineIds.includes(lineId);
        }
        return selectedLineIds.includes(lineId);
    };

    const toggleLineSelection = (lineId: number) => {
        if (selectMode === 'all') {
            setExcludedLineIds(prev =>
                prev.includes(lineId)
                    ? prev.filter(id => id !== lineId)
                    : [...prev, lineId]
            );
        } else {
            setSelectedLineIds(prev =>
                prev.includes(lineId)
                    ? prev.filter(id => id !== lineId)
                    : [...prev, lineId]
            );
        }
    };

    const getSelectedCount = () => {
        if (selectMode === 'all') {
            return totalLines - excludedLineIds.length;
        }
        return selectedLineIds.length;
    };

    const toggleAllLines = () => {
        if (selectMode === 'none') {
            setSelectedLineIds(lines.map((l: any) => l.id));
            setSelectMode('page');
        } else if (selectMode === 'page' && totalLines > pageSize) {
            setSelectMode('all');
            setSelectedLineIds([]);
            setExcludedLineIds([]);
        } else {
            setSelectMode('none');
            setSelectedLineIds([]);
            setExcludedLineIds([]);
        }
    };

    const enterBulkMode = (action: BulkAction) => {
        setBulkMode(true);
        setBulkAction(action);
        setSelectMode('none');
        setSelectedLineIds([]);
        setExcludedLineIds([]);
        setBulkResult(null);
        setSelectedRuleId(null);
        setSelectedSortOrder(0);
        setSelectedActive(null);
    };

    const exitBulkMode = () => {
        setBulkMode(false);
        setBulkAction('none');
        setSelectMode('none');
        setSelectedLineIds([]);
        setExcludedLineIds([]);
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
            const basePayload = selectMode === 'all'
                ? { select_all: true, search: searchQuery, exclude_ids: excludedLineIds }
                : { ids: selectedLineIds };

            if (bulkAction === 'discount' && selectedRuleId) {
                await bulkAddRuleItems(selectedRuleId, {
                    item_type: 'line',
                    ...basePayload
                });
                setBulkResult(`Скидка применена к ${selectedCount} линейкам`);
            } else if (bulkAction === 'sort_order') {
                await bulkUpdateLineSortOrder(basePayload, selectedSortOrder);
                setBulkResult(`Приоритет обновлён у ${selectedCount} линеек`);
            } else if (bulkAction === 'active' && selectedActive !== null) {
                await bulkUpdateLineActive(basePayload, selectedActive);
                setBulkResult(`Активность обновлена у ${selectedCount} линеек`);
            } else if (bulkAction === 'delete') {
                let deleted = 0;
                const ids = selectMode === 'all' 
                    ? lines.filter(l => !excludedLineIds.includes(l.id)).map(l => l.id)
                    : selectedLineIds;
                for (const id of ids) {
                    try {
                        await deleteLine(id);
                        deleted++;
                    } catch (e) {
                        console.error(`Failed to delete line ${id}:`, e);
                    }
                }
                setBulkResult(`Удалено ${deleted} линеек`);
            }
            await loadLines();
        } catch (error) {
            console.error('Error bulk operation:', error);
            setBulkResult('Ошибка при выполнении операции');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleDragStart = (line: any) => setDraggedLine(line);
    const handleDragOver = (e: React.DragEvent, targetLine: any) => {
        e.preventDefault();
        if (!draggedLine || draggedLine.id === targetLine.id) return;
        const row = e.currentTarget as HTMLElement;
        const rect = row.getBoundingClientRect();
        const y = e.clientY - rect.top;
        row.classList.remove(s.dropAbove, s.dropBelow);
        row.classList.add(y < rect.height / 2 ? s.dropAbove : s.dropBelow);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).classList.remove(s.dropAbove, s.dropBelow);
    };
    const handleDrop = async (e: React.DragEvent, targetLine: any) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).classList.remove(s.dropAbove, s.dropBelow);
        if (!draggedLine || draggedLine.id === targetLine.id) return;
        setDraggedLine(null);
    };
    const handleDragEnd = () => {
        setDraggedLine(null);
        document.querySelectorAll(`.${s.lineRow}`).forEach(row => {
            row.classList.remove(s.dropAbove, s.dropBelow);
        });
    };

    const handleBrandFilterChange = useCallback((selectedIds: (string | number)[]) => {
        const ids = selectedIds.map(id => Number(id));
        setBrandFilter(ids);
        setCurrentPage(1);
    }, []);

    const SortableHeader: React.FC<{ field: string; children: React.ReactNode }> = ({ field, children }) => (
        <th className={s.sortableHeader} onClick={() => handleSort(field)}>
            {children}
            {sortField === field && (
                <span className={s.sortIndicator}>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
            )}
        </th>
    );

    // Подготовка данных для SearchableCheckboxColumn из Redux
    const brandCheckboxData = useMemo(() => {
        return brands.map((b: any) => ({
            id: b.id,
            name: b.name,
            enable:true,
            activeData: brandFilter.includes(b.id)
        }));
    }, [brands, brandFilter]);

    return (
        <div className={s.container}>
            <div className={s.header}>
                <div className={s.titleSection}>
                    <h2>Управление линейками</h2>
                    <span className={s.stats}>
                        Всего линеек: {totalLines} | Активных: {activeCount.current}
                    </span>
                </div>
                <div className={s.headerActions}>
                    <Button text={"+ Добавить линейку"} onClick={() => setShowCreateModal(true)} />
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
                        <button className={`${s.bulkButton} ${s.bulkButtonDelete}`} onClick={() => enterBulkMode('delete')}>
                            <span className={s.bulkButtonIcon}>🗑️</span>Удалить
                        </button>
                    </div>
                ) : (
                    <div className={s.bulkControls}>
                        <span className={s.bulkInfo}>
                            Выбрано: {getSelectedCount()} из {totalLines}
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

                        {bulkAction === 'delete' && (
                            <span className={s.bulkWarning}>
                                ⚠️ Вы уверены? Удаление необратимо.
                            </span>
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
                    <button onClick={toggleAllLines} className={s.selectAllLink}>
                        Выбрать линейки на странице
                    </button>
                </div>
            )}
            {bulkMode && selectMode === 'page' && totalLines > pageSize && (
                <div className={s.selectAllBanner}>
                    <span>Выбрано {selectedLineIds.length} линеек на странице</span>
                    <button onClick={toggleAllLines} className={s.selectAllLink}>
                        Выбрать все {totalLines} линеек
                    </button>
                </div>
            )}
            {bulkMode && selectMode === 'all' && (
                <div className={s.selectAllBanner}>
                    <span>Выбраны все {getSelectedCount()} линеек</span>
                    <button onClick={toggleAllLines} className={s.selectAllLink}>
                        Очистить выбор
                    </button>
                </div>
            )}

            <div className={s.controlsBar}>
                <div className={s.controlsRow}>
                    <div className={s.searchWrapper}>
                        <SearchWithList val={searchQuery} searchCallback={handleSearch} />
                    </div>
                    <div className={s.filterWrapper}>
                        <div className={s.brandFilterContainer}>
                            <button 
                                className={s.brandFilterToggle}
                                onClick={() => setShowBrandFilter(!showBrandFilter)}
                            >
                                <span>Фильтр по брендам</span>
                                <span className={s.brandFilterCount}>
                                    {brandFilter.length > 0 ? `(${brandFilter.length})` : ''}
                                </span>
                                <span className={s.brandFilterArrow}>
                                    {showBrandFilter ? '▲' : '▼'}
                                </span>
                            </button>
                            {showBrandFilter && (
                                <div className={s.brandFilterDropdown}>
                                    <SearchableCheckboxColumn
                                        data={brandCheckboxData}
                                        onChange={handleBrandFilterChange}
                                        searchPlaceholder="Поиск бренда..."
                                        maxHeight={300}
                                        minHeight={100}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={s.tableWrapper}>
                <table className={s.linesTable}>
                    <thead>
                        <tr>
                            {bulkMode && (
                                <th style={{ width: 40 }}>
                                    <input
                                        type="checkbox"
                                        checked={selectMode !== 'none'}
                                        onChange={toggleAllLines}
                                        ref={input => {
                                            if (input) input.indeterminate = selectMode === 'page';
                                        }}
                                    />
                                </th>
                            )}
                            <th style={{ width: 60 }}>Изобр.</th>
                            <SortableHeader field="name">Название</SortableHeader>
                            <SortableHeader field="brand_name">Бренд</SortableHeader>
                            <th>Сезон</th>
                            <SortableHeader field="total_products">Товары</SortableHeader>
                            <SortableHeader field="sort_order">Порядок</SortableHeader>
                            <SortableHeader field="is_active">Активность</SortableHeader>
                            <SortableHeader field="discount_percent">Скидка</SortableHeader>
                            <th style={{ width: bulkMode ? 60 : 120 }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={bulkMode ? 11 : 10} className={s.loadingCell}>Загрузка...</td></tr>
                        ) : lines.length === 0 ? (
                            <tr><td colSpan={bulkMode ? 11 : 10} className={s.emptyCell}>
                                {searchQuery ? 'Линейки не найдены' : 'Нет добавленных линеек'}
                            </td></tr>
                        ) : (
                            lines.map((line: any) => (
                                <tr
                                    key={line.id}
                                    className={`${s.lineRow} ${!line.is_active ? s.inactive : ''} ${draggedLine?.id === line.id ? s.dragging : ''}`}
                                    draggable={!bulkMode}
                                    onDragStart={() => !bulkMode && handleDragStart(line)}
                                    onDragOver={(e) => !bulkMode && handleDragOver(e, line)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => !bulkMode && handleDrop(e, line)}
                                    onDragEnd={handleDragEnd}
                                >
                                    {bulkMode && (
                                        <td onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isLineSelected(line.id)}
                                                onChange={() => toggleLineSelection(line.id)}
                                            />
                                        </td>
                                    )}
                                    <td data-label="Фото" className={s.imageCell} onClick={() => !bulkMode && navigate("/admin/lines/" + line.id)} style={{ cursor: bulkMode ? 'default' : 'pointer' }}>
                                        {line.image_path ? <img src={line.image_path} alt={line.name} /> : <div className={s.noImage}>—</div>}
                                    </td>
                                    <td data-label="Название" className={s.nameCell} onClick={() => !bulkMode && navigate("/admin/lines/" + line.id)} style={{ cursor: bulkMode ? 'default' : 'pointer' }}>
                                        <div className={s.lineName}>{line.name}</div>
                                    </td>
                                    <td data-label="Бренд" className={s.brandCell}>
                                        <span className={s.brandTag}>{line.brand_name || '—'}</span>
                                    </td>
                                    <td data-label="Сезон">{line.season || '—'}</td>
                                    <td data-label="Товары" className={s.productsCell}>
                                        <span className={s.totalProducts}>{line.total_products || 0}</span>
                                    </td>
                                    <td data-label="Порядок" className={s.sortOrderCell}>
                                        <NumInput disabled={bulkMode} value={line.sort_order || 0} min={0} max={100} onChange={(val) => { handleSortOrderChange(line.id, val) }} />
                                    </td>
                                    <td data-label="Статус" onClick={e => e.stopPropagation()}>
                                        <button className={`${s.statusToggle} ${line.is_active ? s.active : s.inactive}`} onClick={() => handleToggleActive(line)} disabled={bulkMode}>
                                            {line.is_active ? '✓' : '✕'}
                                        </button>
                                    </td>
                                    <td data-label="Скидка" className={s.discountCell}>
                                        {line.discount_percent ? (
                                            <span className={s.discountBadge}>-{line.discount_percent}%</span>
                                        ) : <span className={s.noDiscount}>—</span>}
                                    </td>
                                    <td data-label="Действия" className={s.actionsCell} onClick={e => e.stopPropagation()}>
                                        {!bulkMode && (
                                            <>
                                                <button className={s.actionBtn} onClick={() => { setSelectedLine(line); setShowDiscountModal(true); }} title="Скидки">%</button>
                                                <button className={s.actionBtn} onClick={() => { setSelectedLine(line); setShowEditModal(true); }} title="Редактировать">✎</button>
                                                <button className={`${s.actionBtn} ${s.deleteBtn}`} onClick={() => handleDeleteLine(line.id)} title="Удалить">🗑</button>
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
                <PageController currentPosition={currentPage}
                    positions={totalPages}
                    callback={setCurrentPage} />
            )}

            <Modal active={showEditModal} onChange={() => { setShowEditModal(false); setSelectedLine(null); }}>
                <Scroller onlyVertical={true} className={s.scrollStyle}>
                    <div className={s.lineModalContent}>
                        <LineForm 
                            initialData={selectedLine} 
                            onSubmit={handleUpdateLine} 
                            onCancel={() => { setShowEditModal(false); setSelectedLine(null); }} 
                            isLoading={formLoading} 
                        />
                    </div>
                </Scroller>
            </Modal>

            <Modal active={showCreateModal} onChange={() => setShowCreateModal(false)}>
                <Scroller onlyVertical={true} className={s.scrollStyle}>
                    <div className={s.lineModalContent}>
                        <LineForm 
                            onSubmit={handleCreateLine} 
                            onCancel={() => setShowCreateModal(false)} 
                            isLoading={formLoading} 
                        />
                    </div>
                </Scroller>
            </Modal>

            <Modal active={showDiscountModal} onChange={() => { setShowDiscountModal(false); setSelectedLine(null); }}>
                {selectedLine && (
                    <div style={{ display: "inline-block" }} onClick={e => e.stopPropagation()}>
                        <DiscountManager
                            entityType="line" entityId={selectedLine.id} entityName={selectedLine.name}
                            onClose={() => { setShowDiscountModal(false); setSelectedLine(null); loadLines(); }}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminLinesManager;
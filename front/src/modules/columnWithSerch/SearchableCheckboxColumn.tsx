import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { List, RowComponentProps } from 'react-window';
import Search from 'src/components/search/Search';
import { CheckBoxType } from 'src/types/modules';
import s from "./style.module.css";

interface SearchableCheckboxColumnProps {
    data: CheckBoxType[];
    onChange?: (selectedIds: (string | number)[]) => void;
    searchPlaceholder?: string;
    className?: string;
    itemHeight?: number;
    overscanCount?: number;
    maxHeight?: number; // Максимальная высота, по умолчанию 300px
    minHeight?: number; // Минимальная высота, по умолчанию 50px
}

// Компонент строки
const CheckboxRow = ({ 
    index, 
    style,
    data,
    selectedIds,
    onToggle
}: RowComponentProps & {
    data: CheckBoxType[];
    selectedIds: Set<string | number>;
    onToggle: (id: string | number) => void;
}) => {
    const item = data[index];
    if (!item) return null;

    return (
        <div style={style}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '4px 8px',
                height: '100%',
                boxSizing: 'border-box'
            }}>
                <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => onToggle(item.id)}
                    style={{ marginRight: '8px' }}
                />
                <span>{item.name}</span>
            </div>
        </div>
    );
};

const SearchableCheckboxColumn: React.FC<SearchableCheckboxColumnProps> = ({
    data,
    onChange,
    searchPlaceholder = "Search...",
    className,
    itemHeight = 40,
    overscanCount = 5,
    maxHeight = 300,
    minHeight = 50,
}) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const listRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Инициализация из данных
    useEffect(() => {
        const initial = new Set<string | number>();
        data.forEach(item => {
            if (item.activeData) initial.add(item.id);
        });
        setSelectedIds(initial);
    }, [data]);

    // Фильтр по поиску
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;
        return data.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    // Функция для скролла наверх
    const scrollToTop = useCallback(() => {
        if (listRef.current) {
            if (typeof listRef.current.scrollTo === 'function') {
                listRef.current.scrollTo(0);
            } else if (typeof listRef.current.scrollToItem === 'function') {
                listRef.current.scrollToItem(0);
            } else if (listRef.current._listRef) {
                listRef.current._listRef.scrollTop = 0;
            }
        }
    }, []);

    // Сброс скролла при изменении фильтра
    useEffect(() => {
        scrollToTop();
    }, [filteredData, scrollToTop]);

    // Обработчик изменения чекбокса
    const handleToggle = useCallback((id: string | number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            
            if (onChange) {
                onChange(Array.from(newSet));
            }
            
            return newSet;
        });
    }, [onChange]);

    // Выбрать все
    const handleSelectAll = useCallback(() => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            filteredData.forEach(item => newSet.add(item.id));
            
            if (onChange) {
                onChange(Array.from(newSet));
            }
            
            return newSet;
        });
    }, [filteredData, onChange]);

    // Снять все
    const handleDeselectAll = useCallback(() => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            filteredData.forEach(item => newSet.delete(item.id));
            
            if (onChange) {
                onChange(Array.from(newSet));
            }
            
            return newSet;
        });
    }, [filteredData, onChange]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
    }, []);

    const selectedCount = useMemo(() => {
        return filteredData.filter(item => selectedIds.has(item.id)).length;
    }, [filteredData, selectedIds]);

    // Вычисляем высоту списка на основе количества элементов
    const listHeight = useMemo(() => {
        const itemsCount = filteredData.length;
        if (itemsCount === 0) {
            return Math.max(minHeight, 50); // Минимальная высота для пустого списка
        }
        
        // Высота контента
        const contentHeight = itemsCount * itemHeight;
        
        // Добавляем небольшой отступ для пограничных случаев
        const minHeightWithPadding = minHeight;
        
        // Ограничиваем максимальной высотой
        const calculatedHeight = Math.min(
            Math.max(contentHeight, minHeightWithPadding),
            maxHeight
        );
        
        return calculatedHeight;
    }, [filteredData, itemHeight, maxHeight, minHeight]);

    const rowProps = useMemo(() => ({
        data: filteredData,
        selectedIds,
        onToggle: handleToggle
    }), [filteredData, selectedIds, handleToggle]);

    return (
        <div className={className}>
            <div style={{ padding: "15px 15px 15px 0" }}>
                <Search
                    val={searchTerm}
                    searchCallback={handleSearchChange}
                    onChange={handleSearchChange}
                    placeholder={searchPlaceholder}
                />
            </div>
            {/* <div style={{ display: 'flex', gap: '10px', padding: '0 0 10px 0' }}>
                <button onClick={handleSelectAll} className={s.selectAllBtn}>
                    Выбрать все
                </button>
                <button onClick={handleDeselectAll} className={s.deselectAllBtn}>
                    Снять все
                </button>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>
                    {selectedCount} из {filteredData.length} выбрано
                </span>
            </div> */}
            
            <div 
                ref={containerRef}
                style={{ 
                    height: `${listHeight}px`,
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    transition: 'height 0.2s ease' // Плавное изменение высоты
                }}
            >
                {filteredData.length > 0 ? (
                    <List
                        onScroll={e=>e.stopPropagation()}
                        onWheel={e=>e.stopPropagation()}
                        listRef={listRef}
                        rowComponent={CheckboxRow}
                        rowCount={filteredData.length}
                        rowHeight={itemHeight}
                        rowProps={rowProps}
                        overscanCount={overscanCount}
                        style={{ height: '100%', width: '100%' }}
                    />
                ) : (
                    <div style={{ 
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px',
                        textAlign: 'center',
                        color: '#999'
                    }}>
                        {searchTerm ? `Ничего не найдено для "${searchTerm}"` : 'Нет данных'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(SearchableCheckboxColumn);
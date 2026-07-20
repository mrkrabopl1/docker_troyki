import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Search from 'src/components/search/Search';
import CheckBoxColumn from 'src/components/checkBoxForm/CheckBoxForm';
import Scroller, { ScrollerRef } from 'src/components/scroller/Scroller';
import { CheckBoxType } from 'src/types/modules';
import s from "./style.module.css";

interface SearchableCheckboxColumnProps {
    data: CheckBoxType[];
    onChange?: (selectedIds: (string | number)[]) => void;
    searchPlaceholder?: string;
    className?: string;
}

const SearchableCheckboxColumn: React.FC<SearchableCheckboxColumnProps> = ({
    data,
    onChange,
    searchPlaceholder = "Search...",
    className,
}) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    
    // Создаем ref для Scroller
    const scrollerRef = useRef<ScrollerRef>(null);

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

    // Данные для CheckBoxColumn с актуальными состояниями
    const filteredDataWithStates = useMemo(() => {
        return filteredData.map(item => ({
            ...item,
            activeData: selectedIds.has(item.id)
        }));
    }, [filteredData, selectedIds]);

    // Обработчик изменения чекбоксов
    const handleCheckboxChange = useCallback((updatedFilteredData: CheckBoxType[]) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            updatedFilteredData.forEach(item => {
                if (item.activeData) newSet.add(item.id);
                else newSet.delete(item.id);
            });
            
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

    const handleSearchCallback = useCallback((value: string) => setSearchTerm(value), []);
    
    // Обработчик поиска - сбрасываем скролл наверх
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
        // Сбрасываем скролл наверх при поиске
        if (scrollerRef.current) {
            scrollerRef.current.scrollToTop();
        }
    }, []);

    // Сбрасываем скролл при изменении filteredData (например, при поиске)
    useEffect(() => {
        if (scrollerRef.current) {
            scrollerRef.current.scrollToTop();
        }
    }, [filteredData]);

    return (
        <div className={className}>
            <div style={{ padding: "15px 15px 15px 0" }}>
                <Search
                    val={searchTerm}
                    // onDataRecieve={() => {}}
                    searchCallback={handleSearchCallback}
                    onChange={handleSearchChange}
                    placeholder={searchPlaceholder}
                />
            </div>
            <div style={{ display: 'flex', gap: '10px', padding: '0 0 10px 0' }}>
                <button onClick={handleSelectAll} className={s.selectAllBtn}>
                    Выбрать все
                </button>
                <button onClick={handleDeselectAll} className={s.deselectAllBtn}>
                    Снять все
                </button>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>
                    {filteredData.length} элементов
                </span>
            </div>
            <Scroller 
                ref={scrollerRef}
                maxHeight={200}
            >
                <div>
                    <CheckBoxColumn
                        data={filteredDataWithStates}
                        onChange={handleCheckboxChange}
                    />
                </div>
            </Scroller>
            {filteredData.length === 0 && searchTerm && (
                <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>
                    Ничего не найдено для "{searchTerm}"
                </div>
            )}
        </div>
    );
};

export default React.memo(SearchableCheckboxColumn);
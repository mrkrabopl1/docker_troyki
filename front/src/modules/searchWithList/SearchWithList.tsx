import React, { useRef, useState, useCallback, memo } from 'react';
import Search from '../../components/search/Search';
import DropDownList from '../../components/DropDownList';
import MerchLine from '../merchField/MerchLine';

interface SearchWithListProps {
    className?: {
        main?: string;
        search?: string;
        dropList?: string;
    };
    searchCallback: (data: any) => void;
    onDataRecieve?: (data: any) => void;
    onChange?: (value: string) => void;
    val?: string;
    selectList?: (data: any) => void;
}

interface MerchItem {
    name: string;
    img: string;
    id: string;
    firm: string;
    price: string;
    [key: string]: any;
}

const SearchWithList: React.FC<SearchWithListProps> = memo(({
    className = {},
    val,
    onDataRecieve,
    searchCallback,
    onChange,
    selectList
}) => {
    const trottlingTimerId = useRef<NodeJS.Timeout | null>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const [dropDownListData, setDropDownList] = useState<React.ReactElement[]>([]);
    const [activeList, setActive] = useState(false);

    const handleSelect = useCallback((data: any) => {
        selectList?.(data);
    }, [selectList]);

    const createDropList = useCallback((data: MerchItem[]) => {
        onDataRecieve?.(data);
        setDropDownList(
            data.map((value) => (
                <MerchLine 
                    key={`${value.id}-${value.name}`} 
                    onChange= {handleSelect }
                    {...value}
                />
            ))
        );
    }, [onDataRecieve, handleSelect]);

    const handleFocus = useCallback(() => {
        setTimeout(() => setActive(true), 0);
    }, []);

    const handleBlur = useCallback((e: React.FocusEvent) => {
        if (!mainRef.current?.contains(e.relatedTarget as Node)) {
            setActive(false);
        }
    }, []);

    const handleSearch = useCallback((data: any) => {
        setActive(false);
        searchCallback(data);
    }, [searchCallback]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    return (
        <div 
            ref={mainRef}
            onBlur={handleBlur}
            onClick={handleClick}
            style={{ position: "relative" }}
            className={className.main}
        >
            <Search
                className={className.search}
                val={val}
                onChange={onChange}
                onFocus={handleFocus}
                searchCallback={handleSearch}
                onDataRecieve={createDropList}
            />
            <DropDownList 
                className={className.dropList} 
                active={activeList}
            >
                {dropDownListData}
            </DropDownList>
        </div>
    );
});

export default memo(SearchWithList);
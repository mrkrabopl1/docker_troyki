// SearchableCheckboxColumn.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Search from 'src/components/search/Search';
import CheckBoxColumn from 'src/components/checkBoxForm/CheckBoxForm';
import Scroller from 'src/components/scroller/Scroller';

interface CheckBoxType {
    enable: boolean;
    activeData: boolean;
    name: string;
}

interface SearchableCheckboxColumnProps {
    data: CheckBoxType[];
    onChange?: (data: boolean[]) => void;
    searchPlaceholder?: string;
    className?: string;
    searchThreshold?: number;
}

const SearchableCheckboxColumn: React.FC<SearchableCheckboxColumnProps> = ({
    data,
    onChange,
    searchPlaceholder = "Search...",
    className,
    searchThreshold = 5
}) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredData, setFilteredData] = useState<CheckBoxType[]>(data);
    const [checkboxStates, setCheckboxStates] = useState<boolean[]>([]);

    // Initialize checkbox states
    useEffect(() => {
        setCheckboxStates(data.map(item => item.activeData));
    }, [data]);

    // Filter data based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredData(data);
        } else {
            const filtered = data.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, data]);

    const handleSearchDataReceive = useCallback((searchResults: any) => {
        // This callback receives data from searchNames API
        // You can implement additional logic here if needed
        console.log('Search results:', searchResults);
    }, []);

    const handleSearchCallback = useCallback((searchValue: string) => {
        // This is called when Enter is pressed or search button is clicked
        setSearchTerm(searchValue);
    }, []);

    const handleSearchChange = useCallback((value: string) => {
        // Real-time search as user types (debounced already in Search component)
        setSearchTerm(value);
    }, []);

    const handleCheckboxChange = useCallback((newStates: boolean[]) => {
        setCheckboxStates(newStates);
        onChange?.(newStates);
    }, [onChange]);

    // Get current states for filtered items
    const getFilteredStates = useMemo(() => {
        return filteredData.map(item => item.activeData);
    }, [filteredData]);

    return (
        <div className={className}>
            <div style={{ padding: "15px  15px  15px 0" }}>
                <Search
                    val={searchTerm}
                    onDataRecieve={handleSearchDataReceive}
                    searchCallback={handleSearchCallback}
                    onChange={handleSearchChange}
                    placeholder={searchPlaceholder}
                />
            </div>
            <Scroller maxHeight={200}>
                <div style={{ marginTop: '16px' }}>
                    <CheckBoxColumn
                        data={filteredData}
                        onChange={handleCheckboxChange}
                    />
                </div>
            </Scroller>
            {filteredData.length === 0 && searchTerm && (
                <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>
                    No results found for "{searchTerm}"
                </div>
            )}
        </div>
    );
};

export default React.memo(SearchableCheckboxColumn);
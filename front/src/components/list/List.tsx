import React, { useCallback,memo } from 'react';

interface ListProps {
    rows: string[];
    onChange: (data: string) => void;
    className?: string;
}

const List: React.FC<ListProps> = ({ rows, onChange, className = '' }) => {
    const handleRowClick = useCallback((row: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(row);
    }, [onChange]);

    return (
        <div role="list">
            {rows.map((row, index) => (
                <div 
                    key={`${row}-${index}`}
                    className={className} 
                    onClick={handleRowClick(row)}
                    role="listitem"
                >
                    {row}
                </div>
            ))}
        </div>
    );
};

export default memo(List);
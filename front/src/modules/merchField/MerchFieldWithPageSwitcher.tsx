import React, { useMemo } from 'react';
import MerchBlock from "./MerchBlock";
import PageController from 'src/components/contentSlider/slidersSwitchers/PageController';
import s from "./style.module.css";

interface MerchInterface {
    name: string;
    imgs: string[];
    id: string;
    price: string;
    className?: string;
}

interface MerchFieldProps {
    heightRow?: number;
    pages: number;
    currentPage: number;
    className?: string;
    size: number;
    data: MerchInterface[];
    onChange: (page: number) => void;
}

const MerchFieldWithPageSwitcher: React.FC<MerchFieldProps> = ({
    data = [],
    size,
    className,
    pages,
    currentPage,
    onChange
}) => {
    const blockWidth = `${100 / size}%`;
    const heightClass = size === 3 ? s.gridHeight6 : s.gridHeight4;

    const rows = useMemo(() => {
        const result = [];
        const items = [...data];
        
        while (items.length > 0) {
            const rowItems = items.splice(0, size);
            const row = (
                <div 
                    key={`row-${items.length}`} 
                    className={className ? className : `${s.merchField} ${heightClass}`}
                >
                    {rowItems.map(item => (
                        <MerchBlock 
                            key={item.id} 
                            width={blockWidth} 
                            data={item} 
                        />
                    ))}
                </div>
            );
            result.push(row);
        }
        
        return result;
    }, [data, size, className, heightClass, blockWidth]);

    return (
        <div>
            <div className={s.globalMerchField}>
                {rows}
            </div>
            <PageController 
                currentPosition={currentPage} 
                positions={pages} 
                callback={onChange} 
            />
        </div>
    );
};

export default React.memo(MerchFieldWithPageSwitcher);
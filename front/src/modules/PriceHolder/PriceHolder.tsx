import React, { useState, useMemo, memo, useCallback } from 'react';
import PricesBlock from './PricesBlock';
import s from "./style.module.css";
import { useAppSelector } from 'src/store/hooks/redux';
import merchType from 'src/types/merchType';

type MerchType = merchType;
interface PriceHolderProps {
    elems: MerchType | null;
    onChange: (index: string) => void;
    activeInd?: number;
}

const PriceHolderComponent: React.FC<PriceHolderProps> = ({ 
    elems, 
    onChange, 
    activeInd = 0 
}) => {
    const [activeState, setActiveState] = useState<number>(activeInd);
    const priceState = useAppSelector(state => state.priceReducer);

    const handleActiveChange = useCallback((size: string,ind:number) => {
        onChange(size);
        setActiveState(ind);
    }, [onChange]);

    const priceBlocks = useMemo(() => {
        if (!elems) return [];
        
        return Object.entries(elems).map(([size,val], ind) => (
            <PricesBlock 
                key={`${size}-${ind}`} // Более уникальный ключ
                onChange={() => handleActiveChange(size,ind)}
                active={activeState === ind}
                size={size}
                price={val.price - (val.discount||0)}
                discount={val.discount}
                id={ind}
                in_stock={val.in_stock}
            />
        ));
    }, [elems, activeState, handleActiveChange]);

    return (
        <div className={s.priceHolder}>
            {priceBlocks}
        </div>
    );
};

export default memo(PriceHolderComponent);
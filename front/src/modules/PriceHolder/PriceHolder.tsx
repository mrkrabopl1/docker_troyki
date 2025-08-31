import React, { useState, useMemo, memo, useCallback } from 'react';
import PricesBlock from './PricesBlock';
import s from "./style.module.css";
import { useAppSelector } from 'src/store/hooks/redux';
import merchType from 'src/types/merchType';

type MerchType = merchType[];
interface PriceHolderProps {
    elems: MerchType | null;
    onChange: (index: number) => void;
    activeInd?: number;
}

const PriceHolderComponent: React.FC<PriceHolderProps> = ({ 
    elems, 
    onChange, 
    activeInd = 0 
}) => {
    const [activeState, setActiveState] = useState<number>(activeInd);
    const priceState = useAppSelector(state => state.priceReducer);

    const handleActiveChange = useCallback((ind: number) => {
        onChange(ind);
        setActiveState(ind);
    }, [onChange]);

    const priceBlocks = useMemo(() => {
        if (!elems) return [];
        
        return elems.map((val, ind) => (
            <PricesBlock 
                key={`${val.size}-${ind}`} // Более уникальный ключ
                onChange={() => handleActiveChange(ind)}
                active={activeState === ind}
                size={val.size}
                price={val.price - val.discount}
                discount={val.discount}
                id={ind}
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
import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'src/store/hooks/redux';
import s from "./style.module.css";
import ContentSliderWithSwitcher from 'src/components/contentSlider/ContentSliderWithSwitcher';
import CarouselSlider from 'src/components/contentSlider/CarouselSlider';

const FirmsScroller: React.FC = ({

}) => {
    const {  firms } = useAppSelector(state => state.menuReducer);
    const firmsLines = useMemo(() => {
        // Add a safety check
        if (!Array.isArray(firms) || firms.length === 0) {
            return []; // or return a placeholder
        }
        
        return firms.map(value => {
            return <img style={{"height":"100%"}} src={`/images/brandLogos/${value}/image.png`} alt="" key={value} />
        });
    }, [firms]);

    return (
        <div  className={s.wrap}>
                <CarouselSlider  items={firmsLines}/>
        </div>
    );
};

export default memo(FirmsScroller);
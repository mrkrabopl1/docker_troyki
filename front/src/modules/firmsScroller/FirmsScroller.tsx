import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from 'src/store/hooks/redux';
import s from "./style.module.css";
import ContentSliderWithSwitcher from 'src/components/contentSlider/ContentSliderWithSwitcher';
import CarouselSlider from 'src/components/contentSlider/CarouselSlider';

const FirmsScroller: React.FC = () => {
    const router = useRouter();
    const { firms } = useAppSelector(state => state.menuReducer);
    
    const firmsLines = useMemo(() => {
        if (!Array.isArray(firms) || firms.length === 0) {
            return [];
        }

        return firms.map(value => {
            return <img 
                onClick={() => router.push(`/collections/${value}`)} 
                style={{ "height": "100%", cursor: "pointer" }} 
                src={`/images/brandLogos/${value}/image.png`} 
                alt="" 
                key={value} 
            />
        });
    }, [firms, router]);

    return (
        <div className={s.wrap}>
            <CarouselSlider items={firmsLines} />
        </div>
    );
};

export default memo(FirmsScroller);
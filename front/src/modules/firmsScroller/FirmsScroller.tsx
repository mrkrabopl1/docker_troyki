import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from 'src/store/hooks/redux';
import s from "./style.module.css";
import ContentSliderWithSwitcher from 'src/components/contentSlider/ContentSliderWithSwitcher';
import CarouselSlider from 'src/components/contentSlider/CarouselSlider';

interface IFirmsScrollerProps {
    onChange?: (slug: string) => void;
}
const FirmsScroller: React.FC<IFirmsScrollerProps> = ({onChange}) => {
    const router = useRouter();
    const { firmMap } = useAppSelector(state => state.menu);
    
    const firmsLines = useMemo(() => {
       

        return Object.values(firmMap).map(value => {
            return <img 
                onClick={()=>onChange(value.slug)} 
                style={{ "height": "100%", cursor: "pointer" }} 
                src={`/images/brandLogos/${value.slug}/image.png`} 
                alt="" 
                key={value.slug} 
            />
        });
    }, [firmMap, router]);

    return (
        <div className={s.wrap}>
            <CarouselSlider items={firmsLines} />
        </div>
    );
};

export default memo(FirmsScroller);
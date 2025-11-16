import React, { memo, useMemo } from 'react';
import MerchBlock from "./MerchBlock";
import NameBorder from 'src/components/wraps/NameBorder';
import ContentSlider from 'src/components/contentSlider/ContentSliderWithScroll';
import s from "./style.module.css";


type MerchInfoType = {
    price: string;
    discount: number;
    name: string;
    imgs: string[];
    firm: string;
    id: string;
};

interface MerchInterface { 
    name: string;
    merchInfo: MerchInfoType[];
      onClick?: () => void;
}

const MerchSliderField: React.FC<MerchInterface> = memo(({ name, merchInfo,onClick }) => {
    const sliderContent = useMemo(() => 
        merchInfo.map(item => (
            <MerchBlock 
                key={item.id} // Лучше использовать id вместо name как ключ
                className={s.mbwd}  
                data={item} 
            />
        )),
        [merchInfo]
    );



    return (
        <div>
            <NameBorder 
                content={<ContentSlider className={s.gridHeight6} content={sliderContent} />} 
                name={name} 
                onClick={onClick}
            />
        </div>
    );
});

export default MerchSliderField;
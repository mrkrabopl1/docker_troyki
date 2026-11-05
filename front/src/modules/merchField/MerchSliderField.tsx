import React, { memo, useMemo } from 'react';
import MerchBlock from "./MerchBlock";
import NameBorder from 'src/components/wraps/NameBorder';
import ContentSlider from 'src/components/contentSlider/ContentSliderMixed';
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
            <h2 className={s.sliderHeader}>{name}</h2>
            {/* <ContentSlider className={s.gridHeight6} content={sliderContent} /> */}
            <ContentSlider className={s.gridHeight6} content={sliderContent} />
            {/* <NameBorder 
                content={<ContentSlider className={s.gridHeight6} content={sliderContent} />} 
                name={name} 
                onClick={onClick}
            /> */}
        </div>
    );
});

export default MerchSliderField;
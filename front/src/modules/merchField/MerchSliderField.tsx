import React, { memo, useMemo } from 'react';
import MerchBlock from "./MerchBlock";
import NameBorder from 'src/components/wraps/NameBorder';
import ContentSlider from 'src/components/contentSlider/ContentSliderWithControl';
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
}

const MerchSliderField: React.FC<MerchInterface> = memo(({ name, merchInfo }) => {
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
                content={<ContentSlider className="dependetHeight" content={sliderContent} />} 
                name={name} 
            />
        </div>
    );
});

export default MerchSliderField;
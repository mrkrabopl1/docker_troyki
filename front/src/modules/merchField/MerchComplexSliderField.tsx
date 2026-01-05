import React, { useEffect, useState, useMemo, memo,useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'src/store/hooks/redux';
import { getCollections, getHistoryInfo, getDiscontInfo, } from 'src/providers/merchProvider';
import { shuffle } from 'src/global';

import MerchSliderField from 'src/modules/merchField/MerchSliderField';

interface SliderData {
  [key: string]: any[];
}

interface BannerData {
  image: string;
  name: string;
  id: string;
}

const MAX_COLLECTIONS = 4;
const DISCOUNT_SIZE = 10;

const MerchComplexSliderFieldComponent: React.FC = () => {
  const navigate = useNavigate();
  const { collections } = useAppSelector(state => state.menuReducer);
  
  const [slidersData, setSlidersData] = useState<SliderData>({});
  const [merchHistoryFieldData, setMerchHistoryFieldData] = useState<any[]>([]);
  const [merchDiscountFieldData, setDiscountFieldData] = useState<any[]>([]);

  const handleBannerClick = useCallback((id: string) => {
    navigate(`/collections/${id}`);
  }, [navigate]);

  // Загрузка данных
  useEffect(() => {
    getHistoryInfo(setMerchHistoryFieldData);
    getDiscontInfo(DISCOUNT_SIZE, setDiscountFieldData);
  }, []);

  // Обработка коллекций
  useEffect(() => {
    if (!collections.length) return;
    
    const colLength = Math.min(MAX_COLLECTIONS, collections.length);
    if (colLength > 0) {
      const randomizeArr = [...collections];
      shuffle(randomizeArr);
      randomizeArr.length = colLength;

      getCollections({ 
        names: randomizeArr, 
        size: 8, 
        page: 1 
      }, setSlidersData);
    }
  }, [collections]);

  // Создание слайдеров
  const sliders = useMemo(() => {
    return Object.entries(slidersData).map(([sliderName, merchInfo]) => (
      <MerchSliderField 
        key={sliderName} 
        name={sliderName} 
        merchInfo={merchInfo} 
      />
    ));
  }, [slidersData]);

  return (
    <div style={{ position: "relative" }}>
      {sliders}
      {merchHistoryFieldData.length > 0 && (
        <MerchSliderField 
          name="Your history" 
          merchInfo={merchHistoryFieldData} 
        />
      )}
      {merchDiscountFieldData.length > 0 && (
        <MerchSliderField 
          name="With discount" 
          merchInfo={merchDiscountFieldData} 
        />
      )}
    </div>
  );
};

export default memo(MerchComplexSliderFieldComponent);
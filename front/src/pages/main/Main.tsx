import React, { memo, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'src/store/hooks/redux';
import { getHistoryInfo } from 'src/providers/merchProvider';
import MerchBanner from 'src/modules/merchBanner/MerchBanner';
import ContentSliderWithSwitcher from 'src/components/contentSlider/ContentSliderWithSwitcher';
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';
import s from "./s.module.css";
import {categories } from 'src/store/reducers/menuSlice';

import MerchSliderField from 'src/modules/merchField/MerchSliderField';
import { getMainPage } from 'src/providers/merchProvider';
import ContentSliderWithLinks from 'src/components/contentSlider/ContentSliderWithLinks';

interface BannerData {
  btnText: string;
  image: string;
  name: string;
  id: string;
}

const BANNER_TEXT = {
  text: ["Мы открылись", "Мероприятия"],
  subText: ["", ""],
  btnText: ["К коллекции", "К мероприятию"]
};

const Main: React.FC = memo(() => {
  const navigate = useNavigate();
  const { chousenName } = useAppSelector(state => state.complexDropReducer);
  const { categories } = useAppSelector(state => state.menuReducer);
  const [pageInfoData, setPageInfoData] = useState<any>({});
  const [bannerData, setBannerData] = useState<BannerData>({ 
    btnText: "", 
    image: "", 
    name: "", 
    id: "" 
  });
  let categoriesVal: any = useCallback(()=>{
    let val = {}
    Object.entries(categories).forEach(([id, data])=>{
      val[data.id] = {name:data.category_name, enum:id}
    })
    return val
    
  }, [categories]);
  const [merchHistoryFieldData, setMerchHistoryFieldData] = useState<any[]>([]);

  const handleBannerClick = useCallback((e) => {
    navigate(`/collections/${bannerData.id}`);
  }, [navigate]);

  useEffect(() => {
    getMainPage(setPageInfoData);useMemo
  }, []);


  const handleMainPageInfo = useMemo (() => {
    let val = categoriesVal();
    if(Object.keys(val).length === 0) return [];
    return Object.entries(pageInfoData).map(([key, value]: [string, any]) => {
      return (
        <MerchSliderField 
          name= {val[key].name}
          merchInfo={value.products} 
          onClick={()=>{
           navigate(`/search?category=${val[key].enum}&type=""`);
          }}
        />
      );
    })
  }, [pageInfoData, categories]);

  const createBanners = useCallback(() => {
    return BANNER_TEXT.btnText.map((btnText, i) => (
      <MerchBanner
        key={i}
        className={{
          main: s.mainBanner,
          button: s.buttonBanner,
          contentHolder: s.contentHolder
        }}
        btnText={btnText}
        onChange={handleBannerClick}
        title=""
        img={`/images/main/${i}.png`}
      />
    ));
  }, [handleBannerClick]);

  // useEffect(() => {
  //   getHistoryInfo(setMerchHistoryFieldData);
  // }, []);

  return (
    <div style={{ position: "relative" }}>
      <ContentSliderWithLinks
        
        content={createBanners()} 
      />
      <div>
        {handleMainPageInfo}
      </div>
    </div>
  );
});

export default Main;
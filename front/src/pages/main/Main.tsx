import React, { memo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'src/store/hooks/redux';
import { getHistoryInfo } from 'src/providers/merchProvider';
import MerchBanner from 'src/modules/merchBanner/MerchBanner';
import StickyDispetcherButton from 'src/modules/stickyDispetcherButton/StickyDispetcherButton';
import ContentSliderWithSwitcher from 'src/components/contentSlider/ContentSliderWithSwitcher';
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';
import s from "./s.module.css";

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
  const [bannerData, setBannerData] = useState<BannerData>({ 
    btnText: "", 
    image: "", 
    name: "", 
    id: "" 
  });
  const [merchHistoryFieldData, setMerchHistoryFieldData] = useState<any[]>([]);

  const handleBannerClick = useCallback((e) => {
    navigate(`/collections/${bannerData.id}`);
  }, [navigate]);

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
      <StickyDispetcherButton top="20%" left="80%" />
      <ContentSliderWithSwitcher 
        className={{ slider: s.sliderHolder }} 
        content={createBanners()} 
      />
      <MerchComplexSliderField />
    </div>
  );
});

export default Main;
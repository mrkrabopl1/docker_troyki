// src/pages/main/Main.tsx
import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux';
import MerchBanner from 'src/modules/merchBanner/MerchBanner';
import MerchSliderField from 'src/modules/merchField/MerchSliderField';
import ContentSliderWithLinks from 'src/components/contentSlider/ContentSliderWithLinks';
import FirmsScroller from 'src/modules/firmsScroller/FirmsScroller';
import InstagramScroller from 'src/modules/instagramScroller/InstagramScroller';
import { addImageToLoad, imageLoaded } from 'src/store/reducers/loadingSlice';
import s from "./s.module.css";

interface MainProps {
  initialData: {
    pageInfo: any;
    banners: any[];
    mainInfo: any;
  };
}

const Main: React.FC<MainProps> = memo(({ initialData }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { firmMap } = useAppSelector(state => state.menu);
  
  // Используем данные с сервера
  const [mainData] = useState({
    pageInfo: initialData?.pageInfo || {},
    banners: initialData?.banners || []
  });

  const handleBannerClick = useCallback((slug) => {
    router.push("collections/" + slug);
  }, [router]);

  // Загружаем изображения (клиент)
  useEffect(() => {
    if (mainData.banners.length > 0) {
      const bannerUrls = mainData.banners.map(b => b.image_url);
      dispatch(addImageToLoad(bannerUrls.length));
      bannerUrls.forEach(url => {
        const img = new Image();
        img.onload = () => dispatch(imageLoaded());
        img.onerror = () => dispatch(imageLoaded());
        img.src = url;
      });
    }
  }, [mainData.banners, dispatch]);

 

  const onFirmClicked = useCallback((firmName) => {
    const firm = Object.values(firmMap).find(f => f.name === firmName);
    if (firm) {
      router.push(`/search?brand=${firm.slug}`);
    }
  }, [firmMap]);

  const createBanners = useCallback(() => {
    return mainData.banners.map((btnVal, i) => (
      <MerchBanner
        key={i}
        className={{ main: s.mainBanner, button: s.buttonBanner, contentHolder: s.contentHolder }}
        btnText={btnVal.button_text}
        onChange={() => handleBannerClick(btnVal.collection_slug)}
        title={btnVal.title}
        img={btnVal.image_url}
      />
    ));
  }, [mainData.banners, handleBannerClick]);

  return (
    <div style={{ position: "relative" }}>
      <ContentSliderWithLinks content={createBanners()} />
      <FirmsScroller onChange={onFirmClicked} />
    </div>
  );
});

export default Main;
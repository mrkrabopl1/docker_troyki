import React, { memo, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux';
import { getHistoryInfo } from 'src/providers/merchProvider';
import MerchBanner from 'src/modules/merchBanner/MerchBanner';
import ContentSliderWithSwitcher from 'src/components/contentSlider/ContentSliderWithSwitcher';
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';
import s from "./s.module.css";
import { categories } from 'src/store/reducers/menuSlice';

import MerchSliderField from 'src/modules/merchField/MerchSliderField';
import { getMainPage } from 'src/providers/merchProvider';
import ContentSliderWithLinks from 'src/components/contentSlider/ContentSliderWithLinks';
import { getMainBanners } from 'src/providers/shopProvider';
import VideoWallpaper from 'src/components/styledWalpapers/videoWalpaper/VideoWalpaper';
import InfiniteRecursionViewport from 'src/components/styledWalpapers/doubleBacground/InfiniteRecursionViewport';
import BlobBackground from 'src/components/styledWalpapers/blobBackground/BlobBackground';
import ImageSlider from 'src/modules/imageSlider/ImageSlider';
import { finishLoading, startLoading } from 'src/store/reducers/loadingSlice';

import FirmsScroller from 'src/modules/firmsScroller/FirmsScroller';
interface BannerData {
  btnText: string;
  image: string;
  name: string;
  id: string;
}


const Main: React.FC = memo(() => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { chousenName } = useAppSelector(state => state.complexDropReducer);
  const { categories } = useAppSelector(state => state.menuReducer);
  const [mainData, setMainData] = useState({
  pageInfo: {},
  banners: []
});
  let categoriesVal: any = useCallback(() => {
    let val = {}
    Object.entries(categories).forEach(([id, data]) => {
      val[data.id] = { name: data.category_name, enum: id }
    })
    return val

  }, [categories]);
  const [merchHistoryFieldData, setMerchHistoryFieldData] = useState<any[]>([]);

  const handleBannerClick = useCallback((url) => {
    router.push(url);
  }, [router]);
useEffect(() => {
  const fetchData = async () => {
    try {
      const [pageInfo, banners] = await Promise.all([
        getMainPage(),
        getMainBanners()
      ]);
      setMainData({ pageInfo, banners });
      dispatch(finishLoading());
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };
  fetchData();

  return ()=>{
    console.debug("destroy")
  }
}, []);



const handleMainPageInfo = useMemo(() => {
  return Object.entries(mainData.pageInfo).map(([key, value]: [string, any]) => (
    <MerchSliderField
      key={key}
      name={value.name}
      merchInfo={value.products}
      onClick={() => router.push(`/search?${value.link_url}&type=""`)}
    />
  ));
}, [mainData.pageInfo, categories, router]);  

const createBanners = useCallback(() => {
  return mainData.banners.map((btnVal, i) => (
    <MerchBanner
      key={i}
      className={{ main: s.mainBanner, button: s.buttonBanner, contentHolder: s.contentHolder }}
      btnText={btnVal.button_text}
      onChange={() => handleBannerClick(btnVal.link_url)}
      title={btnVal.title}
      img={btnVal.image_url}
    />
  ));
}, [mainData.banners, handleBannerClick]);

  // useEffect(() => {
  //   getHistoryInfo(setMerchHistoryFieldData);
  // }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* <ImageSlider images={["1.jpg","2.jpg","1.jpg","1.jpg","2.jpg","1.jpg"]}/>
      <BlobBackground/>
      <InfiniteRecursionViewport/> */}
      {/* <VideoWallpaper  src={"1.mp4"} /> */}
      <ContentSliderWithLinks

        content={createBanners()}
      />
      <FirmsScroller />
      <div>
        {handleMainPageInfo}
      </div>
    </div>
  );
});

export default Main;
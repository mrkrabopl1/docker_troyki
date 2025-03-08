import React, { useEffect, ReactElement, useState, useRef, memo } from 'react'

import MerchSliderField from '../../modules/merchField/MerchSliderField'
import { getMainInfo } from "src/providers/merchProvider"
import { useAppSelector } from 'src/store/hooks/redux'
import { useNavigate } from 'react-router-dom';
import { getCollections, getHistoryInfo, getDiscontInfo } from 'src/providers/merchProvider'
import { shuffle } from 'src/global';

import StickyDispetcherButton from 'src/modules/stickyDispetcherButton/StickyDispetcherButton';
import MerchBanner from 'src/modules/merchBanner/MerchBanner'
import s from "./s.module.css"

const MerchComplexSliderField: React.FC<any> = () => {

  const navigate = useNavigate()

  const onChangeBanner = (id: string) => {
    navigate("/collections/" + id)
  }

  let mainPageRef = useRef<HTMLDivElement>(null)
  let [slidersData, setSlidersData] = useState({})

  let [imgBanner, setImgBanner] = useState<{ image: string, name: string, id: string }>({ image: "", name: "", id: "" })

  const createUrlImage = (data: { mainText: string, subText: string, img: string, name: string, id: string }[]) => {
    data.forEach(val => {
      setImgBanner({ image: val.img, name: val.name, id: val.id, })
    })


  }

  const { collections } = useAppSelector(state => state.menuReducer);
  const createSliders = () => {
    let arr = [];
    for (let sliderName in slidersData) {
      arr.push(<MerchSliderField key={sliderName} name={sliderName} merchInfo={slidersData[sliderName]} />)
    }
    return arr
  }
  useEffect(() => {
    if (!collections.length) return
    let colLength = Math.min(4, collections.length);
    if (colLength > 0) {
      let randomizeArr = [...collections];
      shuffle(randomizeArr);
      randomizeArr.length = colLength

      getCollections({ names: randomizeArr, size: 8, page: 1 }, setSlidersData)
    }
  }, [collections])
  useEffect(() => {
    getHistoryInfo(setMerchHistoryFieldData)
    getDiscontInfo(10, setDiscountFieldData)
  }, [])
  let [merchFieldData, setMerchFieldData] = useState<any>([])
  let [merchHistoryFieldData, setMerchHistoryFieldData] = useState<any>([])
  let [merchDiscountFieldData, setDiscountFieldData] = useState<any>([])

  return (

    <div style={{ position: "relative" }}>
      {createSliders()}
      {merchHistoryFieldData.length ? <MerchSliderField name={"Your history"} merchInfo={merchHistoryFieldData} /> : null}
      {merchDiscountFieldData.length ? <MerchSliderField name={"With disount"} merchInfo={merchDiscountFieldData} /> : null}
    </div>


  )
}


function arePropsEqual(oldProps: any, newProps: any) {

  return (oldProps.memo == newProps.memo)
}

export default memo(MerchComplexSliderField, arePropsEqual)
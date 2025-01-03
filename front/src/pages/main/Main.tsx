import React, { useEffect, ReactElement, useState, useRef, memo } from 'react'

import MerchSliderField from '../../modules/merchField/MerchSliderField'
import { getMainInfo } from "src/providers/merchProvider"
import { useAppSelector } from 'src/store/hooks/redux'
import { useNavigate } from 'react-router-dom';
import { getCollections,getHistoryInfo } from 'src/providers/merchProvider'
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';

import StickyDispetcherButton from 'src/modules/stickyDispetcherButton/StickyDispetcherButton';
import MerchBanner from 'src/modules/merchBanner/MerchBanner'
import s from "./s.module.css"

const Main: React.FC<any> = () => {

  const navigate = useNavigate()

  const onChangeBanner = (id: string) => {
    navigate("/collections/" + id)
  }

  let mainPageRef = useRef<HTMLDivElement>(null)

  let [imgBanner, setImgBanner] = useState<{ image: string, name: string, id: string }>({ image: "", name: "", id: "" })
 
  const createUrlImage = (data: {mainText:string,subText:string, img: string, name: string, id: string }[]) => {
    data.forEach(val => {
      setImgBanner({ image: val.img, name: val.name, id: val.id,  })
    })


  }

  const { chousenName } = useAppSelector(state => state.complexDropReducer)


  useEffect(() => {
    getMainInfo(createUrlImage)
    getHistoryInfo(setMerchHistoryFieldData )
  }, [])
  let [merchFieldData, setMerchFieldData] = useState<any>([])
  let [merchHistoryFieldData, setMerchHistoryFieldData] = useState<any>([])


  return (

    <div style={{position:"relative"}}>
      <StickyDispetcherButton top='80%' left="80%"/>
      <MerchBanner onChange={onChangeBanner} id={imgBanner.id} title={imgBanner.name} img={"/"+imgBanner.image} />
      <MerchComplexSliderField/>
    </div>


  )
}


function arePropsEqual(oldProps: any, newProps: any) {

  return (oldProps.memo == newProps.memo)
}

export default memo(Main, arePropsEqual)
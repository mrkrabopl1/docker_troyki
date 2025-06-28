import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'

import MerchSliderField from '../../modules/merchField/MerchSliderField'
import { getMainInfo } from "src/providers/merchProvider"
import { useAppSelector } from 'src/store/hooks/redux'
import { useNavigate } from 'react-router-dom';
import { getCollections,getHistoryInfo } from 'src/providers/merchProvider'
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';

import StickyDispetcherButton from 'src/modules/stickyDispetcherButton/StickyDispetcherButton';
import MerchBanner from 'src/modules/merchBanner/MerchBanner'
import s from "./s.module.css"

import ContentSliderWithSwitcher from 'src/components/contentSlider/ContentSliderWithSwitcher';


const TextArray = {
  text:[
  "Мы открылись",
  "Мероприятия"
  ],
  subText:[
    "",
    ""
  ],
  btnText:[
    "К колекции",
    "К мероприятию"
    ]
}



const Main: React.FC<any> = () => {

  const navigate = useNavigate()

  const onChangeBanner = (id: string) => {
    navigate("/collections/" + id)
  }

  let mainPageRef = useRef<HTMLDivElement>(null)

  let [imgBanner, setImgBanner] = useState<{btnText:string, image: string, name: string, id: string }>({ btnText:"",image: "", name: "", id: "" })
 
  const createUrlImage = (data: {mainText:string,subText:string, img: string, name: string, id: string ,btnText:string}[]) => {
    data.forEach(val => {
      setImgBanner({ image: val.img, name: val.name, id: val.id, btnText:val.btnText })
    })


  }

  const { chousenName } = useAppSelector(state => state.complexDropReducer)

  const createMerchBanner = useCallback(()=>{
    let arr:any = [];
    for(let i = 0;i<2;i++){
      arr.push(<MerchBanner className={{
        main:s.mainBanner,
        button:s.buttonBanner,
        contentHolder:s.contentHolder
      }} btnText={TextArray.btnText[i]} onChange={onChangeBanner} id={imgBanner.id} title={""} img={"/images/main/"+i+".png"} />)
    }
    return arr
  },[])

  useEffect(() => {
    getHistoryInfo(setMerchHistoryFieldData )
  }, [])
  let [merchFieldData, setMerchFieldData] = useState<any>([])
  let [merchHistoryFieldData, setMerchHistoryFieldData] = useState<any>([])


  return (

    <div style={{position:"relative"}}>
      <StickyDispetcherButton top='80%' left="80%"/>
      <ContentSliderWithSwitcher className={{slider:s.sliderHolder}} content={createMerchBanner()}/>
      <MerchComplexSliderField/>
    </div>


  )
}


function arePropsEqual(oldProps: any, newProps: any) {

  return (oldProps.memo == newProps.memo)
}

export default memo(Main, arePropsEqual)
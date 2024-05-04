import React, { useEffect, ReactElement, useState, useRef, memo } from 'react'

import MerchSliderField from '../../modules/merchField/MerchSliderField'
import { getMainInfo } from "src/providers/merchProvider"
import { useAppSelector } from 'src/store/hooks/redux'
import { useNavigate } from 'react-router-dom';
import { getCollections } from 'src/providers/merchProvider'
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
    const reqData = {
      name:"air_jordan_1",
      page:1,
      size:8
  }
    getCollections (reqData, setMerchFieldData)
  }, [chousenName])
  useEffect(() => {
    getMainInfo( createUrlImage)
  }, [])
  let [merchFieldData, setMerchFieldData] = useState<any>([])


  return (

    <div>
      <MerchBanner className={{main:s.banner}} onChange={onChangeBanner} id={imgBanner.id} title={imgBanner.name} img={"/"+imgBanner.image} />
      <MerchSliderField name={"Air Jordan 1"} merchInfo={merchFieldData} />
    </div>


  )
}


function arePropsEqual(oldProps: any, newProps: any) {

  return (oldProps.memo == newProps.memo)
}

export default memo(Main, arePropsEqual)
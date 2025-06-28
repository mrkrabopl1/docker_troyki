import React, { ReactElement, useEffect, useRef, useState, memo } from 'react'
import Menu from './Menu'
import ComplexDropMenu from './ComplexDropMenu';
import { useNavigate } from 'react-router-dom';
import { isDeepEqual } from 'src/global';
import axios from "axios";
import { getFirms } from 'src/providers/merchProvider'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { collections } from '../../store/reducers/menuSlice'

interface MerchMenuInterface {
  className?: string,
  isReady?: () => {

  }
}

const ComplexDropMenuWithRequest: React.FC<MerchMenuInterface> = (props) => {
  let dispatch = useAppDispatch()
  let [merchFieldData, setMerchFieldData] = useState<any>([])
  const setFirmsData = (firms) => {
    let collectionsData = [];
    let fieldData = {};
    firms.forEach((cols:any) => {
      fieldData[cols.firm] = cols.collections;
      collectionsData = collectionsData.concat(cols.collections)
    })
    setMerchFieldData(fieldData)
    dispatch(collections(collectionsData))
  }
  useEffect(() => {
    getFirms(setFirmsData)
  }, [])
  return (
    <ComplexDropMenu complexDropData={merchFieldData} />
  )
}

function arePropsEqual(oldProps: any, newProps: any) {

  return false
}


export default memo(ComplexDropMenuWithRequest, arePropsEqual)
import React, { ReactElement, useEffect, useRef, useState, memo } from 'react'
import Menu from './Menu'
import ComplexDropMenu from './ComplexDropMenu';
import { useNavigate } from 'react-router-dom';
import { isDeepEqual } from 'src/global';
import axios from "axios";
import { getFirms } from 'src/providers/merchProvider';

interface MerchMenuInterface {
  className?: string,
  isReady?: () => {

  }
}

const ComplexDropMenuWithRequest: React.FC<MerchMenuInterface> = (props) => {
  let [merchFieldData, setMerchFieldData] = useState<any>([])
  useEffect(() => {
    getFirms(setMerchFieldData)
  }, [])
  return (
    <ComplexDropMenu complexDropData={merchFieldData} />
  )
}

function arePropsEqual(oldProps: any, newProps: any) {

  return false
}


export default memo(ComplexDropMenuWithRequest, arePropsEqual)
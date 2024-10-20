import React, { ReactElement, useEffect, useRef, useState } from 'react'
import MerchBlock from "./MerchBlock"
import NameBorder from 'src/components/wraps/NameBorder'
import ContentSlider from 'src/components/contentSlider/ContentSlider'
import s from "./style.module.css"


type merchInfoType ={
    price:string,
    discount:number,
    name:string,
    imgs:string[],
    firm:string,
    id:string
}

interface merchInterface { name: string,  merchInfo: merchInfoType[]}

const MerchSliderField: React.FC<merchInterface> = (props) => {
    let { name,merchInfo } = { ...props }
    function createSliderSpace(data: merchInfoType[] ) {
        let arr: any = []
        for(let i =0;i<data.length;i++){
            arr.push(<MerchBlock className = {s.mbwd}  data={data[i]} />)

        }
        return arr
    }
    return (
        <div >
            <NameBorder {...{ content: <ContentSlider className={"dependetHeight"} content={createSliderSpace(merchInfo)} />, name: name }} ref={null} />
        </div>
    )
}


export default MerchSliderField
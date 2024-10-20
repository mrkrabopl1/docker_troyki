import React, { ReactElement, useEffect, useRef, useState } from 'react'
import MerchBlock from "./MerchBlock"
import MerchField from './MerchField'
import PageController from 'src/components/contentSlider/slidersSwitchers/PageController'
import s from "./style.module.css"


interface merchInterface {
    name: string,
    imgs: string[],
    id: string,
    price:string,
    className?: string
}
interface merchFieldInterface {
    heightRow?: number,
    pages: number,
    currentPage: number,
    className?: string,
    size: number,
    data: merchInterface[],
    onChange: (args: any) => void
}

const MerchFieldWithPageSwitcher: React.FC<merchFieldInterface> = (props) => {
    let { data, size, className, heightRow, pages, currentPage, onChange } = { ...props }
    data = [...data]
    const createWidth = () => {
        return 100 / size + "%"
    }

    let heightClass = useRef<string>("")

    if(size === 3){
         heightClass.current = "dependetHeight"
    }else{
         heightClass.current = "dependetHeight1"
    }


    const createBlocks = () => {
        let arr: any = []
        while (data.length) {
            let count = 0
            let arrSm: any = []
            while (count < size) {
                count += 1
                if (data.length !== 0) {
                    arrSm.push(<MerchBlock width={createWidth()} data={data[0]} />)
                }
                data.shift()
            }

            arr.push(<div className={className ? className : s.merchField + " " + heightClass.current}>
                {arrSm}
            </div>)
        }

        return arr
    }
    return (
        <div>
            <div className={s.globalMerchField}>
                 {createBlocks()}
            </div>
            <PageController currentPosition={currentPage} positions={pages} callback={onChange} />

        </div>

    )
}


export default MerchFieldWithPageSwitcher
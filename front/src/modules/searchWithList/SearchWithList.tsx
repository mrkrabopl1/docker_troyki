import React, { ReactElement, useRef, useState } from 'react'
import Search from '../../components/search/Search'
import { useAppDispatch } from 'src/store/hooks/redux';
import DropDownList from '../../components/DropDownList'
import MerchLine from '../merchField/MerchLine';

type propsRowType = {
    className?: {
        main:string,
        search?:string,
        dropList:string

    },
    searchCallback:(...args: any) => void | null,
    onDataRecieve?: (...args: any) => void ,
    onChange?: (...args: any) => void ,
    val?:string
}
const defaultStyle: any = {
    border: "2px solid blue",
    position: "relative",
    backgroundColor: "white"

}

let obj = { name: "string", imgs: "string",id:"string",firm:"string",price:"string" }



const SearchWithList: React.FC<propsRowType> = (props) => {
    let trottlingTimerId = useRef<ReturnType<typeof setTimeout> | null>(null)
    let { val,className,onDataRecieve,searchCallback, onChange } = { ...props }
    let [dropDownListData, setDropDownList] = useState<ReactElement[]>([])
    let mainRef = useRef<HTMLDivElement|null>(null)

    const createDropList: (data: any) => void = (data) => {
        onDataRecieve && onDataRecieve(data)
        setDropDownList( data.map((value:any) =>
        {
            return <MerchLine data={value}/>    
        }
          
        ))
    }

    let [activeList,setActive] = useState<boolean>(true)


    const onFocus=()=>{
        setActive(true)
    }
    const onBlur=()=>{
        setActive(false)
    }


    const seatchProxy=(data:any)=>{
        setActive(false)
        searchCallback(data)
    }

    return (
        <div ref={mainRef} style = {{ position:"relative"}} className={className ? className.main : ""}>
            <Search val={val} onChange={onChange} onBlur={onBlur} onFocus={onFocus} searchCallback={seatchProxy} onDataRecieve={createDropList}>

            </Search>
            <DropDownList  className={className ? className.dropList : ""} active={activeList}>
                {dropDownListData}
            </DropDownList>

        </div>
    )
}

export default SearchWithList
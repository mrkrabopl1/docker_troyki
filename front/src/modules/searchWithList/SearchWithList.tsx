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
    val?:string,
    selectList?:(...args: any) => void 
}
const defaultStyle: any = {
    border: "2px solid blue",
    position: "relative",
    backgroundColor: "white"

}

let obj = { name: "string", imgs: "string",id:"string",firm:"string",price:"string" }



const SearchWithList: React.FC<propsRowType> = (props) => {
    let trottlingTimerId = useRef<ReturnType<typeof setTimeout> | null>(null)
    let { val,className,onDataRecieve,searchCallback, onChange, selectList } = { ...props }
    let [dropDownListData, setDropDownList] = useState<ReactElement[]>([])
    let mainRef = useRef<HTMLDivElement|null>(null)

    const onChangeHandler=(data)=>{
        selectList(data)
    }

    const createDropList: (data: any) => void = (data) => {
        onDataRecieve && onDataRecieve(data)
        setDropDownList( data.map((value:any) =>
        {
            return <MerchLine key={value.name}  data={{...value, onChange:onChangeHandler}}/>    
        }
          
        ))
    }

    let [activeList,setActive] = useState<boolean>(true)


    const onFocus=()=>{
        setTimeout(()=>setActive(true),0)
    }
    const onBlur=(e)=>{
        console.debug(e.relatedTarget)
        setActive(false)
    }

    const seatchProxy=(data:any)=>{
        setActive(false)
        searchCallback(data)
    }

    const onClicks = ()=>{
        console.debug("fmd;fms;dkfms;dm")
    }

    return (
        <div onClick={ onClicks}  onBlur={onBlur} ref={mainRef} style = {{position:"relative"}} className={className ? className.main : ""}>
            <Search className={className ? className.search : ""} val={val} onChange={onChange}  onFocus={onFocus} searchCallback={seatchProxy} onDataRecieve={createDropList}>

            </Search>
            {/* <div className={className ? className.dropList : ""} style={activeList?{position:"relative"}:{display:"none"}}>
                {dropDownListData}
            </div> */}
            <DropDownList  className={className ? className.dropList : ""} active={activeList}>
                {dropDownListData}
            </DropDownList>

        </div>
    )
}

export default SearchWithList
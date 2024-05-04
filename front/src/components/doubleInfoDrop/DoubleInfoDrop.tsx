import React, { ReactElement, useEffect, useRef, useState } from 'react'

type propsRowType = {
    className?: {
        main: string,
        second: string
    },
    info: string

}


const DoubleInfoDrop: React.FC<propsRowType> = (props) => {
    let { className, children, info } = { ...props }
    let [active, setActive] = useState<boolean>(false)
    let [refresh,setRefresh] = useState<boolean>(true)

   
    const [initialChildren, setChildren] = useState(children);

    // Используем useEffect для обновления children, когда изменяются props
    useEffect(() => {
      setChildren(children);
    }, [children]);
    let secondDropStyle1 = {
        transition: "height 2s ",
        height: "0px",
        overflow: "hidden"


    }
    let drop = useRef<HTMLDivElement>(null)

    useEffect(()=>{
        if(active){
            setRefresh(!refresh)
        }
    },[])

    let secondDropStyle = {
        transition: "height 0.5s ",
        height: drop.current?.clientHeight + "px",
        overflow: "hidden"
    }
    return (
        <div style={{ position: "relative" }} className={className ? className.main : ""}>
            <div
                onClick={() => {
                    setActive(!active)
                }}
                style={{ display: "flex" }} >
                <p>{info}</p>
                <span style={{ position: "absolute", right: "0", paddingRight: "5px" }}>{active ? "\u1433" : "\u142F"}</span>
            </div>
            <div style={active ? secondDropStyle : secondDropStyle1}>
                <div ref={drop}>{initialChildren}</div>
            </div>

        </div>
    )
}

export default DoubleInfoDrop
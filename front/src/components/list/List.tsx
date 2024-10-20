import React, { useRef, useState } from 'react'


interface IList {
    rows:string[] ;
    onChange:(data:String)=>any;
    className?:string
}

const proxyClick=function(e:React.MouseEvent,clickMethod:(e:React.MouseEvent)=>any){
    e.stopPropagation();
    clickMethod(e)
}


const List:  React.FC<IList> = ({ rows,onChange,className }) => {

    return (
        <div>
            {
                rows.map(row=>{
                    return <div className={className} onClick={onChange(row)}>
                        {row}
                    </div>
                })
            }
        </div>
    )
}

export default List
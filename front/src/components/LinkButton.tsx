import React, { useRef, useState } from 'react'


interface IButton {
    text?: string;
    onChange:(e:React.MouseEvent)=>any;
    className?:string,
    icon:string
}

const proxyClick=function(e:React.MouseEvent,clickMethod:(e:React.MouseEvent)=>any){
    e.stopPropagation();
    clickMethod(e)
}


const LinkButton:  React.FC<IButton> = ({icon, text,onChange,className }) => {
    return (
        <button style={{cursor:"pointer"}} className={className} 
                    onMouseDown={e=>{proxyClick(e,onChange)}}>
                        {
                            icon?  <span style = {{backgroundImage:`url(/${icon}.svg)`, backgroundPosition:"center", backgroundRepeat:"no-repeat", padding:"15px"}}>

                            </span>:null
                        }
                       
                    <span>{text}</span>
                </button>
)}

export default LinkButton
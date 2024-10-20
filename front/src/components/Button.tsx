import React, { useRef, useState } from 'react'


interface IButton {
    text?: string;
    onChange:(e:React.MouseEvent)=>any;
    className?:string
}

const proxyClick=function(e:React.MouseEvent,clickMethod:(e:React.MouseEvent)=>any){
    e.stopPropagation();
    clickMethod(e)
}


const Button:  React.FC<IButton> = ({ text,onChange,className }) => {
    return (<button style={{cursor:"pointer",display:"inine-block"}} className={className} 
        onMouseDown={e=>{proxyClick(e,onChange)}}>
        {text}
    </button>)
}

export default Button
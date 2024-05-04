const lineTransform = (num:number)=>{
    return num
}

const squareTransform = (num:number)=>{
    return num*num
}

const cubeTransform = (num:number)=>{
    return num*num*num
}

const rootTransform = (num:number)=>{
    return Math.pow(num,0.5)
}

export {rootTransform,squareTransform,lineTransform,cubeTransform}
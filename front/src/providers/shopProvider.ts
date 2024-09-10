import axios from "axios";



const getCartData = function (cartHash:any, callback: (val: any) => void) {
    const data = new FormData();
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/getCartData?hash=`+cartHash,
        headers: {}
    }
    ).then((res:any)=>{
        console.log(res.data)
        callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}

const deleteCartData = function (preorderId, callback: (val: any) => void) {
    let json = JSON.stringify({preorderId})
    axios({
        method: 'post',
        url: `${API_URL}/deleteCartData`,
        headers: {
            'Content-Type': 'application/json'
        },
        data:json
    }
    ).then((res:any)=>{
        console.log(res.data)
        callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}



export { getCartData, deleteCartData }
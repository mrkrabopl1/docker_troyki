import axios from "axios";



const getCartData = function ( callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/getCartData`,
        headers: {}
    }
    ).then((res:any)=>{
        console.log(res.data)
        callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}

const getCartCount = function ( callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/getCartCount`,
        headers: {}
    }
    ).then((res:any)=>{
        console.log(res.data)
        callback(res.data)
    },(error)=>{
        console.warn(error)
    })
}


const getOrderCartData = function (cartHash:any, callback: (val: any) => void) {
    const data = new FormData();
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/getCartDataFromOrder?hash=`+cartHash,
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



export { getCartData, deleteCartData ,getOrderCartData, getCartCount}
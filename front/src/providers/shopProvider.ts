import axios from "axios";
const isServer = () => typeof window === 'undefined';
export async function getMainBanners(): Promise<any> {
  if (isServer()) {
    const res = await fetch(`${API_URL}/getMainBanners`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Failed to fetch banners: ${res.status}`);
    return res.json();
  }
  
  const res = await axios.get(`${API_URL}/getMainBanners`);
  return res.data;
}

const getCartData = function ( hash, callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/getCartData?hash=${hash}`,
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
const getMainInfo = async () => {
  try {
    const res = await axios({
      withCredentials: true,
      method: 'get',
      url: `${API_URL}/getMainInfo`,
      headers: {},
    });
    return res.data;
  } catch (error) {
    console.warn(error);
    throw error;
  }
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



export { getCartData, deleteCartData ,getOrderCartData, getCartCount,getMainInfo}
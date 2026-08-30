import axios from "axios";
const isServer = () => typeof window === 'undefined';
export async function getMainBanners(): Promise<any> {
    console.log("Fetching main banners...", API_URL);
    if (isServer()) {
        const res = await fetch(`${API_URL}/banners`, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`Failed to fetch banners: ${res.status}`);
        return res.json();
    }

    const res = await axios.get(`${API_URL}/banners`);
    return res.data;
}

const getCartData = function (hash, callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/cart?hash=${hash}`,
        headers: {}
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

const getCartCount = function (callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/cart/count`,
        headers: {}
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}
const getMainInfo = async () => {
    console.log("Fetching main banners...", API_URL);
    if (isServer()) {
        const res = await fetch(`${API_URL}/main/info`, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`Failed to fetch banners: ${res.status}`);
        return res.json();
    }

    const res = await axios.get(`${API_URL}/main/info`);
    return res.data;
}

const getMenuInfo = async () => {
    console.log("Fetching main banners...", API_URL);
    if (isServer()) {
        const res = await fetch(`${API_URL}/menu`, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`Failed to fetch banners: ${res.status}`);
        return res.json();
    }

    const res = await axios.get(`${API_URL}/menu`);
    return res.data;
}


const getOrderCartData = function (cartHash: any, callback: (val: any) => void) {
    const data = new FormData();
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/orders/cart?hash=` + cartHash,
        headers: {}
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

const deleteCartData = function (preorderId, callback: (val: any) => void) {
    let json = JSON.stringify({ preorderId })
    axios({
        method: 'post',
        url: `${API_URL}/delete/cart`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: json
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}



export { getCartData, deleteCartData, getOrderCartData, getCartCount, getMainInfo,getMenuInfo }
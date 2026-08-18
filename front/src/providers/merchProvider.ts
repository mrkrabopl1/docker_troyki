import axios from "axios";


const isServer = () => typeof window === 'undefined';
const getMerchInfo = function (id: string, callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/products/${id}`,
        headers: {}
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    },  (error: any) => {
        console.warn(error)
    })
}
export async function getMerchInfoServer(id: string): Promise<any> {
    const res = await fetch(`${API_URL}/products/${id}`, {
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch product info: ${res.status}`);
    }
    
    return res.json();
}
const getHistoryInfo = function (callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/history`,
        headers: {}
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    },  (error: any) => {
        console.warn(error)
    })   
}

const getDiscontInfo = function (max: number, callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'post',
        url: `${API_URL}/discounts`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: { max }
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    },  (error: any) => {
        console.warn(error)
    })
}

const getFirms = function (callback: (val: any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/firms`,
        headers: {}
    }
    ).then((res: any) => {
        callback(res.data)
    },  (error: any) => {
        console.warn(error)
    })
}

type collectionType = {
    name: string,
    page: number,
    size: number
}
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
})


export const getCollectionBySlug = async (slug: string) => {
    const response = await api.get(`/collections/slug/${slug}`)
    return response.data
}
export const getCollectionProducts = function(
    slug: string,
    params: {
        page: number,
        size: number,
        sortType: number,
        search?: string,
        filters?: any
    },
    callback: (val: any) => void
) {
    axios({
        method: 'post',
        url: `${API_URL}/collections/${slug}/products`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            page: params.page,
            size: params.size,
            sortType: params.sortType,
            search: params.search || '',
            filters: params.filters || {}
        })
    }).then((res: any) => {
        console.debug(res.data)
        callback(res.data)
    }).catch((error) => {
        console.warn(error)
        callback(null)
    })
}

const getCollections = function (reqData: { names: string[], page: number, size: number }, callback: (val: any) => void) {
    axios({
        method: 'post',
        url: `${API_URL}/collections`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: reqData
    }
    ).then((res: any) => {
        callback(res.data)
    },  (error: any) => {
        console.warn(error)
    })
}





const getSizeTable = function (category: string, callback: (val: any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/sizeTable?category=` + category,
        headers: {}
    }
    ).then((res: any) => {
        callback(res.data)
    },  (error: any) => {
        console.warn(error)
    })
}


export async function getMainPage(): Promise<any> {
   console.log("Fetching main page...", API_URL,isServer());
  if (isServer()) {
    // Сервер: используем fetch
    const res = await fetch(`${API_URL}/main`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Failed to fetch main page: ${res.status}`);
    return res.json();
  }
  
  // Клиент: используем axios
  const res = await axios.get(`${API_URL}/main`);
  return res.data;
}

// 🔥 getMainBanners - для SSR


// 🔥 getMainInfo - для SSR
export async function getMainInfo(): Promise<any> {
  if (isServer()) {
    console.log(API_URL,"fdnlsdnf")
    const res = await fetch(`${API_URL}/getMainInfo`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Failed to fetch main info: ${res.status}`);
    return res.json();
  }
  
  const res = await axios.get(`${API_URL}/getMainInfo`);
  return res.data;
}
export { getMerchInfo, getSizeTable,  getCollections, getFirms, getHistoryInfo, getDiscontInfo }
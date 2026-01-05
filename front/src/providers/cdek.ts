import axios from "axios";
 
const getCdekDeliveryData = function (query:string,callback: (val: any) => void) {
    var url = "http://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";
    var token = "6be459b258fe86fa07e195d91fadc7572d62c0a6";

    axios({
        method: 'post',
        url: "http://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Token " + token 
        },
        data: JSON.stringify({query: query})
    }).then((res: any) => {
        console.log(res)
        callback(res.data)
    }
    )
}

const getAddressDeliveryData = function (query:string,callback: (val: any) => void) {
    var url = "http://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";
    var token = "6be459b258fe86fa07e195d91fadc7572d62c0a6";

    axios({
        method: 'post',
        url: "http://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Token " + token 
        },
        data: JSON.stringify({query: query})
    }).then((res: any) => {
        console.log(res)
        callback(res.data)
    }
    )
}



const chackPostalIndex= function(index:string,callback: (val: any) => void){
    var url = "http://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/postal_unit";;
    var token = "6be459b258fe86fa07e195d91fadc7572d62c0a6";

    axios({
        method: 'post',
        url: url,
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Token " + token 
        },
        data: JSON.stringify({query: index})
    }).then((res: any) => {
        console.log(res)
        callback(res.data)
    }
    )
}

export {getCdekDeliveryData,chackPostalIndex,getAddressDeliveryData}
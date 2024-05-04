import axios from "axios";

const getCdekDeliveryData = function (info:any, callback: (val: any) => void) {
    let data = JSON.stringify({
        "type": "2",
        "date": "2020-11-03T11:49:32+0700",
        "currency": "1",
        "tariff_code": "11",
        "from_location": {
            "code": 270
        },
        "to_location": {
            "code": 44
        },
        "services": [
            {
                "code": "CARTON_BOX_XS",
                "parameter": "2"
            }
        ],
        "packages": [
            {
                "height": 10,
                "length": 10,
                "weight": 4000,
                "width": 10
            }
        ]
    })
    axios({
        method: 'post',
        url: `https://api.edu.cdek.ru/v2/calculator/tariff`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    }).then((res: any) => {
        console.log(res)
        callback(res.data)
    }
    )
}

export {getCdekDeliveryData}
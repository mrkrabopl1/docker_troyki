import axios from "axios";


const getQuestions = function (callback: (val: any) => void) {

    axios({
        method: 'get',
        url: 'http://127.0.0.1:8100/faq',
        headers: {}
    }
    ).then((res:any)=>{
        callback(res.data)
    })
}


export {getQuestions}
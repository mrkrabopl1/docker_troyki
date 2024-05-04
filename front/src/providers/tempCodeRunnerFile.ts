
import axios from "axios";
import sha256 from "crypto-js/sha256";
import Base64 from 'crypto-js/enc-base64';
const logImport = function (data:{login:string,password:string},callback:(val:any)=>void){
    let hashLogin =  Base64.stringify(sha256(data.login))
    let hashPassword =  Base64.stringify(sha256(data.password))
    let jsonData = JSON.stringify({login:hashLogin,password:hashPassword})
axios.post(`http://127.0.0.1:8000/registr`,jsonData ,{headers:{"content-type":"application/json"}}).then((res)=>{
    console.log(res.status)
    callback(res.data) 
}
)

}


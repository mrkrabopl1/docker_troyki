type merchType = {[key:string]:{price:number,availability:boolean,discount?:number,in_stock:boolean,quantity:number}}
export interface MerchItem {
    name: string;
    img: string;
    id: string;
    firm: string;
    price: string;
    [key: string]: any;
}

export default merchType
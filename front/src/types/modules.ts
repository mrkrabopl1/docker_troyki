export interface CheckBoxType {
    id: string | number;
    enable: boolean;
    activeData: boolean;
    name: string;
}


export interface Firm {
    id: number;
    name: string;
    slug: string;
}
export interface Line {
  id: number;
  name: string;
  slug: string;
  brand_id: number;
}
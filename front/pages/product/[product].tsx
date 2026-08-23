// src/pages/product/[id].tsx
import { GetServerSideProps } from 'next';
import ProductsInfo from 'src/pages/productsInfo/ProductsInfo';
import { getMerchInfoServer } from 'src/providers/merchProvider';
import { withMainDataServer } from 'lib/withMainData';

export const getServerSideProps = withMainDataServer(async (context) => {
    const { product } = context.params || {};
    
    if (!product) {
        return { 
            props: { initialData: null } 
        };
    }

    const data = await getMerchInfoServer(product as string);
    console.log('📦 Product data:', data);
    
    return {
        props: {
            initialData: data || null,
        }
    };
});

export default ProductsInfo;
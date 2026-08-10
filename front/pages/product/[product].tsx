// src/pages/product/[id].tsx
import { GetServerSideProps } from 'next';
import ProductsInfo from 'src/pages/productsInfo/ProductsInfo';
import { getMerchInfoServer } from 'src/providers/merchProvider';

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { product } = context.params || {};
    
    if (!product) {
        return {
            props: {
                initialData: null
            }
        };
    }

    try {
        // 🔥 Запрос на сервере!
        const data = await getMerchInfoServer(product as string);
        
        return {
            props: {
                initialData: data || null
            }
        };
    } catch (error) {
        console.error('SSR failed for product:', error);
        return {
            props: {
                initialData: null
            }
        };
    }
};

export default ProductsInfo;
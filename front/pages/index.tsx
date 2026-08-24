// pages/index.tsx
import Main from 'src/pages/main/Main';
import { getMainData } from 'lib/mainDataLoader';
import { getMainBanners } from 'src/providers/shopProvider';

export const getStaticProps = async () => {
    // ✅ Загружаем общие данные и баннеры
    const [mainData, banners] = await Promise.all([
        getMainData(),
        getMainBanners().catch(() => [])
    ]);
    
    console.log('[INDEX] Banners loaded:', banners.length);
    
    return {
        props: {
            initialData: {
                ...mainData,
                banners // ← добавляем баннеры
            }
        },
        revalidate: 300
    };
};

export default Main;
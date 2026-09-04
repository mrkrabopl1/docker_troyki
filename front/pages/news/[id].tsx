// front/pages/news/[id].tsx

import NewsPage from 'src/pages/newsPage/NewsPage';
import { getMainData } from 'lib/mainDataLoader';
import { getNewsBySlug, getRelatedNews } from 'src/providers/adminNewsProvider';

// 🔥 GET SERVER SIDE PROPS - рендерится на каждом запросе
export const getServerSideProps = async (context: any) => {
    const { id } = context.params;
    
    console.log('[NEWS DETAIL] ========================================');
    console.log('[NEWS DETAIL] getServerSideProps НАЧАЛО, id:', id);
    
    try {
        const [mainData, newsData, relatedNews] = await Promise.all([
            getMainData(),
            getNewsBySlug(id).catch(() => null),
            getRelatedNews(parseInt(id), 3).catch(() => [])
        ]);

        if (!newsData) {
            console.log('[NEWS DETAIL] Новость не найдена');
            return {
                notFound: true,
            };
        }

        console.log('[NEWS DETAIL] Новость найдена:', newsData.block?.title);
        console.log('[NEWS DETAIL] Похожих новостей:', relatedNews.length);
        console.log('[NEWS DETAIL] ========================================');

        return {
            props: {
                initialData: {
                    ...mainData,
                    news: {
                        block: newsData.block,
                        items: newsData.items || [],
                        related: relatedNews || [],
                    }
                }
            },
        };
    } catch (error) {
        console.error('[NEWS DETAIL] Ошибка:', error);
        console.log('[NEWS DETAIL] ========================================');
        
        return {
            notFound: true,
        };
    }
};

export default NewsPage;
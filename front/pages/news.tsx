// front/pages/news/index.tsx

import NewsList from 'src/pages/newsList/NewsList';
import { getMainData } from 'lib/mainDataLoader';
import { getNewsList } from 'src/providers/adminNewsProvider';

export const getServerSideProps = async () => {
    console.log('[NEWS INDEX] ========================================');
    console.log('[NEWS INDEX] getServerSideProps НАЧАЛО');
    
    try {
        // 🔥 ПАРАЛЛЕЛЬНАЯ ЗАГРУЗКА: mainData + новости
        const [mainData, newsData] = await Promise.all([
            getMainData(),
            getNewsList({
                page: 1,
                limit: 10,
                sortBy: 'published_at',
                sortOrder: 'desc',
                search: '',
            }).catch(() => ({
                blocks: [],
                total: 0,
                page: 1,
                limit: 10,
            }))
        ]);

        console.log('[NEWS INDEX] mainData ПОЛУЧЕН');
        console.log('[NEWS INDEX] - pageInfo ДЛИНА:', mainData?.pageInfo?.length || 0);
        console.log('[NEWS INDEX] Новостей получено:', newsData.blocks?.length || 0);
        console.log('[NEWS INDEX] Всего новостей:', newsData.total || 0);
        console.log('[NEWS INDEX] ========================================');

        return {
            props: {
                initialData: {
                    ...mainData,
                    news: {
                        blocks: newsData.blocks || [],
                        total: newsData.total || 0,
                        page: newsData.page || 1,
                        limit: newsData.limit || 10,
                    }
                }
            }
        };
    } catch (error) {
        console.error('[NEWS INDEX] Ошибка:', error);
        console.log('[NEWS INDEX] ========================================');
        
        // В случае ошибки возвращаем пустые данные
        const mainData = await getMainData().catch(() => ({
            pageInfo: [],
            menuInfo: {},
        }));

        return {
            props: {
                initialData: {
                    ...mainData,
                    news: {
                        blocks: [],
                        total: 0,
                        page: 1,
                        limit: 10,
                    }
                }
            }
        };
    }
};

export default NewsList;
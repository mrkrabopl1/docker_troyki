// src/pages/search/index.tsx
import { GetServerSideProps } from 'next';
import SearchPage from 'src/pages/search/SearchPage';
import { getProductsAndFiltersByCategoryAndTypeServer } from 'src/providers/searchProvider';
import { withMainDataServer } from 'lib/withMainData'; // 👈 Добавляем

export const getServerSideProps = withMainDataServer(async (context) => {
    const { query } = context;
    const startTime = performance.now();
    console.log(`🔵 [SSR] getServerSideProps START for search`); 
    const key_word = query.key_word as string || '';
    const categorySlug = query.category as string || '';
    const typeSlug = query.type as string || '';
    const brandSlug = query.brand as string || '';
    const lineSlug = query.line as string || '';
    const bodytype = query.bodytype as string || '';
    const discount = query.discount === 'true';
    const page = parseInt(query.page as string) || 1;
    const size = parseInt(query.size as string) || 24;
    const orderType = parseInt(query.orderType as string) || 0;

    try {
        const apiStart = performance.now();
        const initialData = await getProductsAndFiltersByCategoryAndTypeServer({
            searchName: key_word,
            page,
            size,
            orderType: String(orderType),
            categorySlug,
            typeSlug,
            brandSlug,
            lineSlug,
            hasDiscount: discount,
            filters: {
                categories: [],
                sizes: [],
                price: [],
                firms: [],
                types: [],
                lines: [],
                bodytypes: bodytype ? [bodytype] : [],
                store: false,
                withPrice: true,
                discount: discount,
                rule_ids: []
            }
        });
        const apiEnd = performance.now();

        console.log(`⏱️ [SSR] API запрос занял: ${(apiEnd - apiStart).toFixed(0)}ms`);
        console.log(`📊 [SSR] Получено товаров: ${initialData?.products?.length || 0}`);

        const dataSize = JSON.stringify(initialData).length;
        console.log(`📊 [SSR] Размер данных: ${(dataSize / 1024 / 1024).toFixed(2)} MB`);

        // Если данные слишком большие - предупреждение
        if (dataSize > 500 * 1024) { // > 500KB
            console.warn(`⚠️ [SSR] Данные слишком большие! ${(dataSize / 1024).toFixed(0)} KB`);
        }

        const endTime = performance.now();
        console.log(`⏱️ [SSR] getServerSideProps TOTAL: ${(endTime - startTime).toFixed(0)}ms`);
        return {
            props: {
                initialData: initialData || null,
                searchParams: {
                    key_word,
                    category: categorySlug,
                    type: typeSlug,
                    brand: brandSlug,
                    line: lineSlug,
                    bodytype,
                    discount,
                    page,
                    size,
                    orderType
                }
            }
        };
    } catch (error) {
        console.error('SSR failed for search:', error);
        return {
            props: {
                initialData: null,
                searchParams: {
                    key_word,
                    category: categorySlug,
                    type: typeSlug,
                    brand: brandSlug,
                    line: lineSlug,
                    bodytype,
                    discount,
                    page,
                    size,
                    orderType
                }
            }
        };
    }
});

export default SearchPage;
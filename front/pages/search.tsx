// src/pages/search/index.tsx
import { GetServerSideProps } from 'next';
import SearchPage from 'src/pages/search/SearchPage';
import { getProductsAndFiltersByCategoryAndTypeServer } from 'src/providers/searchProvider';
import { withMainDataServer } from 'lib/withMainData'; // 👈 Добавляем

export const getServerSideProps = withMainDataServer(async (context) => {
    const { query } = context;
    
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
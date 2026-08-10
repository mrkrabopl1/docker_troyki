import { GetServerSideProps } from 'next';
import CollectionPage from 'src/pages/collectionPage/CollectionPage';
import { getCollectionBySlug } from 'src/providers/merchProvider';

// 🔥 ТОЛЬКО ЗДЕСЬ!
export const getServerSideProps: GetServerSideProps = async (context) => {
    const { collection } = context.params || {}
    
    if (!collection) {
        return {
            props: {
                initialData: null,
                collectionSlug: null
            }
        }
    }

    try {
        const data = await getCollectionBySlug(collection as string)
        
        return {
            props: {
                initialData: {
                    collection: data.collection || null,
                    products: data.products || [],
                    filters: data.filters || null,
                    total: data.total || 0,
                    page: data.page || 1
                },
                collectionSlug: collection as string
            }
        }
    } catch (error) {
        console.error('SSR failed for collection:', error)
        return {
            props: {
                initialData: null,
                collectionSlug: collection as string
            }
        }
    }
}

export default CollectionPage;
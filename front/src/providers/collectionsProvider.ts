import axios from "axios";
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
})

export const getCollectionBySlug = async (slug: string) => {
    try {
        const response = await api.get(`/collections/${slug}`)
        return response.data
    } catch (error) {
        console.error('Error fetching collection:', error)
        throw error
    }
}
export const getCollectionProducts = async (
    slug: string,
    params: {
        page: number,
        size: number,
        sortType: number,
        search?: string,
        filters?: any
    }
) => {
    try {
        const response = await api.post(`/collections/${slug}/products`, {
            page: params.page,
            size: params.size,
            sortType: params.sortType,
            search: params.search || '',
            filters: params.filters || {}
        })
        return response.data
    } catch (error) {
        console.error('Error fetching collection products:', error)
        throw error
    }
}
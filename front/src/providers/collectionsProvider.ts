import axios from "axios";
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
})

export const getCollectionBySlug = async (slug: string) => {
    const res = await fetch(`${API_URL}/collections/slug/${slug}`, {
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch collection: ${res.status}`);
    }
    
    return res.json();
}
export const getCollectionById = async (id: number) => {
    try {
        const response = await api.get(`/collections/${id}`)
        return response.data
    } catch (error) {
        console.error('Error fetching collection products:', error)
        throw error
    }
}
export const getCollectionProducts = async (
    id: number,
    params: {
        page: number,
        size: number,
        sortType: number,
        search?: string,
        filters?: any
    }
) => {
    try {
        const response = await api.post(`/collections/${id}/products`, {
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
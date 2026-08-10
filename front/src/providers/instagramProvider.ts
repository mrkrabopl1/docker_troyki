// src/providers/adminInstagramProvider.ts
import axios from "axios";



// ========== ТИПЫ ==========
export interface InstagramPhoto {
    id: number;
    image_url: string;
    is_active: boolean;
    created_at: string;
}

export interface AdminInstagramResponse {
    photos: InstagramPhoto[];
    total: number;
    active: number;
    max: number;
    can_add: boolean;
}

export interface UploadInstagramResponse {
    message: string;
    uploaded: number;
    photos: InstagramPhoto[];
    warnings?: string[];
    failed?: number;
}

// ========== ПОЛУЧИТЬ ФОТО ДЛЯ КЛИЕНТА (Promise) ==========
export const getInstagramPhotos = function(): Promise<InstagramPhoto[]> {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${API_URL}/instagram`,
            headers: {}
        }).then((res: any) => {
            resolve(res.data)
        }).catch((error: any) => {
            console.warn(error)
            reject(error)
        })
    })
}

// ========== ПОЛУЧИТЬ ФОТО ДЛЯ КЛИЕНТА (callback) ==========
export const getInstagramPhotosCallback = function(
    callback: (val: InstagramPhoto[]) => void
) {
    axios({
        method: 'get',
        url: `${API_URL}/instagram`,
        headers: {}
    }).then((res: any) => {
        callback(res.data)
    }).catch((error: any) => {
        console.warn(error)
        callback([])
    })
}

// ========== ПОЛУЧИТЬ ФОТО ДЛЯ АДМИНА ==========
export const getAdminInstagramPhotos = function(
    callback: (val: AdminInstagramResponse) => void
) {
    axios({
        method: 'get',
        url: `${API_URL}/admin/instagram`,
        headers: {},
        withCredentials: true
    }).then((res: any) => {
        callback(res.data)
    }).catch((error: any) => {
        console.warn(error)
        callback({
            photos: [],
            total: 0,
            active: 0,
            max: 20,
            can_add: true
        })
    })
}

// ========== ЗАГРУЗИТЬ ФОТО ==========
export const uploadInstagramPhotos = function(
    files: File[],
    callback: (val: UploadInstagramResponse) => void,
    onError?: (error: any) => void
) {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('images', file);
    });

    axios({
        method: 'post',
        url: `${API_URL}/admin/instagram/upload`,
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
    }).then((res: any) => {
        callback(res.data)
    }).catch((error: any) => {
        console.warn(error)
        if (onError) {
            onError(error)
        }
        callback({
            message: 'Upload failed',
            uploaded: 0,
            photos: []
        })
    })
}

// ========== УДАЛИТЬ ФОТО ==========
export const deleteInstagramPhoto = function(
    id: number,
    callback: () => void,
    onError?: (error: any) => void
) {
    axios({
        method: 'delete',
        url: `${API_URL}/admin/instagram/${id}`,
        headers: {},
        withCredentials: true
    }).then(() => {
        callback()
    }).catch((error: any) => {
        console.warn(error)
        if (onError) {
            onError(error)
        }
    })
}

// ========== ВКЛЮЧИТЬ/ВЫКЛЮЧИТЬ ФОТО ==========
export const toggleInstagramPhoto = function(
    id: number,
    callback: (val: InstagramPhoto) => void,
    onError?: (error: any) => void
) {
    axios({
        method: 'patch',
        url: `${API_URL}/admin/instagram/${id}/toggle`,
        headers: {},
        withCredentials: true
    }).then((res: any) => {
        callback(res.data)
    }).catch((error: any) => {
        console.warn(error)
        if (onError) {
            onError(error)
        }
    })
}

// ========== SSR - ПОЛУЧИТЬ ФОТО НА СЕРВЕРЕ ==========
// ========== SSR - ПОЛУЧИТЬ ФОТО НА СЕРВЕРЕ ==========
export async function getInstagramPhotosServer(): Promise<InstagramPhoto[]> {
    try {
        const res = await fetch(`${API_URL}/instagram`, {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });
        
        if (!res.ok) {
            throw new Error(`Failed to fetch instagram photos: ${res.status}`);
        }
        
        const data = await res.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching instagram photos:', error);
        return [];
    }
}

// ========== SSR - ПОЛУЧИТЬ ФОТО ДЛЯ АДМИНА НА СЕРВЕРЕ ==========
export async function getAdminInstagramPhotosServer(): Promise<AdminInstagramResponse> {
    try {
        const res = await fetch(`${API_URL}/admin/instagram`, {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });
        
        if (!res.ok) {
            throw new Error(`Failed to fetch admin instagram photos: ${res.status}`);
        }
        
        const data = await res.json();
        return data || {
            photos: [],
            total: 0,
            active: 0,
            max: 20,
            can_add: true
        };
    } catch (error) {
        console.error('Error fetching admin instagram photos:', error);
        return {
            photos: [],
            total: 0,
            active: 0,
            max: 20,
            can_add: true
        };
    }
}
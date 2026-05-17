// src/providers/adminProvider.ts
import axios from 'axios';
import { BannerFormData } from 'src/types/adminBanners';


const adminApi = axios.create({
    baseURL: `${API_URL}/admin`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});



export const getBannersAndFilters = async () => {
    const response = await adminApi.get('/banners/filters');
    return response.data;
};
export const getBanners = async () => {
    const response = await adminApi.get('/banners');
    console.debug('Banners response:', response);
    return response.data;
};




export const updateAdminBanner = async (
  id: number,
  data: BannerFormData,
  callback: (response: { message: string }) => void
): Promise<void> => {
  try {
    const response = await adminApi.put(`/admin/banners/${id}`, data);
    callback(response.data);
  } catch (error) {
    console.error('Error updating banner:', error);
    throw error;
  }
};
export const deleteAdminBanner = async (
  id: number,
): Promise<any> => {
  try {
    const response = await adminApi.delete(`/banners/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting banner:', error);
    throw error;
  }
};


export const createAdminBanner = async (
  data: BannerFormData,
): Promise<any> => {
  try {
    const response = await adminApi.post('/banners', data, {
      headers: {
        'Content-Type': 'multipart/form-data', // Явно указываем
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating banner:', error);
    throw error;
  }
};

adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Перенаправление на страницу логина при истечении сессии
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);
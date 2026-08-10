// src/store/reducers/instagramSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface InstagramPhoto {
    id: number;
    image_url: string;
    is_active: boolean;
    created_at: string;
}

interface InstagramState {
    photos: InstagramPhoto[];
    loading: boolean;
    error: string | null;
}

const initialState: InstagramState = {
    photos: [],
    loading: false,
    error: null
};

const instagramSlice = createSlice({
    name: 'instagram',
    initialState,
    reducers: {
        // Установить фото (для SSR)
        setInstagramPhotos: (state, action: PayloadAction<InstagramPhoto[]>) => {
            state.photos = action.payload;
            state.loading = false;
            state.error = null;
        },
        
        // Добавить одно фото
        addInstagramPhoto: (state, action: PayloadAction<InstagramPhoto>) => {
            state.photos.unshift(action.payload);
        },
        
        // Добавить несколько фото
        addInstagramPhotos: (state, action: PayloadAction<InstagramPhoto[]>) => {
            state.photos = [...action.payload, ...state.photos];
        },
        
        // Удалить фото
        removeInstagramPhoto: (state, action: PayloadAction<number>) => {
            state.photos = state.photos.filter(photo => photo.id !== action.payload);
        },
        
        // Обновить фото (для toggle)
        updateInstagramPhoto: (state, action: PayloadAction<InstagramPhoto>) => {
            const index = state.photos.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.photos[index] = action.payload;
            }
        },
        
        // Очистить все фото
        clearInstagramPhotos: (state) => {
            state.photos = [];
            state.loading = false;
            state.error = null;
        },
        
        // Статус загрузки
        setInstagramLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        
        // Ошибка
        setInstagramError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        }
    }
});

// Экспортируем actions
export const {
    setInstagramPhotos,
    addInstagramPhoto,
    addInstagramPhotos,
    removeInstagramPhoto,
    updateInstagramPhoto,
    clearInstagramPhotos,
    setInstagramLoading,
    setInstagramError
} = instagramSlice.actions;

export default instagramSlice.reducer;
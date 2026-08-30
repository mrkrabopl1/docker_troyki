// src/store/reducers/loadingSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoadingState {
    isLoading: boolean;
    totalImages: number;
    loadedCount: number;
    isHydrated: boolean; // 👈 Добавляем флаг гидратации
}

const initialState: LoadingState = {
    isLoading: true,
    totalImages: 0,
    loadedCount: 0,
    isHydrated: false, // 👈 По умолчанию false
};

export const loadingSlice = createSlice({
    name: 'loading',
    initialState,
    reducers: {
        startLoading: (state) => {
            state.isLoading = true;
            state.loadedCount = 0;
        },
        addImageToLoad: (state, action: PayloadAction<number>) => {
            state.totalImages += action.payload;
        },
        imageLoaded: (state) => {
            state.loadedCount += 1;
        },
        finishLoading: (state) => {
            state.isLoading = false;
        },
        setHydrated: (state) => {
            state.isHydrated = true; // 👈 Отмечаем, что гидратация завершена
        },
        resetLoading: (state) => {
            state.isLoading = true;
            state.totalImages = 0;
            state.loadedCount = 0;
            state.isHydrated = false;
        }
    }
});

export const { 
    startLoading, 
    addImageToLoad, 
    imageLoaded, 
    finishLoading,
    setHydrated,
    resetLoading 
} = loadingSlice.actions;

export default loadingSlice.reducer;
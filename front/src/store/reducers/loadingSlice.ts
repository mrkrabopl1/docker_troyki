// src/store/reducers/loadingSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoadingState {
    isLoading: boolean;
    loadedImages: Set<string>; // или используйте массив
    totalImages: number;
    loadedCount: number;
}

const initialState: LoadingState = {
    isLoading: true,
    loadedImages: new Set(),
    totalImages: 0,
    loadedCount: 0
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
        resetLoading: (state) => {
            state.isLoading = true;
            state.totalImages = 0;
            state.loadedCount = 0;
        }
    }
});

export const { 
    startLoading, 
    addImageToLoad, 
    imageLoaded, 
    finishLoading,
    resetLoading 
} = loadingSlice.actions;

export default loadingSlice.reducer;
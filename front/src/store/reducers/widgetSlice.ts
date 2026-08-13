// src/store/reducers/widgetSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SliderData {
  [key: string]: {
    name: string;
    products: any[];
    collection_slug: string;
  };
}

export interface WidgetState {
  pageInfo: SliderData;
  loading: boolean;
  error: string | null;
  // Можно добавить другие данные для виджетов
  banners: any[];
  mainInfo: any;
}

const initialState: WidgetState = {
  pageInfo: {},
  loading: false,
  error: null,
  banners: [],
  mainInfo: {},
};

const widgetSlice = createSlice({
  name: 'widget',
  initialState,
  reducers: {
    // Установить pageInfo (для SSR)
    setPageInfo: (state, action: PayloadAction<SliderData>) => {
      state.pageInfo = action.payload;
      state.loading = false;
    },
    
    // Установить баннеры
    setBanners: (state, action: PayloadAction<any[]>) => {
      state.banners = action.payload;
    },
    
    // Установить mainInfo
    setMainInfo: (state, action: PayloadAction<any>) => {
      state.mainInfo = action.payload;
    },
    
    // Установить все данные виджетов (для SSR)
    setWidgetData: (state, action: PayloadAction<{
      pageInfo?: SliderData;
      banners?: any[];
      mainInfo?: any;
    }>) => {
      const { pageInfo, banners, mainInfo } = action.payload;
      if (pageInfo) state.pageInfo = pageInfo;
      if (banners) state.banners = banners;
      if (mainInfo) state.mainInfo = mainInfo;
      state.loading = false;
    },
    
    // Статус загрузки
    setWidgetLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Ошибка
    setWidgetError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // Очистить все
    clearWidgetData: (state) => {
      state.pageInfo = {};
      state.banners = [];
      state.mainInfo = {};
      state.error = null;
      state.loading = false;
    },
  },
});

// Экспортируем actions
export const {
  setPageInfo,
  setBanners,
  setMainInfo,
  setWidgetData,
  setWidgetLoading,
  setWidgetError,
  clearWidgetData,
} = widgetSlice.actions;

export default widgetSlice.reducer;
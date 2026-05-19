import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "../store";
import { useState, useEffect, useRef } from 'react';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
};
const useContentHeight = () => {
    const [contentHeight, setContentHeight] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const element = contentRef.current;
      if (!element) return;
  
      // Функция для обновления высоты
      const updateHeight = () => {
        const height = element.getBoundingClientRect().height;
        setContentHeight(height);
      };
  
      // Инициализация начальной высоты
      updateHeight();
  
      // Создание наблюдателя за изменениями размеров
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === element) {
            setContentHeight(entry.contentRect.height);
          }
        }
      });
  
      observer.observe(element);
  
      // Очистка при размонтировании
      return () => {
        observer.disconnect();
      };
    }, []);
  
    return { 
      contentRef, 
      contentHeight
    };
  };
  
  export { useContentHeight, useMediaQuery };
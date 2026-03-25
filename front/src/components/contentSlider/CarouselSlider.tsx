import React, { 
    useEffect, 
    useRef, 
    useState,
    useMemo,
    ReactElement, 
    CSSProperties,
    memo,
    useCallback
} from 'react';

interface ICarouselSliderProps {
    /** Массив элементов для прокрутки */
    items: ReactElement[];
    /** Дополнительный CSS-класс */
    className?: string;
    /** Скорость прокрутки (пикселей в секунду) */
    speed?: number;
    /** Направление прокрутки: 'left' или 'right' */
    direction?: 'left' | 'right';
    /** Пауза при наведении мыши */
    pauseOnHover?: boolean;
    /** Высота слайдера */
    height?: string | number;
    /** Ширина одного элемента */
    itemWidth?: string | number;
    /** Отступ между элементами */
    gap?: string | number;
}

const CarouselSlider: React.FC<ICarouselSliderProps> = ({
    items,
    className = '',
    speed = 50,
    direction = 'left',
    pauseOnHover = true,
    height = '200px',
    itemWidth = 'auto',
    gap = '20px'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const scrollPositionRef = useRef(0);
    const [isPaused, setIsPaused] = useState(false);
    
    // Создаем достаточно клонов для бесконечной прокрутки
    const duplicatedItems = useMemo(() => {
        if (items.length === 0) return [];
        // Чем больше клонов, тем плавнее прокрутка
        const clonesCount = 5;
        return Array(clonesCount).fill(items).flat();
    }, [items]);

    // Функция анимации
    const animate = useCallback(() => {
        if (!containerRef.current || !trackRef.current || isPaused) {
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        const container = containerRef.current;
        const track = trackRef.current;
        
        // Обновляем позицию в зависимости от направления
        const step = speed * 0.016; // 0.016 ~ 60fps
        scrollPositionRef.current += direction === 'left' ? -step : step;
        
        const trackWidth = track.scrollWidth / 5; // Ширина одного набора (делим на количество клонов)
        
        // Сброс позиции для создания бесконечного эффекта
        if (direction === 'left' && Math.abs(scrollPositionRef.current) >= trackWidth) {
            scrollPositionRef.current = 0;
        } else if (direction === 'right' && scrollPositionRef.current >= trackWidth) {
            scrollPositionRef.current = 0;
        }
        
        track.style.transform = `translateX(${scrollPositionRef.current}px)`;
        
        animationRef.current = requestAnimationFrame(animate);
    }, [direction, speed, isPaused]);

    // Запуск анимации
    useEffect(() => {
        if (items.length === 0) return;
        
        animationRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animate, items.length]);

    // Обработчики паузы при наведении
    const handleMouseEnter = useCallback(() => {
        if (pauseOnHover) {
            setIsPaused(true);
        }
    }, [pauseOnHover]);

    const handleMouseLeave = useCallback(() => {
        if (pauseOnHover) {
            setIsPaused(false);
        }
    }, [pauseOnHover]);

    // Стили для контейнера
    const containerStyle: CSSProperties = useMemo(() => ({
        overflow: 'hidden',
        width: '100%',
        height,
        position: 'relative'
    }), [height]);

    // Стили для трека
    const trackStyle: CSSProperties = useMemo(() => ({
        display: 'flex',
        gap,
        height: '100%',
        width: 'fit-content',
        willChange: 'transform'
    }), [gap]);

    // Стили для элемента
    const itemStyle: CSSProperties = useMemo(() => ({
        flex: itemWidth === 'auto' ? '0 0 auto' : `0 0 ${itemWidth}`,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }), [itemWidth]);

    if (items.length === 0) {
        return <div style={containerStyle} />;
    }

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            className={`carousel-slider ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={trackRef}
                style={trackStyle}
            >
                {duplicatedItems.map((item, index) => (
                    <div
                        key={`slide-${index}`}
                        style={itemStyle}
                        className="carousel-slide"
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default memo(CarouselSlider);
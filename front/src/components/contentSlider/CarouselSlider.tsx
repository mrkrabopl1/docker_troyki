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
    items: ReactElement[];
    className?: string;
    speed?: number;
    direction?: 'left' | 'right';
    pauseOnHover?: boolean;
    height?: string | number;
    itemWidth?: string | number;
    gap?: string | number;
}

const CarouselSlider: React.FC<ICarouselSliderProps> = ({
    items,
    className = '',
    speed = 50,
    direction = 'left',
    pauseOnHover = true,
    height = '100%',
    itemWidth = '200px',
    gap = '20px'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const scrollPositionRef = useRef(0);
    const [isPaused, setIsPaused] = useState(false);
    const [totalWidth, setTotalWidth] = useState(0);

    // Создаем достаточное количество клонов для заполнения экрана
    const duplicatedItems = useMemo(() => {
        if (items.length === 0) return [];
        
        // Вычисляем ширину одного элемента с учетом отступа
        const itemWidthNum = typeof itemWidth === 'number' ? itemWidth : parseInt(itemWidth) || 200;
        const gapNum = typeof gap === 'number' ? gap : parseInt(gap) || 20;
        const itemWithGap = itemWidthNum + gapNum;
        
        // Минимальное количество копий, чтобы заполнить экран
        const minCopies = Math.ceil(window.innerWidth / (itemWithGap * items.length)) + 2;
        const copiesCount = Math.max(3, minCopies);
        
        return Array(copiesCount).fill(items).flat();
    }, [items, itemWidth, gap]);

    // Анимация
    const animate = useCallback(() => {
        if (!trackRef.current || isPaused) {
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        const step = speed * 0.016;
        scrollPositionRef.current += direction === 'left' ? -step : step;
        
        // Сброс для непрерывности
        if (totalWidth > 0) {
            if (direction === 'left' && Math.abs(scrollPositionRef.current) >= totalWidth) {
                scrollPositionRef.current = 0;
            } else if (direction === 'right' && scrollPositionRef.current >= totalWidth) {
                scrollPositionRef.current = 0;
            }
        }
        
        trackRef.current.style.transform = `translateX(${scrollPositionRef.current}px)`;
        animationRef.current = requestAnimationFrame(animate);
    }, [direction, speed, isPaused, totalWidth]);

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

    // Измерение ширины
    useEffect(() => {
        const measureWidth = () => {
            if (trackRef.current) {
                const track = trackRef.current;
                // Вычисляем ширину одного набора элементов
                const singleSetWidth = track.scrollWidth / duplicatedItems.length * items.length;
                setTotalWidth(singleSetWidth);
            }
        };

        measureWidth();
        
        const observer = new ResizeObserver(measureWidth);
        if (trackRef.current) {
            observer.observe(trackRef.current);
        }
        
        window.addEventListener('resize', measureWidth);
        
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measureWidth);
        };
    }, [duplicatedItems, items.length]);

    const containerStyle: CSSProperties = {
        overflow: 'hidden',
        width: '100%',
        height,
        position: 'relative'
    };

    const trackStyle: CSSProperties = {
        display: 'flex',
        gap,
        height: '100%',
        width: 'fit-content',
        willChange: 'transform'
    };

    const itemStyle: CSSProperties = {
        flex: itemWidth === 'auto' ? '0 0 auto' : `0 0 ${itemWidth}`,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    if (items.length === 0) {
        return <div style={containerStyle} />;
    }

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            className={`carousel-slider ${className}`}
            onMouseEnter={() => pauseOnHover && setIsPaused(true)}
            onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        >
            <div ref={trackRef} style={trackStyle}>
                {duplicatedItems.map((item, index) => (
                    <div key={`slide-${index}`} style={itemStyle}>
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default memo(CarouselSlider);
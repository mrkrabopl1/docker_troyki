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
    const [singleSetWidth, setSingleSetWidth] = useState(0);
    const [copiesCount, setCopiesCount] = useState(3);
    const [isReady, setIsReady] = useState(false);

    // Вычисляем количество копий для заполнения экрана
    const duplicatedItems = useMemo(() => {
        if (items.length === 0) return [];
        return Array(Math.max(3, copiesCount)).fill(items).flat();
    }, [items, copiesCount]);

    // Анимация с плавным переходом
    const animate = useCallback(() => {
        if (!trackRef.current || isPaused || items.length === 0 || !isReady || singleSetWidth === 0) {
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        const step = speed * 0.016;
        const directionMultiplier = direction === 'left' ? -1 : 1;
        scrollPositionRef.current += step * directionMultiplier;

        // Плавный сброс - возвращаем на один набор вперед/назад
        if (direction === 'left') {
            // При движении влево: если дошли до конца второго набора
            if (Math.abs(scrollPositionRef.current) >= singleSetWidth * 2) {
                // Перемещаемся на один набор вперед (вправо)
                scrollPositionRef.current += singleSetWidth;
            }
        } else {
            // При движении вправо: если дошли до начала
            if (scrollPositionRef.current >= 0) {
                // Перемещаемся на один набор назад (влево)
                scrollPositionRef.current -= singleSetWidth;
            }
        }
        
        trackRef.current.style.transform = `translateX(${scrollPositionRef.current}px)`;
        animationRef.current = requestAnimationFrame(animate);
    }, [direction, speed, isPaused, singleSetWidth, items.length, isReady]);

    // Запуск анимации
    useEffect(() => {
        if (items.length === 0 || !isReady || singleSetWidth === 0) return;
        
        // Останавливаем предыдущую анимацию
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        
        animationRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animate, items.length, isReady, singleSetWidth]);

    // Измерение ширины и расчет количества копий
    useEffect(() => {
        const calculateCopies = () => {
            if (!containerRef.current || items.length === 0) return;

            const containerWidth = containerRef.current.offsetWidth;
            const itemWidthNum = typeof itemWidth === 'number' ? itemWidth : parseInt(itemWidth) || 200;
            const gapNum = typeof gap === 'number' ? gap : parseInt(gap) || 20;
            const itemWithGap = itemWidthNum + gapNum;
            
            const itemsNeeded = Math.ceil(containerWidth / itemWithGap) + 2;
            const neededCopies = Math.max(3, Math.ceil(itemsNeeded / items.length) + 1);
            
            setCopiesCount(neededCopies);
        };

        calculateCopies();
        
        const observer = new ResizeObserver(calculateCopies);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        
        window.addEventListener('resize', calculateCopies);
        
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', calculateCopies);
        };
    }, [items.length, itemWidth, gap]);

    // Измерение ширины одного набора и установка начальной позиции
    useEffect(() => {
        const measureAndSetPosition = () => {
            if (!trackRef.current || items.length === 0 || copiesCount === 0) return;
            
            const track = trackRef.current;
            const trackWidth = track.scrollWidth;
            const singleSet = trackWidth / copiesCount;
            
            if (singleSet === 0 || !isFinite(singleSet)) return;
            
            setSingleSetWidth(singleSet);
            
            // Начинаем с первого набора (позиция 0)
            scrollPositionRef.current = 0;
            track.style.transform = `translateX(0px)`;
            track.style.transition = 'none';
            
            setIsReady(true);
        };

        // Ждем рендера
        const timeoutId = setTimeout(() => {
            requestAnimationFrame(measureAndSetPosition);
        }, 100);
        
        return () => {
            clearTimeout(timeoutId);
        };
    }, [duplicatedItems, items.length, copiesCount]);

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
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
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
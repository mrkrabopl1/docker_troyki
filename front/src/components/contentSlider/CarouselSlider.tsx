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
    hoverSlowdown?: number; // Коэффициент замедления (0.1 - 0.9, где 0.1 - очень медленно, 0.9 - почти без замедления)
    slowdownEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

const CarouselSlider: React.FC<ICarouselSliderProps> = ({
    items,
    className = '',
    speed = 50,
    direction = 'left',
    pauseOnHover = true,
    height = '100%',
    itemWidth = '200px',
    gap = '20px',
    hoverSlowdown = 0.3,
    slowdownEasing = 'ease-in-out'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const scrollPositionRef = useRef(0);
    const [isPaused, setIsPaused] = useState(false);
    const [singleSetWidth, setSingleSetWidth] = useState(0);
    const [copiesCount, setCopiesCount] = useState(3);
    const [isReady, setIsReady] = useState(false);
    const [currentSpeedMultiplier, setCurrentSpeedMultiplier] = useState(1);
    const animationStartTimeRef = useRef<number>(0);
    const targetSpeedMultiplierRef = useRef<number>(1);
    const currentSpeedMultiplierRef = useRef<number>(1);

    // Функция для плавного изменения скорости
    const easeInOut = (t: number): number => {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };

    // Вычисляем количество копий для заполнения экрана
    const duplicatedItems = useMemo(() => {
        if (items.length === 0) return [];
        return Array(Math.max(3, copiesCount)).fill(items).flat();
    }, [items, copiesCount]);

    // Анимация с плавным изменением скорости
    const animate = useCallback((timestamp: number) => {
        if (!trackRef.current || items.length === 0 || !isReady || singleSetWidth === 0) {
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        // Плавное изменение скорости
        if (animationStartTimeRef.current === 0) {
            animationStartTimeRef.current = timestamp;
        }

        const deltaTime = timestamp - animationStartTimeRef.current;
        const duration = 300; // Длительность перехода в мс

        // Плавное приближение к целевой скорости
        const currentMult = currentSpeedMultiplierRef.current;
        const targetMult = targetSpeedMultiplierRef.current;
        const diff = targetMult - currentMult;

        if (Math.abs(diff) > 0.001) {
            // Используем easing для плавного перехода
            const progress = Math.min(deltaTime / duration, 1);
            const easedProgress = easeInOut(progress);
            const newMult = currentMult + diff * easedProgress;
            currentSpeedMultiplierRef.current = newMult;
            setCurrentSpeedMultiplier(newMult);
        } else {
            currentSpeedMultiplierRef.current = targetMult;
            setCurrentSpeedMultiplier(targetMult);
            animationStartTimeRef.current = timestamp;
        }

        const effectiveSpeed = speed * currentSpeedMultiplierRef.current;
        const step = effectiveSpeed * 0.016;
        const directionMultiplier = direction === 'left' ? -1 : 1;
        scrollPositionRef.current += step * directionMultiplier;

        // Плавный сброс
        if (direction === 'left') {
            if (Math.abs(scrollPositionRef.current) >= singleSetWidth * 2) {
                scrollPositionRef.current += singleSetWidth;
            }
        } else {
            if (scrollPositionRef.current >= 0) {
                scrollPositionRef.current -= singleSetWidth;
            }
        }
        
        trackRef.current.style.transform = `translateX(${scrollPositionRef.current}px)`;
        animationRef.current = requestAnimationFrame(animate);
    }, [direction, speed, singleSetWidth, items.length, isReady]);

    // Запуск анимации
    useEffect(() => {
        if (items.length === 0 || !isReady || singleSetWidth === 0) return;
        
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        
        animationStartTimeRef.current = 0;
        animationRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animate, items.length, isReady, singleSetWidth]);

    // Обработчики наведения с плавным замедлением
    const handleMouseEnter = useCallback(() => {
        if (pauseOnHover) {
            setIsPaused(true);
            targetSpeedMultiplierRef.current = hoverSlowdown;
            animationStartTimeRef.current = 0;
        }
    }, [pauseOnHover, hoverSlowdown]);

    const handleMouseLeave = useCallback(() => {
        if (pauseOnHover) {
            setIsPaused(false);
            targetSpeedMultiplierRef.current = 1;
            animationStartTimeRef.current = 0;
        }
    }, [pauseOnHover]);

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
            scrollPositionRef.current = 0;
            track.style.transform = `translateX(0px)`;
            track.style.transition = 'none';
            setIsReady(true);
        };

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
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
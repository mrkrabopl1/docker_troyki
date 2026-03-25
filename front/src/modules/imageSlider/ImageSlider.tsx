import React, { useState, useMemo, memo, useCallback } from 'react';
import ImagePresentationBlock from 'src/components/imagesPresantation/ImagePresentationBlock';
import CarouselSlider from 'src/components/contentSlider/CarouselSlider';

interface IImageGallerySliderProps {
    /** Массив путей к изображениям */
    images: string[];
    /** Дополнительный CSS-класс */
    className?: string;
    /** Высота слайдера */
    height?: string | number;
    /** Скорость автоматической прокрутки в мс (0 - отключить) */
    autoScrollSpeed?: number;
    /** Направление прокрутки */
    direction?: 'left' | 'right';
    /** Продолжительность анимации перехода */
    transitionDuration?: number;
    /** Пауза при наведении */
    pauseOnHover?: boolean;
    /** Отступ между изображениями */
    gap?: string | number;
    /** Ширина каждого изображения */
    itemWidth?: string | number;
    /** Обработчик клика по изображению (передает путь к изображению) */
    onImageClick?: (imagePath: string) => void;
    /** Обработчик наведения на изображение */
    onImageHover?: (imagePath: string) => void;
    /** Обработчик ухода мыши с изображения */
    onImageOut?: () => void;
}

const ImageGallerySlider: React.FC<IImageGallerySliderProps> = ({
    images,
    className = '',
    height = '200px',
    autoScrollSpeed = 3000,
    direction = 'left',
    transitionDuration = 500,
    pauseOnHover = true,
    gap = '20px',
    itemWidth = 'auto',
    onImageClick,
    onImageHover,
    onImageOut
}) => {
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);

    // Создаем массив компонентов ImagePresentationBlock
    const imageBlocks = useMemo(() => {
        return images.map((imagePath, index) => (
            <ImagePresentationBlock
                key={`${imagePath}-${index}`}
                image={imagePath}
                onClick={() => onImageClick?.(imagePath)}
                onHover={(path) => {
                    setHoveredImage(path);
                    onImageHover?.(path);
                }}
                onOut={() => {
                    setHoveredImage(null);
                    onImageOut?.();
                }}
            />
        ));
    }, [images, onImageClick, onImageHover, onImageOut]);

    return (
        <div className={className}>
            <CarouselSlider
                items={imageBlocks}
            
                direction={direction}
              
                pauseOnHover={pauseOnHover}
                height={height}
                itemWidth={itemWidth}
                gap={gap}
            />
        </div>
    );
};

export default memo(ImageGallerySlider);
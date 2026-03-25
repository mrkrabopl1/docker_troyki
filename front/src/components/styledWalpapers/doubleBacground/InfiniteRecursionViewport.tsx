import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from './style.module.css';

const RecursivePortal = () => {
  const containerRef = useRef(null);
  const [position, setPosition] = useState({ x: 200, y: 200 });
  const [radius, setRadius] = useState(50);
  const [currentImage, setCurrentImage] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetRadius, setTargetRadius] = useState(50);

  // Массив изображений для рекурсии
  const imageSources = [
    '1.jpg',
    '2.jpg',
  ];

  // Загрузка изображений
  useEffect(() => {
    let loadedCount = 0;
    imageSources.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === imageSources.length) {
          setAllImagesLoaded(true);
        }
      };
    });
  }, []);

  // Обновление размеров контейнера
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
        
        setPosition({
          x: rect.width / 2,
          y: rect.height / 2
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Получаем радиус полного закрытия
  const getFullCoverRadius = useCallback(() => {
    if (!containerSize.width || !containerSize.height) return 1000;
    const centerX = position.x;
    const centerY = position.y;
    const distanceToCorner = Math.sqrt(
      Math.pow(Math.max(centerX, containerSize.width - centerX), 2) +
      Math.pow(Math.max(centerY, containerSize.height - centerY), 2)
    );
    return distanceToCorner + 50;
  }, [position, containerSize]);

  const minRadius = 30;
  const fullRadius = getFullCoverRadius();

  // Плавная анимация радиуса
  useEffect(() => {
    if (!isAnimating) return;
    
    const startRadius = radius;
    const endRadius = targetRadius;
    const duration = 300;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Используем ease-in-out для плавности
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      const newRadius = startRadius + (endRadius - startRadius) * easeProgress;
      setRadius(newRadius);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setRadius(endRadius);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isAnimating, targetRadius, radius]);

  // Обработчики нажатия/отпускания мыши
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsMousePressed(true);
      
      if (isAnimating) return;
      
      if (e.button === 0) {
        // Левая кнопка - переход к следующему изображению
        setIsAnimating(true);
        setTargetRadius(fullRadius);
        
        setTimeout(() => {
          setCurrentImage((prev) => (prev + 1) % imageSources.length);
          setTargetRadius(minRadius);
        }, 150);
      } else if (e.button === 2) {
        // Правая кнопка - переход к предыдущему изображению
        setIsAnimating(true);
        setTargetRadius(fullRadius);
        
        setTimeout(() => {
          setCurrentImage((prev) => (prev - 1 + imageSources.length) % imageSources.length);
          setTargetRadius(minRadius);
        }, 150);
      }
    };

    const handleMouseUp = () => {
      setIsMousePressed(false);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('contextmenu', handleContextMenu);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, [fullRadius, minRadius, isAnimating, imageSources.length]);

  // Обработчик движения мыши
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || isAnimating) return;

    const rect = containerRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Ограничиваем движение, чтобы круг не выходил за границы
    const currentRadius = radius;
    x = Math.max(currentRadius, Math.min(x, rect.width - currentRadius));
    y = Math.max(currentRadius, Math.min(y, rect.height - currentRadius));

    setPosition({ x, y });
  }, [radius, isAnimating]);

  // if (!allImagesLoaded) {
  //   return <div className={styles.loading}>Loading...</div>;
  // }

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onMouseMove={handleMouseMove}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Фоновое изображение */}
      <img
        src={imageSources[currentImage]}
        alt="background"
        className={styles.backgroundImage}
      />

      {/* Активное изображение с отверстием */}
      <div
        className={styles.activeLayer}
        style={{
          clipPath: `circle(${radius}px at ${position.x}px ${position.y}px)`,
          WebkitClipPath: `circle(${radius}px at ${position.x}px ${position.y}px)`,
        }}
      >
        <img
          src={imageSources[(currentImage + 1) % imageSources.length]}
          alt="active"
          className={styles.layerImage}
        />
      </div>

      {/* Граница отверстия */}
      <div
        className={`${styles.viewportBorder} ${isMousePressed ? styles.active : ''}`}
        style={{
          width: radius * 2,
          height: radius * 2,
          left: position.x - radius,
          top: position.y - radius,
        }}
      />
    </div>
  );
};

export default RecursivePortal;
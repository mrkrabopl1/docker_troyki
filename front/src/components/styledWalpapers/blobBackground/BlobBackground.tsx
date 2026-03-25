import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from './style.module.css';

const AdvancedBlobPortal = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const [time, setTime] = useState(0);
  
  const imageSources = {
    background: '1.jpg',
    blob: '2.jpg'
  };

  // Загрузка изображений
  useEffect(() => {
    let loadedCount = 0;
    const images = [imageSources.background, imageSources.blob];
    
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === images.length) {
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

  // Генерация сложной формы кляксы
  const drawBlob = useCallback((ctx, centerX, centerY, time) => {
    const baseRadius = Math.min(containerSize.width, containerSize.height) * 0.15;
    const points = [];
    const numPoints = 30;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
      // Сложные искажения для органической формы
      const wave1 = Math.sin(angle * 5 + time * 2) * 0.3;
      const wave2 = Math.cos(angle * 3 + time * 1.3) * 0.25;
      const wave3 = Math.sin(angle * 7 + time * 0.7) * 0.2;
      const wave4 = Math.cos(angle * 2 + time) * 0.15;
      
      // Добавляем случайность
      const noise = (Math.random() * 0.2) - 0.1;
      
      const r = baseRadius * (0.7 + wave1 + wave2 + wave3 + wave4 + noise);
      
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      points.push({ x, y });
    }
    
    return points;
  }, [containerSize]);

  // Анимация
  useEffect(() => {
    if (!containerSize.width) return;

    const animate = () => {
      setTime(prev => prev + 0.03);
    };

    const interval = setInterval(animate, 30);
    return () => clearInterval(interval);
  }, [containerSize]);

  // Отрисовка
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !allImagesLoaded || !containerSize.width) return;

    canvas.width = containerSize.width;
    canvas.height = containerSize.height;

    // Фоновое изображение
    const bgImage = new Image();
    bgImage.src = imageSources.background;
    
    // Изображение для кляксы
    const blobImage = new Image();
    blobImage.src = imageSources.blob;

    Promise.all([
      new Promise(resolve => { bgImage.onload = resolve; }),
      new Promise(resolve => { blobImage.onload = resolve; })
    ]).then(() => {
      // Рисуем фон
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

      // Получаем точки для кляксы
      const blobPoints = drawBlob(ctx, position.x, position.y, time);

      // Создаем градиент для кляксы
      const gradient = ctx.createRadialGradient(
        position.x, position.y, 0,
        position.x, position.y, Math.min(containerSize.width, containerSize.height) * 0.2
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      // Рисуем кляксу с изображением
      ctx.save();
      
      // Создаем путь кляксы
      ctx.beginPath();
      ctx.moveTo(blobPoints[0].x, blobPoints[0].y);
      
      for (let i = 1; i < blobPoints.length; i++) {
        // Используем кривые Безье для сглаживания
        const p1 = blobPoints[i];
        const p2 = blobPoints[(i + 1) % blobPoints.length];
        const cp1x = (p1.x + p2.x) / 2;
        const cp1y = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, cp1x, cp1y);
      }
      
      ctx.closePath();

      // Применяем маску
      ctx.clip();

      // Рисуем изображение внутри кляксы
      ctx.drawImage(blobImage, 0, 0, canvas.width, canvas.height);

      ctx.restore();

      // Рисуем красивый контур кляксы
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(blobPoints[0].x, blobPoints[0].y);
      
      for (let i = 1; i < blobPoints.length; i++) {
        const p1 = blobPoints[i];
        const p2 = blobPoints[(i + 1) % blobPoints.length];
        const cp1x = (p1.x + p2.x) / 2;
        const cp1y = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, cp1x, cp1y);
      }
      
      ctx.closePath();
      
      // Внешний контур
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Внутреннее свечение
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Добавляем эффект свечения
      ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      ctx.restore();

      // Добавляем небольшие капли вокруг
      for (let i = 0; i < 5; i++) {
        const angle = (time + i) * 2;
        const dist = Math.min(containerSize.width, containerSize.height) * 0.12;
        const x = position.x + Math.cos(angle) * dist;
        const y = position.y + Math.sin(angle) * dist;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
      }
    });

  }, [containerSize, position, time, allImagesLoaded, drawBlob]);

  // Обработчик движения мыши
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const radius = Math.min(containerSize.width, containerSize.height) * 0.15;
    x = Math.max(radius, Math.min(x, rect.width - radius));
    y = Math.max(radius, Math.min(y, rect.height - radius));

    setPosition({ x, y });
  }, [containerSize]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onMouseMove={handleMouseMove}
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
      />
      
      {/* Декоративный элемент для динамического освещения */}
      <div 
        className={styles.lightEffect}
        style={{
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, 
                      rgba(255, 255, 255, 0.1) 0%, 
                      transparent 70%)`
        }}
      />
    </div>
  );
};

export default AdvancedBlobPortal;
import React, { ReactElement, useRef, useState, memo, useCallback } from 'react';
import s from "./style.module.css";
import { useNavigate } from 'react-router-dom';

interface MerchInterface {
  price: number;
  size: number;
  name: string;
  imgs: string[];
  id: string;
}

const MerchShopLine: React.FC<{ width: string, data: MerchInterface }> = memo(({ width, data }) => {
  const navigate = useNavigate();
  const [compOpacity, setOpacity] = useState(1);
  const showAnimation = useRef(false);
  const currentImgIndex = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  const nextImgIndex = useCallback(() => {
    return (currentImgIndex.current + 1) % data.imgs.length;
  }, [data.imgs.length]);

  const stopAnimation = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    showAnimation.current = false;
  }, []);

  const animateTransition = useCallback((duration: number) => {
    if (!showAnimation.current || data.imgs.length <= 1) return;

    const start = performance.now();

    const animate = (time: number) => {
      const timePass = (time - start) / 1000;
      const progress = timePass / duration;
      setOpacity(1 - progress);

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        currentImgIndex.current = nextImgIndex();
        setOpacity(1);
        
        if (showAnimation.current) {
          setTimeout(() => {
            animateTransition(duration);
          }, 1000);
        }
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);
  }, [nextImgIndex, data.imgs.length]);

  const handleMouseEnter = useCallback(() => {
    if (data.imgs.length > 1) {
      showAnimation.current = true;
      animateTransition(2);
    }
  }, [animateTransition, data.imgs.length]);

  const handleClick = useCallback(() => {
    navigate('/product/' + data.id);
  }, [data.id, navigate]);

  const secondImgStyle: React.CSSProperties = {
    top: 0,
    left: 0,
    position: "absolute",
    zIndex: 0
  };

  return (
    <div
      style={{ display: "flex", width }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={stopAnimation}
      className={s.merchWrap}
    >
      <img 
        className={s.img} 
        style={{ 
          opacity: compOpacity, 
          zIndex: 2, 
          position: "relative" 
        }} 
        src={data.imgs[currentImgIndex.current]} 
        alt={data.name} 
      />
      {data.imgs.length > 1 && (
        <img 
          className={s.img} 
          style={secondImgStyle} 
          src={data.imgs[nextImgIndex()]} 
          alt={data.name} 
        />
      )}
      <div className={s.imgName}>{data.name}</div>
      <div>{data.price}</div>
      <div>{data.size}</div>
    </div>
  );
});

export default MerchShopLine; 
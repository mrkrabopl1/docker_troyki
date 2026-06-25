import React, { useRef, useEffect, useState } from 'react';

const StickySidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelBottomRef = useRef<HTMLDivElement>(null);
  const sentinelTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bottomObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsSticky(true);
        }
      },
      { threshold: 0 }
    );

    const topObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsSticky(false);
        }
      },
      { threshold: 0, rootMargin: "-20px 0px 0px 0px" }
    );

    if (sentinelBottomRef.current) {
      bottomObserver.observe(sentinelBottomRef.current);
    }
    if (sentinelTopRef.current) {
      topObserver.observe(sentinelTopRef.current);
    }

    return () => {
      bottomObserver.disconnect();
      topObserver.disconnect();
    };
  }, []);

  return (
    <div style={{ width: "25%", position: "relative" }}>
      {/* Сентинел для низа */}
      <div ref={sentinelBottomRef} style={{ position: "absolute", bottom: 0, height: 1 }} />
      
      {/* Сентинел для верха */}
      <div ref={sentinelTopRef} style={{ position: "absolute", top: 0, height: 1 }} />
      
      <div
        style={{
          position: isSticky ? "sticky" : "relative",
          top: "20px",
          height: "fit-content"
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default StickySidebar;
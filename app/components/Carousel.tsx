'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Carousel.module.css';

interface CarouselItem {
  id: string;
  src: string;
  type: 'video' | 'image';
}

const ITEMS: CarouselItem[] = [
  { id: '1', src: 'https://res.cloudinary.com/db0uijeib/video/upload/v1763878899/haritha_7_cvrncs.mp4', type: 'video' },
  { id: '2', src: 'https://res.cloudinary.com/db0uijeib/video/upload/v1765167295/SnapInsta.to_AQOZlRI59_meWgo0UDwT2TwjWHK_TVJnmRcrMqYMm-puxUzgEbSTfL3-MFJMH8IJhUvCap9j_JiwbqHM7vU_A2m2otZ-5wfi6x7V6gQ_bj3heg.mp4', type: 'video' },
  { id: '3', src: 'https://res.cloudinary.com/db0uijeib/video/upload/v1765167292/SnapInsta.to_AQOl2jbsVw4i2dmq0C4ASonoPhkVNcJAVTvHSi7_uKOkWqyNh6k_9V2GS5b89oWGeqb0TjK1d-4Rg_PTLXOF00OZPyk19bUwzbl5gWk_zzbamu.mp4', type: 'video' },
  { id: '4', src: 'https://res.cloudinary.com/db0uijeib/video/upload/v1765167292/SnapInsta.to_AQMlehpkblkmMzYzGFQB_hVSHofXQrXrTLwDwiaBcGyU4NPDDI0-pxikY5Jy3aFh6g67SHX93Zf5OgwWaoQoNUGAHEAb_1BIV9jUMGM_ltgpcj.mp4', type: 'video' },
  { id: '5', src: 'https://res.cloudinary.com/db0uijeib/video/upload/v1772166743/Keep_it_clean._localbarber_boronia_viral_italianbeard_vd7aio.mp4', type: 'video' },
];

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [xMultiplier, setXMultiplier] = useState(250);

  // Auto layout calculations
  const totalItems = ITEMS.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, handleNext, currentIndex]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setXMultiplier(100);
      } else {
        setXMultiplier(250);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 50;
      if (info.offset.x > swipeThreshold) {
        handlePrev();
      } else if (info.offset.x < -swipeThreshold) {
        handleNext();
      }
    },
    [handleNext, handlePrev]
  );

  return (
    <div id="works" className={styles.carouselSection}>
      <div className={styles.header}>
        <h2 className={styles.title}>Our Signature Styles</h2>
        <p className={styles.subtitle}>Discover the perfect look for you</p>
      </div>

      <div 
        className={styles.container}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div className={styles.scene}>
          {ITEMS.map((item, index) => {
            let offset = index - currentIndex;
            if (offset > Math.floor(totalItems / 2)) offset -= totalItems;
            if (offset < -Math.floor(totalItems / 2)) offset += totalItems;

            const isActive = offset === 0;

            const xPos = offset * xMultiplier;
            const zPos = isActive ? 0 : -100;
            const scale = isActive ? 1 : 0.8;
            const opacity = isActive ? 1 : 0.5;
            const rotateY = offset * -25;
            const zIndex = 20 - Math.abs(offset);

            return (
              <motion.div
                key={item.id}
                className={styles.cardWrapper}
                style={{ zIndex }}
                initial={false}
                animate={{
                  x: xPos,
                  z: zPos,
                  scale,
                  opacity,
                  rotateY,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 25,
                }}
                drag={isActive ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={isActive ? handleDragEnd : undefined}
                whileTap={isActive ? { cursor: "grabbing" } : {}}
              >
                <div className={`${styles.card} ${isActive ? styles.activeCard : styles.inactiveCard}`}>
                  <div className={styles.imageContainer}>
                    {item.type === 'video' ? (
                      <video 
                        src={item.src} 
                        className={styles.image} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.src} alt={`carousel-item-${item.id}`} className={styles.image} />
                    )}
                    <div className={styles.overlay} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Navigation Arrows */}
        <button className={`${styles.navButton} ${styles.prevButton}`} onClick={handlePrev} aria-label="Previous slide">
          <ChevronLeft />
        </button>
        <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext} aria-label="Next slide">
          <ChevronRight />
        </button>
      </div>

      {/* Pagination Dots */}
      <div className={styles.pagination}>
        {ITEMS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`${styles.dot} ${currentIndex === idx ? styles.activeDot : ''}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

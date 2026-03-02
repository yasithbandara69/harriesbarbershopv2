"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import styles from './GoogleReviews.module.css';

interface Review {
  id: number;
  name: string;
  time: string;
  text: string;
  initial: string;
  bgColor: string;
  rating: number;
}

const REVIEWS: Review[] = [
  { 
    id: 1, 
    name: "Joshua T", 
    time: "a month ago", 
    text: "Best barber in the area by far. Always does a great job and is a top bloke. Highly recommend.", 
    initial: "J",
    bgColor: "#e0f2fe",
    rating: 5 
  },
  { 
    id: 2, 
    name: "Lachlan C", 
    time: "3 months ago", 
    text: "Harry is an absolute legend. Always gives a fresh cut and great conversation. Best fade in Boronia!", 
    initial: "L",
    bgColor: "#fef08a",
    rating: 5 
  },
  { 
    id: 3, 
    name: "Ben W", 
    time: "4 months ago", 
    text: "Great haircut, great price, great bloke. Simple as that. The shop has a great atmosphere too.", 
    initial: "B",
    bgColor: "#e9d5ff",
    rating: 5 
  },
  { 
    id: 4, 
    name: "Dylan Roberts", 
    time: "a year ago", 
    text: "Harry is a legend. Great haircut, great chat, great price. Highly recommend to anyone looking for a reliable barber.", 
    initial: "D",
    bgColor: "#fed7aa",
    rating: 5 
  },
  { 
    id: 5, 
    name: "Will H", 
    time: "2 months ago", 
    text: "Harry is a great bloke who runs a top notch barber shop. The cuts are always exactly what you ask for.", 
    initial: "W",
    bgColor: "#475569",
    rating: 5 
  },
  { 
    id: 6, 
    name: "Matt", 
    time: "5 months ago", 
    text: "Awesome haircut as always. Harry takes his time to make sure it's perfect. Will definitely be going back.", 
    initial: "M",
    bgColor: "#bbf7d0",
    rating: 5 
  },
];

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" />
    <path fill="#34A853" d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8766 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" />
    <path fill="#FBBC05" d="M11.0051 28.6006C9.9996 25.6199 9.9996 22.3633 11.0051 19.3827V13.2008H3.02422CA -0.9545 13.916 2.0545 22.9821 2.0545 23.9916C2.0545 25.0012 -0.9545 34.0673 3.02422 34.7825L11.0051 28.6006Z" />
    <path fill="#EA4335" d="M24.48 9.49932C27.9016 9.44416 31.2086 10.7339 33.6862 13.0973L40.5387 6.24475C36.2353 2.17832 30.4468 -0.0689456 24.48 0.00161733C15.4056 0.00161733 7.10718 5.11644 3.03296 13.2008L11.0139 19.3827C12.91 13.7123 18.2187 9.49932 24.48 9.49932Z" />
  </svg>
);

export default function GoogleReviews() {
  // Double the reviews to create a seamless infinite loop
  const displayReviews = [...REVIEWS, ...REVIEWS];
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const [contentWidth, setContentWidth] = useState(0);
  const x = useMotionValue(0);
  const controls = useAnimation();

  useEffect(() => {
    if (containerRef.current) {
      // Calculate how far we can drag the marquee to the left
      // Need to subtract the viewport width from the total scrollable width
      const totalWidth = containerRef.current.scrollWidth;
      const visibleWidth = containerRef.current.offsetWidth;
      setDragConstraints({ right: 0, left: -(totalWidth - visibleWidth) });
      
      // We want to loop halfway through the doubled content
      setContentWidth(totalWidth / 2);
    }
  }, []);

  useEffect(() => {
    // Start the infinite animation loop
    if (contentWidth > 0) {
      controls.start({
        x: -contentWidth,
        transition: {
          duration: 20, // Adjust speed
          ease: "linear",
          repeat: Infinity,
        }
      });
    }
  }, [contentWidth, controls]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.heading}>What Our Clients Say</h2>
          <p className={styles.subheading}>Real reviews from Google</p>
        </div>

        <div className={styles.marqueeWrapper} ref={containerRef}>
          <motion.div 
            className={styles.marquee}
            drag="x"
            dragConstraints={dragConstraints}
            style={{ x }}
            animate={controls}
            onHoverStart={() => controls.stop()}
            onHoverEnd={() => controls.start({
              x: -contentWidth,
              transition: { duration: 20, ease: "linear", repeat: Infinity }
            })}
            whileTap={{ cursor: "grabbing" }}
          >
            {displayReviews.map((review, idx) => (
              <div key={`${review.id}-${idx}`} className={styles.reviewCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.authorInfo}>
                    <div 
                      className={styles.avatar} 
                      style={{ backgroundColor: review.bgColor, color: review.bgColor === '#475569' ? '#fff' : '#000' }}
                    >
                      {review.initial}
                    </div>
                    <div>
                      <h4 className={styles.authorName}>{review.name}</h4>
                      <p className={styles.reviewTime}>{review.time}</p>
                    </div>
                  </div>
                  <GoogleLogo />
                </div>
                
                <div className={styles.ratingInfo}>
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="#fbbc04" color="#fbbc04" />
                    ))}
                  </div>
                  <CheckCircle size={16} color="#3b82f6" fill="#eff6ff" className={styles.verifiedIcon} />
                </div>

                <p className={styles.reviewText}>{review.text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

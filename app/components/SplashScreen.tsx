"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./splash-screen.module.css";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Lock scroll when component mounts
    document.body.style.overflow = "hidden";

    const minDisplayTime = 2000; // Show splash for at least 2s

    const timer = setTimeout(() => {
      setIsVisible(false);
      // Unlock scroll after animation starts (optional, or wait until finish)
      // Usually better to unlock immediately or halfway if it slides up
      document.body.style.overflow = "unset";
    }, minDisplayTime);

    // Wait for transition to finish before unmounting from DOM
    // Slide up takes 0.8s (800ms)
    const removeTimer = setTimeout(() => {
        setShouldRender(false);
    }, minDisplayTime + 800); 

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div className={`${styles.splashScreen} ${!isVisible ? styles.hidden : ""}`}>
      <div className={styles.logoContainer}>
        <Image
          src="/logo.png"
          alt="Harrie's Barbershop"
          width={200}
          height={200} // Adjust aspect ratio as needed based on actual image
          className={styles.logo}
          priority
        />
      </div>
    </div>
  );
}

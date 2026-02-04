/**
 * Device Detection Hook
 * Detects if user is on mobile or desktop for optimized TTS settings
 */

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'desktop';

interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
}

/**
 * Detect device type based on screen size, touch capability, and user agent
 * - Mobile: smaller screens, touch devices, mobile user agents
 * - Desktop: larger screens, no touch, desktop user agents
 */
export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Server-side default
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        isMobile: false,
        isDesktop: true,
        isTouchDevice: false,
        screenWidth: 1024,
      };
    }

    return detectDevice();
  });

  useEffect(() => {
    // Update on mount (client-side)
    setDeviceInfo(detectDevice());

    // Update on resize
    const handleResize = () => {
      setDeviceInfo(detectDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
}

/**
 * Detect device type synchronously (for use in non-hook contexts)
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop',
      isMobile: false,
      isDesktop: true,
      isTouchDevice: false,
      screenWidth: 1024,
    };
  }

  const screenWidth = window.innerWidth;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check user agent for mobile indicators
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile',
  ];
  const hasMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));

  // Consider mobile if:
  // 1. Screen width < 768px (typical tablet breakpoint)
  // 2. OR has touch AND mobile user agent
  // 3. OR screen width < 1024px AND has touch (small tablet/large phone)
  const isMobile =
    screenWidth < 768 ||
    (isTouchDevice && hasMobileUserAgent) ||
    (screenWidth < 1024 && isTouchDevice);

  return {
    type: isMobile ? 'mobile' : 'desktop',
    isMobile,
    isDesktop: !isMobile,
    isTouchDevice,
    screenWidth,
  };
}

/**
 * Get device type for API requests (non-hook version)
 */
export function getDeviceType(): DeviceType {
  return detectDevice().type;
}

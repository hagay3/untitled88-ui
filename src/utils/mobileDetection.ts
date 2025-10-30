import { useState, useEffect } from 'react';

/**
 * Comprehensive mobile detection utility using multiple methods
 * Combines user agent, screen size, touch capability, and device features
 */

// User Agent based detection with comprehensive patterns
const isMobileUserAgent = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const mobilePatterns = [
    /android/i,
    /webos/i,
    /iphone/i,
    /ipad/i,
    /ipod/i,
    /blackberry/i,
    /iemobile/i,
    /opera mini/i,
    /mobile/i,
    /tablet/i,
    /kindle/i,
    /silk/i,
    /gt-/i,
    /nexus/i,
    /sm-/i,
    /lumia/i,
    /windows phone/i
  ];
  
  return mobilePatterns.some(pattern => pattern.test(userAgent));
};

// Touch capability detection
const hasTouchCapability = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
};

// Screen size detection
const isMobileScreenSize = (breakpoint: number = 768): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= breakpoint;
};

// Device orientation detection (mobile devices typically support this)
const hasOrientationSupport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'orientation' in window || 'onorientationchange' in window;
};

// Check for mobile-specific APIs
const hasMobileAPIs = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    'DeviceMotionEvent' in window ||
    'DeviceOrientationEvent' in window ||
    'ontouchstart' in document.documentElement
  );
};

// Check device pixel ratio (mobile devices often have high DPR)
const hasHighPixelRatio = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.devicePixelRatio > 1;
};

/**
 * Main mobile detection function with scoring system
 */
export const detectMobile = (screenBreakpoint: number = 768): {
  isMobile: boolean;
  confidence: number;
  methods: {
    userAgent: boolean;
    screenSize: boolean;
    touchCapability: boolean;
    orientation: boolean;
    mobileAPIs: boolean;
    highPixelRatio: boolean;
  };
} => {
  const methods = {
    userAgent: isMobileUserAgent(),
    screenSize: isMobileScreenSize(screenBreakpoint),
    touchCapability: hasTouchCapability(),
    orientation: hasOrientationSupport(),
    mobileAPIs: hasMobileAPIs(),
    highPixelRatio: hasHighPixelRatio()
  };
  
  // Calculate confidence score
  const positiveDetections = Object.values(methods).filter(Boolean).length;
  const confidence = positiveDetections / 6;
  
  // Mobile detection logic with weighted scoring
  let isMobile = false;
  
  // Strong indicators (any of these alone can indicate mobile)
  if (methods.userAgent || methods.screenSize) {
    isMobile = true;
  }
  
  // Additional confirmation (need at least 2 of these if no strong indicators)
  if (!isMobile && positiveDetections >= 3) {
    isMobile = true;
  }
  
  // Special case: if screen is small AND has touch, definitely mobile
  if (methods.screenSize && methods.touchCapability) {
    isMobile = true;
  }
  
  return {
    isMobile,
    confidence,
    methods
  };
};

/**
 * Simple mobile detection function for backward compatibility
 */
export const isMobile = (breakpoint: number = 768): boolean => {
  return detectMobile(breakpoint).isMobile;
};

/**
 * React hook for mobile detection with SSR safety and real-time updates
 */
export const useIsMobile = (breakpoint: number = 768) => {
  // Start with false for SSR safety
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [detection, setDetection] = useState({
    isMobile: false,
    confidence: 0,
    methods: {
      userAgent: false,
      screenSize: false,
      touchCapability: false,
      orientation: false,
      mobileAPIs: false,
      highPixelRatio: false
    }
  });
  
  useEffect(() => {
    // Mark as client-side and perform detection
    setIsClient(true);
    
    const performDetection = () => {
      const result = detectMobile(breakpoint);
      setIsMobile(result.isMobile);
      setDetection(result);
    };
    
    // Initial detection
    performDetection();
    
    // Set up resize listener for responsive updates
    const handleResize = () => {
      performDetection();
    };
    
    // Set up orientation change listener
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(performDetection, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [breakpoint]);
  
  return {
    isMobile,
    isClient,
    confidence: detection.confidence,
    methods: detection.methods
  };
};

/**
 * Synchronous mobile detection for immediate use
 * Use this when you need mobile detection in event handlers or conditions
 */
export const isMobileSync = (breakpoint: number = 768): boolean => {
  if (typeof window === 'undefined') return false;
  return detectMobile(breakpoint).isMobile;
};

/**
 * Get device type classification
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  const detection = detectMobile();
  
  if (width <= 480 || (detection.isMobile && width <= 768)) {
    return 'mobile';
  } else if (width <= 1024 && (detection.methods.touchCapability || detection.methods.userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};


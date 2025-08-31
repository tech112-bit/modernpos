'use client'

import { useState, useEffect, useMemo } from 'react'

interface MobileLayoutConfig {
  breakpoints: {
    xs: number // 320px
    sm: number // 480px
    md: number // 768px
    lg: number // 1024px
    xl: number // 1280px
  }
  defaultLayout: 'mobile' | 'tablet' | 'desktop'
}

interface MobileLayoutState {
  isMobileS: boolean      // 320px - 479px
  isMobileM: boolean      // 480px - 767px
  isTablet: boolean       // 768px - 1023px
  isDesktop: boolean      // 1024px+
  currentBreakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  layout: 'mobile' | 'tablet' | 'desktop'
}

const defaultConfig: MobileLayoutConfig = {
  breakpoints: {
    xs: 320,
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280
  },
  defaultLayout: 'mobile'
}

export const useMobileLayout = (config: Partial<MobileLayoutConfig> = {}): MobileLayoutState => {
  // Memoize the merged config to prevent infinite re-renders
  const mergedConfig = useMemo(() => ({ ...defaultConfig, ...config }), [
    config.breakpoints?.xs,
    config.breakpoints?.sm,
    config.breakpoints?.md,
    config.breakpoints?.lg,
    config.breakpoints?.xl,
    config.defaultLayout
  ])
  
  const [layoutState, setLayoutState] = useState<MobileLayoutState>({
    isMobileS: false,
    isMobileM: false,
    isTablet: false,
    isDesktop: false,
    currentBreakpoint: 'xs',
    layout: mergedConfig.defaultLayout
  })

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth
      const { breakpoints } = mergedConfig

      let currentBreakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'xs'
      let layout: 'mobile' | 'tablet' | 'desktop' = 'mobile'

      if (width >= breakpoints.xl) {
        currentBreakpoint = 'xl'
        layout = 'desktop'
      } else if (width >= breakpoints.lg) {
        currentBreakpoint = 'lg'
        layout = 'desktop'
      } else if (width >= breakpoints.md) {
        currentBreakpoint = 'md'
        layout = 'tablet'
      } else if (width >= breakpoints.sm) {
        currentBreakpoint = 'sm'
        layout = 'mobile'
      } else {
        currentBreakpoint = 'xs'
        layout = 'mobile'
      }

      setLayoutState({
        isMobileS: width >= breakpoints.xs && width < breakpoints.sm,
        isMobileM: width >= breakpoints.sm && width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg,
        currentBreakpoint,
        layout
      })
    }

    // Initial update
    updateLayout()

    // Add event listener
    window.addEventListener('resize', updateLayout)

    // Cleanup
    return () => window.removeEventListener('resize', updateLayout)
  }, [mergedConfig])

  return layoutState
}

// Utility functions for common mobile layout patterns
export const useMobileLayoutUtils = (config?: Partial<MobileLayoutConfig>) => {
  const layout = useMobileLayout(config)

  return {
    ...layout,
    
    // Responsive text sizing
    getTextSize: (mobile: string, tablet: string, desktop: string) => {
      if (layout.isMobileS || layout.isMobileM) return mobile
      if (layout.isTablet) return tablet
      return desktop
    },

    // Responsive spacing
    getSpacing: (mobile: string, tablet: string, desktop: string) => {
      if (layout.isMobileS || layout.isMobileM) return mobile
      if (layout.isTablet) return tablet
      return desktop
    },

    // Responsive padding
    getPadding: (mobile: string, tablet: string, desktop: string) => {
      if (layout.isMobileS || layout.isMobileM) return mobile
      if (layout.isTablet) return tablet
      return desktop
    },

    // Responsive margin
    getMargin: (mobile: string, tablet: string, desktop: string) => {
      if (layout.isMobileS || layout.isMobileM) return mobile
      if (layout.isTablet) return tablet
      return desktop
    },

    // Responsive grid columns
    getGridCols: (mobile: number, tablet: number, desktop: number) => {
      if (layout.isMobileS || layout.isMobileM) return mobile
      if (layout.isTablet) return tablet
      return desktop
    },

    // Check if should show mobile-specific features
    shouldShowMobileFeatures: () => layout.isMobileS || layout.isMobileM,
    
    // Check if should show tablet-specific features
    shouldShowTabletFeatures: () => layout.isTablet,
    
    // Check if should show desktop-specific features
    shouldShowDesktopFeatures: () => layout.isDesktop,

    // Get optimal touch target size for current device
    getTouchTargetSize: () => {
      if (layout.isMobileS) return 'min-h-[44px] min-w-[44px]' // Minimum touch target
      if (layout.isMobileM) return 'min-h-[40px] min-w-[40px]' // Standard touch target
      return 'min-h-[36px] min-w-[36px]' // Desktop target
    }
  }
}

export default useMobileLayout

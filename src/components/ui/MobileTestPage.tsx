'use client'

import React from 'react'
import { 
  MobileOptimizedCard, 
  ResponsiveButton, 
  ResponsiveLinkButton,
  ResponsiveInput,
  ResponsiveContainer,
  ResponsiveGrid 
} from './index'
import { useMobileLayoutUtils } from '@/hooks'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  TagIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'

export default function MobileTestPage() {
  const { isMobileS, isMobileM, getTextSize, getSpacing, getTouchTargetSize } = useMobileLayoutUtils()

  return (
    <ResponsiveContainer padding="md">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className={getTextSize('text-xl', 'text-2xl', 'text-3xl') + ' font-bold text-gray-900'}>
            Mobile Optimization Test
          </h1>
          <p className={`mt-2 ${getTextSize('text-sm', 'text-base', 'text-lg')} text-gray-600`}>
            Testing all mobile-optimized components
          </p>
          <div className="mt-4 p-2 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-800">
              Current: {isMobileS ? 'Mobile S (320px)' : isMobileM ? 'Mobile M (480px)' : 'Tablet/Desktop'}
            </p>
          </div>
        </div>

        {/* Responsive Buttons */}
        <MobileOptimizedCard variant="elevated" padding="md">
          <h2 className="text-lg font-semibold mb-4">Responsive Buttons</h2>
          <ResponsiveGrid
            cols={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
            gap={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
          >
            <ResponsiveButton variant="primary" size="sm" icon={PlusIcon}>
              Primary
            </ResponsiveButton>
            <ResponsiveButton variant="secondary" size="sm" icon={PencilIcon}>
              Secondary
            </ResponsiveButton>
            <ResponsiveButton variant="danger" size="sm" icon={TrashIcon}>
              Danger
            </ResponsiveButton>
            <ResponsiveButton variant="success" size="sm" icon={TagIcon}>
              Success
            </ResponsiveButton>
            <ResponsiveButton variant="ghost" size="sm">
              Ghost
            </ResponsiveButton>
          </ResponsiveGrid>
        </MobileOptimizedCard>

        {/* Responsive Inputs */}
        <MobileOptimizedCard variant="default" padding="md">
          <h2 className="text-lg font-semibold mb-4">Responsive Inputs</h2>
          <ResponsiveGrid
            cols={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
            gap={{ xs: 3, sm: 4, md: 4, lg: 6, xl: 6 }}
          >
            <ResponsiveInput
              label="Search"
              icon={MagnifyingGlassIcon}
              placeholder="Type to search..."
              size="md"
              mobileSize="standard"
            />
            <ResponsiveInput
              label="Email"
              placeholder="Enter email..."
              size="md"
              mobileSize="standard"
            />
            <ResponsiveInput
              label="Phone"
              placeholder="Enter phone..."
              size="md"
              mobileSize="standard"
            />
          </ResponsiveGrid>
        </MobileOptimizedCard>

        {/* Responsive Grid Demo */}
        <MobileOptimizedCard variant="outlined" padding="md">
          <h2 className="text-lg font-semibold mb-4">Responsive Grid Demo</h2>
          <ResponsiveGrid
            cols={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
            gap={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`${getTouchTargetSize()} bg-blue-100 rounded-lg flex items-center justify-center`}
              >
                <span className={`${getTextSize('text-xs', 'text-sm', 'text-base')} font-medium text-blue-800`}>
                  Item {i + 1}
                </span>
              </div>
            ))}
          </ResponsiveGrid>
        </MobileOptimizedCard>

        {/* Touch Target Demo */}
        <MobileOptimizedCard variant="filled" padding="md">
          <h2 className="text-lg font-semibold mb-4">Touch Target Demo</h2>
          <p className="text-sm text-gray-600 mb-4">
            All interactive elements have minimum 44px touch targets for mobile S (320px)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`${getTouchTargetSize()} bg-green-100 rounded-lg flex items-center justify-center`}>
              <span className="text-xs font-medium text-green-800">Touch</span>
            </div>
            <div className={`${getTouchTargetSize()} bg-yellow-100 rounded-lg flex items-center justify-center`}>
              <span className="text-xs font-medium text-yellow-800">Target</span>
            </div>
            <div className={`${getTouchTargetSize()} bg-red-100 rounded-lg flex items-center justify-center`}>
              <span className="text-xs font-medium text-red-800">44px</span>
            </div>
            <div className={`${getTouchTargetSize()} bg-purple-100 rounded-lg flex items-center justify-center`}>
              <span className="text-xs font-medium text-purple-800">Min</span>
            </div>
          </div>
        </MobileOptimizedCard>

        {/* Responsive Spacing Demo */}
        <MobileOptimizedCard variant="default" padding="md">
          <h2 className="text-lg font-semibold mb-4">Responsive Spacing Demo</h2>
          <div className={`${getSpacing('space-y-2', 'space-y-3', 'space-y-4')}`}>
            <div className="bg-gray-100 p-2 rounded">
              <p className={`${getTextSize('text-xs', 'text-sm', 'text-base')} text-gray-700`}>
                This demonstrates responsive spacing
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <p className={`${getTextSize('text-xs', 'text-sm', 'text-base')} text-gray-700`}>
                Mobile S: Compact spacing
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <p className={`${getTextSize('text-xs', 'text-sm', 'text-base')} text-gray-700`}>
                Desktop: Generous spacing
              </p>
            </div>
          </div>
        </MobileOptimizedCard>

        {/* Navigation Demo */}
        <MobileOptimizedCard variant="elevated" padding="md">
          <h2 className="text-lg font-semibold mb-4">Navigation Demo</h2>
          <ResponsiveGrid
            cols={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
            gap={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
          >
            <ResponsiveLinkButton
              variant="primary"
              size="sm"
              icon={PlusIcon}
              href="/dashboard"
            >
              Home
            </ResponsiveLinkButton>
            <ResponsiveLinkButton
              variant="secondary"
              size="sm"
              icon={TagIcon}
              href="/dashboard/categories"
            >
              Categories
            </ResponsiveLinkButton>
            <ResponsiveLinkButton
              variant="secondary"
              size="sm"
              icon={PencilIcon}
              href="/dashboard/products"
            >
              Products
            </ResponsiveLinkButton>
            <ResponsiveLinkButton
              variant="secondary"
              size="sm"
              icon={TrashIcon}
              href="/dashboard/sales"
            >
              Sales
            </ResponsiveLinkButton>
          </ResponsiveGrid>
        </MobileOptimizedCard>
      </div>
    </ResponsiveContainer>
  )
}

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'outlined'
  onClick?: () => void
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  variant = 'default',
  onClick,
  hover = false
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  const variantClasses = {
    default: 'bg-white border border-gray-100',
    elevated: 'bg-white shadow-lg border border-gray-100',
    outlined: 'bg-white border-2 border-gray-200'
  }

  const baseClasses = 'rounded-xl shadow-sm'
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow duration-200' : ''
  const clickableClasses = onClick ? 'cursor-pointer' : ''

  return (
    <div 
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${paddingClasses[padding]} 
        ${hoverClasses} 
        ${clickableClasses} 
        ${className}
      `.trim()}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Card

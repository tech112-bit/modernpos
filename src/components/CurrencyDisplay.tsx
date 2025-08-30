'use client'

import { useCurrency } from '@/contexts/CurrencyContext'

interface CurrencyDisplayProps {
  amount: number
  className?: string
}

export default function CurrencyDisplay({ amount, className = '' }: CurrencyDisplayProps) {
  const { currentCurrency, formatCurrency } = useCurrency()
  
  console.log('💰 CurrencyDisplay: Current currency:', currentCurrency.code)
  console.log('💰 CurrencyDisplay: Amount:', amount)
  console.log('💰 CurrencyDisplay: Formatted result:', formatCurrency(amount))
  
  return (
    <span className={className}>
      {formatCurrency(amount)}
    </span>
  )
}

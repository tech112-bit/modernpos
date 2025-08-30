'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export interface Currency {
  code: string
  name: string
  symbol: string
  position: 'before' | 'after'
  decimalPlaces: number
  exchangeRate: number // Rate relative to USD
  locale: string
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  // Note: MMK is the base currency for stored prices in the database
  {
    code: 'MMK',
    name: 'Myanmar Kyat',
    symbol: 'MMK',
    position: 'after',
    decimalPlaces: 0,
    exchangeRate: 1, // Base currency, no conversion needed
    locale: 'my-MM'
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    position: 'before',
    decimalPlaces: 2,
    exchangeRate: 0.00048, // 1 MMK = ~0.00048 USD (1/2100)
    locale: 'en-US'
  },
  {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    position: 'before',
    decimalPlaces: 0,
    exchangeRate: 7.5, // 1 MMK = ~7.5 IDR
    locale: 'id-ID'
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    position: 'before',
    decimalPlaces: 2,
    exchangeRate: 0.0023, // 1 MMK = ~0.0023 MYR
    locale: 'ms-MY'
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    position: 'before',
    decimalPlaces: 2,
    exchangeRate: 0.00064, // 1 MMK = ~0.00064 SGD
    locale: 'en-SG'
  },
  {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    position: 'before',
    decimalPlaces: 2,
    exchangeRate: 0.017, // 1 MMK = ~0.017 THB
    locale: 'th-TH'
  },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    position: 'before',
    decimalPlaces: 2,
    exchangeRate: 0.027, // 1 MMK = ~0.027 PHP
    locale: 'en-PH'
  },
  {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    position: 'after',
    decimalPlaces: 0,
    exchangeRate: 11.7, // 1 MMK = ~11.7 VND
    locale: 'vi-VN'
  }
]

interface CurrencyContextType {
  currentCurrency: Currency
  setCurrentCurrency: (currency: Currency) => void
  formatCurrency: (amount: number, currency?: Currency) => string
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number
  getCurrencyByCode: (code: string) => Currency | undefined
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(SUPPORTED_CURRENCIES.find(c => c.code === 'MMK')!) // MMK default

  console.log('🌍 CurrencyProvider: Initializing with default currency:', SUPPORTED_CURRENCIES.find(c => c.code === 'MMK')?.code)

  // Load saved currency preference from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferred-currency')
    console.log('🔍 Loading saved currency from localStorage:', savedCurrency)
    
    if (savedCurrency) {
      const currency = SUPPORTED_CURRENCIES.find(c => c.code === savedCurrency)
      if (currency) {
        console.log('✅ Found saved currency:', currency.code)
        setCurrentCurrency(currency)
      } else {
        console.log('❌ Invalid saved currency code:', savedCurrency)
        // Fallback to MMK
        const mmkCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'MMK')
        if (mmkCurrency) {
          setCurrentCurrency(mmkCurrency)
          localStorage.setItem('preferred-currency', 'MMK')
        }
      }
    } else {
      console.log('📝 No saved currency found, defaulting to MMK')
      // Default to MMK if no preference is saved
      const mmkCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'MMK')
      if (mmkCurrency) {
        setCurrentCurrency(mmkCurrency)
        localStorage.setItem('preferred-currency', 'MMK')
      }
    }
  }, [])

  console.log('🌍 CurrencyProvider: Current currency state:', currentCurrency.code)

  // Save currency preference to localStorage
  const handleSetCurrentCurrency = (currency: Currency) => {
    console.log('💱 Setting currency to:', currency.code)
    setCurrentCurrency(currency)
    localStorage.setItem('preferred-currency', currency.code)
    console.log('💾 Saved currency preference to localStorage:', currency.code)
  }

  // Format currency amount
  const formatCurrency = (amount: number | null | undefined, currency: Currency = currentCurrency): string => {
    // Handle null/undefined values
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${currency.symbol}0`
    }
    
    // If the amount is already in the target currency, don't convert
    // This assumes your stored prices are in MMK (base currency)
    let displayAmount = amount
    
    // Only convert if we're switching to a different currency
    if (currency.code !== 'MMK') {
      displayAmount = convertCurrency(amount, SUPPORTED_CURRENCIES.find(c => c.code === 'MMK')!, currency)
    }
    
    if (currency.position === 'before') {
      return `${currency.symbol}${displayAmount.toLocaleString(currency.locale, {
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces
      })}`
    } else {
      return `${displayAmount.toLocaleString(currency.locale, {
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces
      })}${currency.symbol}`
    }
  }

  // Convert amount between currencies
  const convertCurrency = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency.code === toCurrency.code) return amount
    
    // Convert to MMK first, then to target currency
    const mmkAmount = amount / fromCurrency.exchangeRate
    return mmkAmount * toCurrency.exchangeRate
  }

  // Get currency by code
  const getCurrencyByCode = (code: string): Currency | undefined => {
    return SUPPORTED_CURRENCIES.find(c => c.code === code)
  }

  const value: CurrencyContextType = {
    currentCurrency,
    setCurrentCurrency: handleSetCurrentCurrency,
    formatCurrency,
    convertCurrency,
    getCurrencyByCode
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

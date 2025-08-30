'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface MfaState {
  isEnabled: boolean
  isVerified: boolean
  backupCodes: string[]
  qrCodeUrl?: string
  secret?: string
}

interface MfaContextType {
  mfaState: MfaState
  enableMfa: () => Promise<void>
  disableMfa: () => Promise<void>
  verifyMfa: (code: string) => Promise<boolean>
  generateBackupCodes: () => Promise<string[]>
  refreshMfaState: () => Promise<void>
}

const MfaContext = createContext<MfaContextType | undefined>(undefined)

export function MfaProvider({ children }: { children: React.ReactNode }) {
  const [mfaState, setMfaState] = useState<MfaState>({
    isEnabled: false,
    isVerified: false,
    backupCodes: []
  })

  const refreshMfaState = async () => {
    try {
      const response = await fetch('/api/auth/mfa/status')
      if (response.ok) {
        const data = await response.json()
        setMfaState(data)
      }
    } catch (error) {
      console.error('Failed to fetch MFA status:', error)
    }
  }

  const enableMfa = async () => {
    try {
      const response = await fetch('/api/auth/mfa/enable', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        setMfaState(prev => ({
          ...prev,
          isEnabled: true,
          qrCodeUrl: data.qrCodeUrl,
          secret: data.secret
        }))
      }
    } catch (error) {
      console.error('Failed to enable MFA:', error)
      throw error
    }
  }

  const disableMfa = async () => {
    try {
      const response = await fetch('/api/auth/mfa/disable', { method: 'POST' })
      if (response.ok) {
        setMfaState(prev => ({
          ...prev,
          isEnabled: false,
          isVerified: false,
          qrCodeUrl: undefined,
          secret: undefined
        }))
      }
    } catch (error) {
      console.error('Failed to disable MFA:', error)
      throw error
    }
  }

  const verifyMfa = async (code: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      
      if (response.ok) {
        setMfaState(prev => ({ ...prev, isVerified: true }))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to verify MFA:', error)
      return false
    }
  }

  const generateBackupCodes = async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/auth/mfa/backup-codes', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        setMfaState(prev => ({ ...prev, backupCodes: data.backupCodes }))
        return data.backupCodes
      }
      return []
    } catch (error) {
      console.error('Failed to generate backup codes:', error)
      return []
    }
  }

  useEffect(() => {
    refreshMfaState()
  }, [])

  return (
    <MfaContext.Provider value={{
      mfaState,
      enableMfa,
      disableMfa,
      verifyMfa,
      generateBackupCodes,
      refreshMfaState
    }}>
      {children}
    </MfaContext.Provider>
  )
}

export function useMfa() {
  const context = useContext(MfaContext)
  if (context === undefined) {
    throw new Error('useMfa must be used within a MfaProvider')
  }
  return context
}

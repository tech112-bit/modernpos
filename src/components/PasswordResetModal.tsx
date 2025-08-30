'use client'

import { useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { 
  XMarkIcon, 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    email: string
    role: string
  } | null
}

export default function PasswordResetModal({ isOpen, onClose, user }: PasswordResetModalProps) {
  const { addNotification } = useNotifications()
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  if (!isOpen || !user) return null

  // Only allow password reset for non-admin users
  if (user.role === 'ADMIN') {
    return null
  }

  const generatePassword = () => {
    setIsGenerating(true)
    
    // Generate a secure random password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)] // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)] // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // Special character
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)]
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('')
    
    setNewPassword(password)
    setIsGenerating(false)
    
    addNotification({
      type: 'success',
      title: 'Password Generated',
      message: 'A secure password has been generated for you',
      duration: 3000
    })
  }

  const handlePasswordReset = async () => {
    if (!newPassword.trim()) {
      addNotification({
        type: 'error',
        title: 'Password Required',
        message: 'Please enter or generate a new password',
        duration: 5000
      })
      return
    }

    if (newPassword.length < 8) {
      addNotification({
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 8 characters long',
        duration: 5000
      })
      return
    }

    try {
      setIsResetting(true)
      
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Password Reset Successful',
          message: `Password has been reset for ${user.email}`,
          duration: 5000
        })
        
        // Clear the form and close modal
        setNewPassword('')
        onClose()
      } else {
        const errorData = await response.json()
        addNotification({
          type: 'error',
          title: 'Password Reset Failed',
          message: errorData.error || 'Failed to reset password',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to server',
        duration: 5000
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleClose = () => {
    setNewPassword('')
    setShowPassword(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <KeyIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">User:</p>
            <p className="font-medium text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-500">Role: {user.role}</p>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password or generate one"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={generatePassword}
              disabled={isGenerating}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Generate Secure Password
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={!newPassword.trim() || isResetting}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isResetting ? (
                <>
                  <ArrowPathIcon className="animate-spin h-4 w-4 mr-2 inline" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>

          {/* Password Requirements */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-1">Password Requirements:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Minimum 8 characters</li>
              <li>• At least one uppercase letter</li>
              <li>• At least one lowercase letter</li>
              <li>• At least one number</li>
              <li>• At least one special character</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

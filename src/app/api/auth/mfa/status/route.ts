import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, you'd get the user from the auth token
    // For now, we'll return a mock status
    return NextResponse.json({
      isEnabled: false,
      isVerified: false,
      backupCodes: []
    })
  } catch (error) {
    console.error('Error fetching MFA status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MFA status' },
      { status: 500 }
    )
  }
}

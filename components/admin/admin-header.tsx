'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function AdminHeader() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login' })
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Admin Dashboard
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {session?.user?.name}
            </span>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              Odjavi se
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 
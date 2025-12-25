'use client'

import { useState } from 'react'
import { X, User, Car, Building, Truck, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { User as UserType } from '@/services/api/companyApi'
import EmployeeProfileForm from './forms/EmployeeProfileForm'
import DriverProfileForm from './forms/DriverProfileForm'
import BranchManagerProfileForm from './forms/BranchManagerProfileForm'
import FinanceManagerProfileForm from './forms/FinanceManagerProfileForm'
import LogisticsManagerProfileForm from './forms/LogisticsManagerProfileForm'

interface ProfileDetailModalProps {
  user: UserType
  isOpen: boolean
  onClose: () => void
}

// Role name to form component mapping
const getProfileForm = (roleName: string | undefined) => {
  const name = (roleName || '').toLowerCase()

  if (name.includes('driver')) {
    return DriverProfileForm
  } else if (name.includes('branch manager') || name.includes('branch-manager')) {
    return BranchManagerProfileForm
  } else if (name.includes('finance manager') || name.includes('finance-manager')) {
    return FinanceManagerProfileForm
  } else if (name.includes('logistics manager') || name.includes('logistics-manager')) {
    return LogisticsManagerProfileForm
  }
  // Default to employee form
  return EmployeeProfileForm
}

const getProfileConfig = (roleName: string | undefined) => {
  const name = (roleName || '').toLowerCase()

  if (name.includes('driver')) {
    return {
      icon: Car,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Driver'
    }
  } else if (name.includes('branch manager') || name.includes('branch-manager')) {
    return {
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      label: 'Branch Manager'
    }
  } else if (name.includes('finance manager') || name.includes('finance-manager')) {
    return {
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      label: 'Finance Manager'
    }
  } else if (name.includes('logistics manager') || name.includes('logistics-manager')) {
    return {
      icon: Truck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      label: 'Logistics Manager'
    }
  }
  // Default to employee
  return {
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Employee'
  }
}

export default function ProfileDetailModal({ user, isOpen, onClose }: ProfileDetailModalProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [isEditing, setIsEditing] = useState(false)

  if (!isOpen) return null

  // Get the appropriate form and config based on role name
  const config = getProfileConfig(user.role?.name || (user.role as any)?.display_name)
  const ProfileIcon = config.icon
  const profileLabel = config.label
  const FormComponent = getProfileForm(user.role?.name || (user.role as any)?.display_name)

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    ...(profileLabel === 'Driver' ? [{ id: 'license', label: 'License Info', icon: Car }] : []),
    ...(profileLabel === 'Branch Manager' ? [{ id: 'branch', label: 'Branch Management', icon: Building }] : []),
    ...(profileLabel === 'Finance Manager' ? [{ id: 'finance', label: 'Finance Settings', icon: FileText }] : []),
    ...(profileLabel === 'Logistics Manager' ? [{ id: 'logistics', label: 'Logistics Settings', icon: Truck }] : []),
  ]

  const handleSave = () => {
    setIsEditing(false)
    onClose()
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  // Check if user has employee profile data
  const hasProfileData = !!(
    user.designation ||
    user.department ||
    user.employee_code ||
    user.employee_id
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
                <ProfileIcon className={`w-6 h-6 ${config.color}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm font-medium text-gray-700">{profileLabel}</span>
                  {hasProfileData && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-green-600 font-medium">Profile Complete</span>
                    </>
                  )}
                </div>
                {user.designation && (
                  <p className="text-sm text-gray-600 mt-1">{user.designation}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="border-b border-gray-200 flex-shrink-0">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const TabIcon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <FormComponent
            user={user}
            profile={user}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0">
          {isEditing ? (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" form="profile-form">
                Save Profile
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                {hasProfileData ? 'Edit Profile' : 'Create Profile'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

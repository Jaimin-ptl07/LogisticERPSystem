'use client'

import { useState } from 'react'
import { X, User, FileText, Car, Building, Truck, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { User as UserType } from '@/services/api/companyApi'
import { useGetEmployeeProfileQuery, useGetDriverProfileQuery, useGetBranchManagerProfileQuery, useGetFinanceManagerProfileQuery, useGetLogisticsManagerProfileQuery } from '@/services/api/profileApi'
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

const profileTypeConfig = {
  'Employee': {
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    formComponent: EmployeeProfileForm,
    queryHook: useGetEmployeeProfileQuery,
  },
  'Driver': {
    icon: Car,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    formComponent: DriverProfileForm,
    queryHook: useGetDriverProfileQuery,
  },
  'Branch Manager': {
    icon: Building,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    formComponent: BranchManagerProfileForm,
    queryHook: useGetBranchManagerProfileQuery,
  },
  'Finance Manager': {
    icon: DollarSign,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    formComponent: FinanceManagerProfileForm,
    queryHook: useGetFinanceManagerProfileQuery,
  },
  'Logistics Manager': {
    icon: Truck,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    formComponent: LogisticsManagerProfileForm,
    queryHook: useGetLogisticsManagerProfileQuery,
  },
}

export default function ProfileDetailModal({ user, isOpen, onClose }: ProfileDetailModalProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [isEditing, setIsEditing] = useState(false)

  if (!isOpen) return null

  // Determine profile type based on role
  const profileType = user.role?.name || 'Employee'
  const config = profileTypeConfig[profileType as keyof typeof profileTypeConfig] || profileTypeConfig['Employee']
  const ProfileIcon = config.icon

  // Fetch profile data based on type
  const { data: profileData, isLoading: isLoadingProfile, error: profileError } = config.queryHook(user.id)

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    ...(profileType === 'Driver' ? [{ id: 'license', label: 'License Info', icon: Car }] : []),
    ...(profileType === 'Branch Manager' ? [{ id: 'branch', label: 'Branch Management', icon: Building }] : []),
    ...(profileType === 'Finance Manager' ? [{ id: 'finance', label: 'Finance Settings', icon: FileText }] : []),
    ...(profileType === 'Logistics Manager' ? [{ id: 'logistics', label: 'Logistics Settings', icon: Truck }] : []),
  ]

  const FormComponent = config.formComponent

  const handleSave = () => {
    setIsEditing(false)
    onClose()
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
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
                  <span className="text-sm font-medium text-gray-700">{profileType}</span>
                  {user.profile && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-green-600 font-medium">Profile Complete</span>
                    </>
                  )}
                </div>
                {user.profile?.designation && (
                  <p className="text-sm text-gray-600 mt-1">{user.profile.designation}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : profileError ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-600">Error loading profile data</p>
              </CardContent>
            </Card>
          ) : (
            <FormComponent
              user={user}
              profile={profileData}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
        </div>

        {/* Footer Actions */}
        {!isEditing && (
          <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {user.profile ? (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Create Profile
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
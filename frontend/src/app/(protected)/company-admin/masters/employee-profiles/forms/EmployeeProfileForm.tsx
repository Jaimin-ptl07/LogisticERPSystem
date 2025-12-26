'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User as UserType, UserProfile } from '@/services/api/companyApi'
import { useCreateEmployeeProfileMutation, useUpdateEmployeeProfileMutation } from '@/services/api/profileApi'
import { Save, X, CheckCircle, User } from 'lucide-react'

interface EmployeeProfileFormProps {
  user: UserType
  profile?: UserProfile | null
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export default function EmployeeProfileForm({
  user,
  profile,
  isEditing,
  onEdit,
  onSave,
  onCancel
}: EmployeeProfileFormProps) {
  const [formData, setFormData] = useState({
    employee_id: '',
    department: '',
    designation: '',
    date_of_joining: '',
    reporting_manager_id: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    blood_group: '',
    date_of_birth: '',
    gender: '' as 'male' | 'female' | 'other',
    marital_status: '' as 'single' | 'married' | 'divorced' | 'widowed',
    nationality: '',
    aadhar_number: '',
    pan_number: '',
    passport_number: '',
    current_address: {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    permanent_address: {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    bank_details: {
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      branch_name: '',
      account_type: 'savings' as 'savings' | 'current'
    }
  })

  const [createProfile, { isLoading: isCreating }] = useCreateEmployeeProfileMutation()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateEmployeeProfileMutation()

  useEffect(() => {
    // Use profile if available, otherwise fall back to user data
    const dataSource = profile || user

    if (dataSource) {
      setFormData({
        employee_id: dataSource.employee_id || dataSource.employee_code || '',
        department: dataSource.department || '',
        designation: dataSource.designation || '',
        // API returns hire_date, form uses date_of_joining
        date_of_joining: dataSource.date_of_joining || dataSource.hire_date ? (dataSource.date_of_joining || dataSource.hire_date || '').split('T')[0] : '',
        reporting_manager_id: dataSource.reporting_manager_id || '',
        emergency_contact_name: dataSource.emergency_contact_name || '',
        // API returns emergency_contact_phone, form uses emergency_contact_number
        emergency_contact_number: dataSource.emergency_contact_number || dataSource.emergency_contact_phone || '',
        blood_group: dataSource.blood_group || '',
        date_of_birth: dataSource.date_of_birth ? dataSource.date_of_birth.split('T')[0] : '',
        gender: dataSource.gender || '',
        marital_status: dataSource.marital_status || '',
        nationality: dataSource.nationality || '',
        aadhar_number: dataSource.aadhar_number || '',
        pan_number: dataSource.pan_number || '',
        passport_number: dataSource.passport_number || '',
        // API returns flat address fields, form uses nested current_address
        current_address: dataSource.current_address || {
          address_line1: dataSource.address || '',
          address_line2: '',
          city: dataSource.city || '',
          state: dataSource.state || '',
          postal_code: dataSource.postal_code || '',
          country: dataSource.country || ''
        },
        permanent_address: dataSource.permanent_address || {
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: ''
        },
        // API returns flat bank fields, form uses nested bank_details
        bank_details: dataSource.bank_details || {
          bank_name: dataSource.bank_name || '',
          account_number: dataSource.bank_account_number || '',
          ifsc_code: dataSource.bank_ifsc || '',
          branch_name: '',
          account_type: 'savings'
        }
      })
    }
  }, [profile, user])

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only submit if explicitly in edit mode
    if (!isEditing) {
      console.warn('Form submission blocked: not in edit mode')
      return
    }

    try {
      // Helper function to convert empty string to undefined
      const cleanValue = (value: string | undefined) => value && value.trim() ? value : undefined

      // Flatten nested objects to match backend API structure
      const flattenedData: any = {
        employee_id: cleanValue(formData.employee_id),
        department: cleanValue(formData.department),
        designation: cleanValue(formData.designation),
        date_of_joining: cleanValue(formData.date_of_joining),
        reporting_manager_id: cleanValue(formData.reporting_manager_id),
        emergency_contact_name: cleanValue(formData.emergency_contact_name),
        emergency_contact_phone: cleanValue(formData.emergency_contact_number),
        blood_group: cleanValue(formData.blood_group),
        date_of_birth: cleanValue(formData.date_of_birth),
        // Clean gender and marital_status - don't send empty strings
        gender: cleanValue(formData.gender),
        marital_status: cleanValue(formData.marital_status),
        nationality: cleanValue(formData.nationality),
        aadhar_number: cleanValue(formData.aadhar_number),
        pan_number: cleanValue(formData.pan_number),
        passport_number: cleanValue(formData.passport_number),
        // Flatten current_address
        address: cleanValue(formData.current_address?.address_line1),
        city: cleanValue(formData.current_address?.city),
        state: cleanValue(formData.current_address?.state),
        postal_code: cleanValue(formData.current_address?.postal_code),
        country: cleanValue(formData.current_address?.country),
        // Flatten bank_details
        bank_account_number: cleanValue(formData.bank_details?.account_number),
        bank_name: cleanValue(formData.bank_details?.bank_name),
        bank_ifsc: cleanValue(formData.bank_details?.ifsc_code),
      }

      if (profile) {
        await updateProfile({ userId: user.id, profile: flattenedData }).unwrap()
      } else {
        await createProfile({ userId: user.id, profile: flattenedData }).unwrap()
      }
      onSave()
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  if (!isEditing && !profile && (!user || !user.id)) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Employee Profile</h3>
          <p className="text-gray-600 mb-4">
            This employee doesn't have a profile yet. Click below to create one.
          </p>
          <Button onClick={onEdit} className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Create Employee Profile
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!isEditing && (profile || (user && user.id))) {
    // Use profile if available, otherwise fall back to user data
    const dataSource = profile || user
    return (
      <div className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <p className="text-gray-900">{dataSource.employee_id || dataSource.employee_code || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <p className="text-gray-900">{dataSource.department || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <p className="text-gray-900">{dataSource.designation || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                <p className="text-gray-900">{dataSource.date_of_joining || dataSource.hire_date || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <p className="text-gray-900">{dataSource.date_of_birth || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <p className="text-gray-900 capitalize">{dataSource.gender || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <p className="text-gray-900 capitalize">{dataSource.marital_status || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <p className="text-gray-900">{dataSource.nationality || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                <p className="text-gray-900">{dataSource.emergency_contact_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Number</label>
                <p className="text-gray-900">{dataSource.emergency_contact_number || dataSource.emergency_contact_phone || '-'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
              <p className="text-gray-900">
                {dataSource.current_address ? (
                  <>
                    {dataSource.current_address.address_line1}
                    {dataSource.current_address.address_line2 && `, ${dataSource.current_address.address_line2}`}
                    <br />
                    {dataSource.current_address.city}, {dataSource.current_address.state} {dataSource.current_address.postal_code}
                    <br />
                    {dataSource.current_address.country}
                  </>
                ) : dataSource.address ? (
                  <>
                    {dataSource.address}
                    {dataSource.city && `, ${dataSource.city}`}
                    {dataSource.state && `, ${dataSource.state}`}
                    {dataSource.postal_code && ` ${dataSource.postal_code}`}
                    {dataSource.country && <br />}
                    {dataSource.country}
                  </>
                ) : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Government IDs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Government IDs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                <p className="text-gray-900">{dataSource.aadhar_number || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <p className="text-gray-900">{dataSource.pan_number || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                <p className="text-gray-900">{dataSource.passport_number || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <p className="text-gray-900">{dataSource.blood_group || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataSource.bank_details ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <p className="text-gray-900">{dataSource.bank_details.bank_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <p className="text-gray-900">{'****' + dataSource.bank_details.account_number.slice(-4)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <p className="text-gray-900">{dataSource.bank_details.ifsc_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <p className="text-gray-900">{dataSource.bank_details.branch_name}</p>
                </div>
              </div>
            ) : dataSource.bank_name ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <p className="text-gray-900">{dataSource.bank_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <p className="text-gray-900">{'****' + (dataSource.bank_account_number || '').slice(-4)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <p className="text-gray-900">{dataSource.bank_ifsc || '-'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No bank details provided</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <Input
                value={formData.employee_id}
                onChange={(e) => handleInputChange('employee_id', e.target.value)}
                placeholder="Enter employee ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <Input
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Enter department"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <Input
                value={formData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                placeholder="Enter designation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
              <Input
                type="date"
                value={formData.date_of_joining}
                onChange={(e) => handleInputChange('date_of_joining', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
              <select
                value={formData.marital_status}
                onChange={(e) => handleInputChange('marital_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <Input
                value={formData.blood_group}
                onChange={(e) => handleInputChange('blood_group', e.target.value)}
                placeholder="e.g., O+, A-, B+"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
              <Input
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                placeholder="Enter emergency contact name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Number</label>
              <Input
                value={formData.emergency_contact_number}
                onChange={(e) => handleInputChange('emergency_contact_number', e.target.value)}
                placeholder="Enter emergency contact number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
            <div className="space-y-2">
              <Input
                value={formData.current_address.address_line1}
                onChange={(e) => handleInputChange('current_address.address_line1', e.target.value)}
                placeholder="Address line 1"
              />
              <Input
                value={formData.current_address.address_line2}
                onChange={(e) => handleInputChange('current_address.address_line2', e.target.value)}
                placeholder="Address line 2 (optional)"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input
                  value={formData.current_address.city}
                  onChange={(e) => handleInputChange('current_address.city', e.target.value)}
                  placeholder="City"
                />
                <Input
                  value={formData.current_address.state}
                  onChange={(e) => handleInputChange('current_address.state', e.target.value)}
                  placeholder="State"
                />
                <Input
                  value={formData.current_address.postal_code}
                  onChange={(e) => handleInputChange('current_address.postal_code', e.target.value)}
                  placeholder="Postal code"
                />
                <Input
                  value={formData.current_address.country}
                  onChange={(e) => handleInputChange('current_address.country', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Government IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Government IDs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
              <Input
                value={formData.aadhar_number}
                onChange={(e) => handleInputChange('aadhar_number', e.target.value)}
                placeholder="Enter Aadhar number"
                maxLength={12}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
              <Input
                value={formData.pan_number}
                onChange={(e) => handleInputChange('pan_number', e.target.value)}
                placeholder="Enter PAN number"
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
              <Input
                value={formData.passport_number}
                onChange={(e) => handleInputChange('passport_number', e.target.value)}
                placeholder="Enter passport number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
              <Input
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                placeholder="Enter nationality"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <Input
                value={formData.bank_details.bank_name}
                onChange={(e) => handleInputChange('bank_details.bank_name', e.target.value)}
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <Input
                type="password"
                value={formData.bank_details.account_number}
                onChange={(e) => handleInputChange('bank_details.account_number', e.target.value)}
                placeholder="Enter account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <Input
                value={formData.bank_details.ifsc_code}
                onChange={(e) => handleInputChange('bank_details.ifsc_code', e.target.value)}
                placeholder="Enter IFSC code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
              <Input
                value={formData.bank_details.branch_name}
                onChange={(e) => handleInputChange('bank_details.branch_name', e.target.value)}
                placeholder="Enter branch name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <select
                value={formData.bank_details.account_type}
                onChange={(e) => handleInputChange('bank_details.account_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="savings">Savings</option>
                <option value="current">Current</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
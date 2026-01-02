"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { Building2, Plus, ArrowLeft, Eye, EyeOff } from "lucide-react";

interface CompanyForm {
  name: string;
  domain: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_password: string;
}

export default function CreateCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [companyForm, setCompanyForm] = useState<CompanyForm>({
    name: "",
    domain: "",
    admin_email: "",
    admin_first_name: "",
    admin_last_name: "",
    admin_password: "temp123456",
  });

  const handleCreateCompany = async (formData: CompanyForm) => {
    try {
      const data = {
        name: formData.name,
        domain: formData.domain,
        admin: {
          email: formData.admin_email,
          first_name: formData.admin_first_name,
          last_name: formData.admin_last_name,
          password: formData.admin_password,
        },
      };
      const response = await api.createCompanyWithAdmin(data);
      showSuccessToast("Company and admin created successfully!");
      return response;
    } catch (error) {
      console.error("Failed to create company:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create company";
      showErrorToast(errorMessage);
      throw error;
    }
  };

  const handleCompanyFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await handleCreateCompany(companyForm);
      // Redirect back to dashboard after successful creation
      router.push("/super-admin/dashboard");
    } catch (error) {
      // Error is already handled in handleCreateCompany
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCompanyForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto inline">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Company
          </h1>
        </div>
      </div>

      {/* Create Company Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
            <Building2 className="w-5 h-5 text-blue-600" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCompanyFormSubmit}>
            <div className="space-y-6">
              {/* Company Details Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b">
                  Company Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={companyForm.name}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      required
                      className="w-full focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Domain <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="domain"
                      value={companyForm.domain}
                      onChange={handleInputChange}
                      placeholder="e.g., company.logistics.com"
                      required
                      className="w-full focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Details Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b">
                  Company Admin Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="admin_first_name"
                      value={companyForm.admin_first_name}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      required
                      className="w-full focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="admin_last_name"
                      value={companyForm.admin_last_name}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      required
                      className="w-full focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      name="admin_email"
                      value={companyForm.admin_email}
                      onChange={handleInputChange}
                      placeholder="admin@company.com"
                      required
                      className="w-full focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="admin_password"
                        value={companyForm.admin_password}
                        onChange={handleInputChange}
                        placeholder="Enter password"
                        required
                        minLength={8}
                        className="w-full focus:ring-2 focus:ring-blue-500/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 8 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[100px] bg-[#1f40ae] text-white hover:bg-[#1f40ae]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Company
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

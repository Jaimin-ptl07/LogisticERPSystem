"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Activity,
  Filter,
  RefreshCw,
  Search,
  User,
  FileText,
  Package,
  Truck,
  TrendingUp
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

// Types
interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  action: string;
  module: string;
  sub_module?: string;
  old_status?: string;
  new_status?: string;
  status_changed: boolean;
  description?: string;
  reason?: string;
  action_timestamp: string;
}

interface AuditLogStats {
  total: number;
  by_module: Record<string, number>;
  by_action: Record<string, number>;
  top_users: Array<{ user_id: string; user_name?: string; count: number }>;
  status_changes: number;
}

interface AuditLogResponse {
  items: AuditLog[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export default function AuditLogsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [statusChangedFilter, setStatusChangedFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Get tenant_id from user context
  const tenantId = user?.tenant_id || "default-tenant";

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, moduleFilter, actionFilter, statusChangedFilter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("tenant_id", tenantId);
      params.append("page", page.toString());
      params.append("per_page", "50");
      params.append("sort_by", "action_timestamp");
      params.append("sort_order", "desc");

      if (searchQuery) params.append("search", searchQuery);
      if (moduleFilter) params.append("module", moduleFilter);
      if (actionFilter) params.append("action", actionFilter);
      if (statusChangedFilter) params.append("status_changed", statusChangedFilter);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await fetch(`/api/audit?${params.toString()}`);
      if (response.ok) {
        const data: AuditLogResponse = await response.json();
        setLogs(data.items);
        setTotal(data.total);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      params.append("tenant_id", tenantId);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await fetch(`/api/audit/stats?${params.toString()}`);
      if (response.ok) {
        const data: AuditLogStats = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'orders': return <Package className="w-4 h-4" />;
      case 'finance': return <TrendingUp className="w-4 h-4" />;
      case 'tms': return <Truck className="w-4 h-4" />;
      case 'driver': return <User className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      'orders': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'finance': 'bg-green-100 text-green-800 hover:bg-green-200',
      'tms': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'driver': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'auth': 'bg-red-100 text-red-800 hover:bg-red-200',
      'company': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    };
    return colors[module] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'created': 'bg-green-100 text-green-800',
      'approved': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800',
      'deleted': 'bg-red-100 text-red-800',
      'updated': 'bg-blue-100 text-blue-800',
      'status_changed': 'bg-yellow-100 text-yellow-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800',
      'assigned': 'bg-purple-100 text-purple-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track all system activities from order creation to delivery</p>
        </div>
        <Button onClick={() => { fetchLogs(); fetchStats(); }}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Status Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.status_changes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Top Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.by_module).slice(0, 3).map(([module, count]) => (
                  <div key={module} className="flex justify-between text-sm">
                    <span className="capitalize">{module}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Top Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {stats.top_users.slice(0, 3).map((user) => (
                  <div key={user.user_id} className="flex justify-between text-sm">
                    <span className="truncate">{user.user_name || user.user_id}</span>
                    <Badge variant="secondary">{user.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Module</Label>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">All Modules</option>
                <option value="orders">Orders</option>
                <option value="finance">Finance</option>
                <option value="tms">TMS</option>
                <option value="driver">Driver</option>
              </select>
            </div>

            <div>
              <Label>Action</Label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="submitted">Submitted</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div>
              <Label>Status Changed</Label>
              <select
                value={statusChangedFilter}
                onChange={(e) => setStatusChangedFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <Label>From Date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            <div>
              <Label>To Date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={fetchLogs}>
              <Search className="w-4 h-4 mr-2" /> Apply Filters
            </Button>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setModuleFilter("");
              setActionFilter("");
              setStatusChangedFilter("");
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit Log Entries
            </span>
            <span className="text-sm font-normal text-gray-600">{total} entries</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Timestamp</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(log.action_timestamp).toLocaleDateString()}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {new Date(log.action_timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getModuleColor(log.module)}>
                              <div className="flex items-center gap-1">
                                {getModuleIcon(log.module)}
                                <span className="capitalize">{log.module}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>
                              <span className="capitalize">{log.action}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{log.entity_name || log.entity_id}</span>
                              <span className="text-xs text-gray-500 capitalize">{log.entity_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{log.user_name || log.user_id}</span>
                              {log.user_role && (
                                <span className="text-xs text-gray-500 capitalize">{log.user_role}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm truncate" title={log.description}>
                              {log.description}
                            </p>
                            {log.reason && (
                              <p className="text-xs text-red-600 truncate" title={log.reason}>
                                Reason: {log.reason}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.status_changed ? (
                              <div className="flex items-center gap-1 text-sm">
                                <span className="line-through text-gray-400">{log.old_status}</span>
                                <span>→</span>
                                <span className="font-medium text-green-600">{log.new_status}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      Previous
                    </Button>
                    <span className="flex items-center px-3">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

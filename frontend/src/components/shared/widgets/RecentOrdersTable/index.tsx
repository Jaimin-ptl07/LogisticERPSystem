import React from 'react';
import clsx from 'clsx';
import Link from 'next/link';

interface Order {
  id: string;
  customer: string;
  status: string;
  date: string;
  amount: string;
}

interface RecentOrdersTableProps {
  orders: Order[];
}

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ orders }) => {
  const statusColors = {
    'In Progress': 'bg-blue-100 text-blue-800',
    Delivered: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/app/orders/${order.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-900"
                >
                  {order.id}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {order.customer}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={clsx(
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    statusColors[order.status as keyof typeof statusColors]
                  )}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {order.date}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {order.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No recent orders found
        </div>
      )}
      {orders.length > 0 && (
        <div className="bg-gray-50 px-6 py-3">
          <Link
            href="/app/orders"
            className="text-sm font-medium text-blue-600 hover:text-blue-900"
          >
            View all orders →
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentOrdersTable;
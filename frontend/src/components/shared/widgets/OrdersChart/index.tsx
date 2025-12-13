import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const OrdersChart: React.FC = () => {
  // Sample data - in real app, this would come from API
  const data = [
    { day: 'Mon', orders: 40 },
    { day: 'Tue', orders: 35 },
    { day: 'Wed', orders: 50 },
    { day: 'Thu', orders: 45 },
    { day: 'Fri', orders: 60 },
    { day: 'Sat', orders: 30 },
    { day: 'Sun', orders: 25 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="day"
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        />
        <Line
          type="monotone"
          dataKey="orders"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default OrdersChart;
'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const FinancialDashboard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (dashboardRef.current) {
      observer.observe(dashboardRef.current);
    }

    return () => {
      if (dashboardRef.current) {
        observer.unobserve(dashboardRef.current);
      }
    };
  }, []);
  // Mock data for revenue vs expenses
  const revenueExpensesData = [
    { time: '0', revenue: 30, expenses: 45, profit: 30 },
    { time: '3W', revenue: 28, expenses: 42, profit: 35 },
    { time: '4W', revenue: 32, expenses: 40, profit: 38 },
    { time: '8W', revenue: 38, expenses: 35, profit: 40 },
    { time: '10W', revenue: 52, expenses: 24, profit: 35 },
  ];

  // Mock data for cost breakdown
  const costBreakdownData = [
    { category: 'Salaries', value: 40 },
    { category: 'Operations', value: 25 },
    { category: 'Marketing', value: 15 },
    { category: 'Other', value: 10 },
  ];

  // Mock data for profit margin trend
  const profitMarginData = [
    { time: '10m', margin: 20 },
    { time: '2W', margin: 48 },
    { time: '20W', margin: 18 },
    { time: '10W', margin: 28 },
    { time: '12W', margin: 32 },
  ];

  // Mock data for financial forecast
  const forecastActualData = [
    { time: '0', value: 20 },
    { time: '8W', value: 48 },
    { time: '20W', value: 18 },
  ];
  
  const forecastProjectedData = [
    { time: '20W', value: 18 },
    { time: '10W', value: 28 },
    { time: '12W', value: 32 },
  ];

  const costColors = ['#22c55e', '#22c55e', '#22c55e', '#3b82f6'];

  return (
    <div 
      ref={dashboardRef}
      className={`bg-gray-900 text-white rounded-xl p-2 sm:p-3 shadow-2xl border border-gray-800 h-full w-full overflow-hidden flex flex-col transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
      }`}
    >
      <div className="flex items-center gap-2 mb-1 sm:mb-2 flex-shrink-0">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-white">Financial Performance</h2>
      </div>
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-shrink-0">
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 border border-gray-700 hover:border-green-500/50 hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
          <div className="text-[9px] sm:text-[10px] text-gray-400 mb-0.5">Total Profit</div>
          <div className="text-base sm:text-lg font-bold text-white">$120M</div>
          <div className="flex items-center mt-0.5 sm:mt-1 text-green-400">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-[9px] sm:text-[10px]">Growth</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
          <div className="text-[9px] sm:text-[10px] text-gray-400 mb-0.5">Revenue</div>
          <div className="text-base sm:text-lg font-bold text-white">$500M</div>
          <div className="flex items-center mt-0.5 sm:mt-1 text-green-400">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-[9px] sm:text-[10px]">Trending Up</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 border border-gray-700 hover:border-red-500/50 hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20">
          <div className="text-[9px] sm:text-[10px] text-gray-400 mb-0.5">Expenses</div>
          <div className="text-base sm:text-lg font-bold text-white">$380M</div>
          <div className="flex items-center mt-0.5 sm:mt-1 text-red-400">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            <span className="text-[9px] sm:text-[10px]">Decreasing</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 border border-gray-700 hover:border-emerald-500/50 hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20">
          <div className="text-[9px] sm:text-[10px] text-gray-400 mb-0.5">Operating Margin</div>
          <div className="text-base sm:text-lg font-bold text-white">24%</div>
          <div className="flex items-center mt-0.5 sm:mt-1 text-green-400">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-[9px] sm:text-[10px]">Positive</span>
          </div>
        </div>
      </div>

      {/* Middle Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-1 min-h-0">
        {/* Revenue vs Expenses */}
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 border border-gray-700 flex flex-col min-h-0 hover:border-gray-600 transition-all duration-300">
          <h3 className="text-[9px] sm:text-[10px] font-medium mb-1 text-gray-300 flex-shrink-0">Revenue vs Expenses</h3>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueExpensesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={9} />
                <YAxis stroke="#9ca3af" fontSize={9} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #3b82f6', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '9px' }} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  name="Revenue"
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  name="Gross Profit"
                  dot={{ fill: '#22c55e', r: 3 }}
                  activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  name="Expenses"
                  dot={{ fill: '#ef4444', r: 3 }}
                  activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[8px] sm:text-[9px] text-gray-400 mt-1 text-center flex-shrink-0">Past 12 months</div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 border border-gray-700 flex flex-col min-h-0 hover:border-gray-600 transition-all duration-300">
          <h3 className="text-[9px] sm:text-[10px] font-medium mb-1 text-gray-300 flex-shrink-0">Cost Breakdown</h3>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costBreakdownData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={9} domain={[0, 50]} />
                <YAxis dataKey="category" type="category" stroke="#ffffff" fontSize={9} width={60} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #22c55e', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number | undefined) => value !== undefined ? `${value}%` : ''}
                  cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {costBreakdownData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={costColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 sm:gap-2 flex-1 min-h-0">
        {/* Profit Margin Trend */}
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 border border-gray-700 flex flex-col min-h-0 hover:border-gray-600 transition-all duration-300">
          <h3 className="text-[9px] sm:text-[10px] font-medium mb-1 text-gray-300 flex-shrink-0">Profit Margin Trend</h3>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitMarginData}>
                <defs>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={9} />
                <YAxis stroke="#9ca3af" fontSize={9} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #3b82f6', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number | undefined) => value !== undefined ? `${value}%` : ''}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="margin"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMargin)"
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Forecast */}
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 border border-gray-700 flex flex-col min-h-0 hover:border-gray-600 transition-all duration-300">
          <h3 className="text-[9px] sm:text-[10px] font-medium mb-1 text-gray-300 flex-shrink-0">Financial Forecast</h3>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis stroke="#9ca3af" fontSize={9} />
                <YAxis stroke="#9ca3af" fontSize={9} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #3b82f6', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number | undefined) => value !== undefined ? `${value}%` : ''}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '9px' }} />
                <Line
                  type="monotone"
                  data={forecastActualData}
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  data={forecastProjectedData}
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#60a5fa', r: 4 }}
                  activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
                  name="Projected"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;


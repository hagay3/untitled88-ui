'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import dynamic from 'next/dynamic';

// Dynamically import GeoMapChart to avoid SSR issues
const GeoMapChart = dynamic(() => import('./GeoMapChart'), { ssr: false });

const SalesDashboard: React.FC = () => {

  // Mock data for revenue trend
  const revenueTrendData = [
    { time: '00 M', actual: 4, predicted: 4 },
    { time: '2S M', actual: 30, predicted: 20 },
    { time: '12S m', actual: 90, predicted: 50 },
    { time: '10S m', actual: 30, predicted: 80 },
    { time: '33S m', actual: 180, predicted: 150 },
  ];

  // Mock data for campaigns - sorted by value descending for top performers
  const campaignsData = [
    { name: 'Summer Sale', value: 125000, color: '#10b981' },
    { name: 'Black Friday', value: 98000, color: '#3b82f6' },
    { name: 'Holiday Promo', value: 87000, color: '#8b5cf6' },
    { name: 'New Year', value: 72000, color: '#f59e0b' },
    { name: 'Spring Launch', value: 65000, color: '#ec4899' },
  ];

  return (
    <div className="bg-[#1a1d2e] text-white rounded-xl p-3 sm:p-4 shadow-2xl border border-gray-800 h-full w-full overflow-hidden flex flex-col">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-base sm:text-lg font-semibold">Revenue & Growth</span>
        </div>

      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4 flex-shrink-0">
        <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-700/50 hover:border-green-500/50 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Total Revenue</div>
          <div className="text-xl sm:text-2xl font-bold text-white mb-1">$88M</div>
          <div className="h-1 bg-green-500 rounded-full w-16 mb-1"></div>
          <div className="flex items-center text-green-400">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-700/50 hover:border-blue-400/50 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-blue-400/20">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Monthly Growth</div>
          <div className="text-xl sm:text-2xl font-bold text-white mb-1">15%</div>
          <div className="h-1 bg-blue-400 rounded-full w-12 mb-1"></div>
          <div className="flex items-center text-green-400">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-1">New Customers</div>
          <div className="text-xl sm:text-2xl font-bold text-white mb-1">30K</div>
          <div className="h-1 bg-blue-500 rounded-full w-14 mb-1"></div>
          <div className="flex items-center text-blue-400">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-700/50 hover:border-green-400/50 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-green-400/20">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Conversion Rate</div>
          <div className="text-xl sm:text-2xl font-bold text-white mb-1">12.5%</div>
          <div className="h-1 bg-blue-400 rounded-full w-16 mb-1"></div>
          <div className="flex items-center text-green-400">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        </div>
      </div>

      {/* Middle Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3 flex-1 min-h-0">
        {/* Revenue Trend Chart */}
        <div className="bg-gray-800/30 rounded-lg p-2 sm:p-3 border border-cyan-500/30 flex flex-col min-h-0 hover:border-cyan-500/60 transition-all duration-300">
          <h3 className="text-xs sm:text-sm font-medium mb-2 text-white">Revenue Trend & Forecast</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={9} />
                <YAxis stroke="#9ca3af" fontSize={9} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #06b6d4', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#06b6d4" 
                  strokeWidth={2} 
                  dot={{ fill: '#06b6d4', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                  name="Actual"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#06b6d4" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={{ fill: '#0891b2', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, fill: '#0891b2', stroke: '#fff', strokeWidth: 2 }}
                  name="Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Sales Map */}
        <div className="bg-gray-800/30 rounded-lg p-2 sm:p-3 border border-gray-700/50 flex flex-col min-h-0 hover:border-gray-600 transition-all duration-300">
          <h3 className="text-xs sm:text-sm font-medium mb-2 text-white">Global Sales by Region</h3>
          <div className="flex-1 min-h-0 relative">
            <GeoMapChart className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 flex-1 min-h-0">
        {/* Top Performing Campaigns */}
        <div className="bg-gray-800/30 rounded-lg p-2 sm:p-3 border border-gray-700/50 flex flex-col min-h-0 hover:border-green-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <h3 className="text-xs sm:text-sm font-medium text-white">Top Performing Campaigns</h3>
            <span className="text-[10px] text-gray-400">Revenue</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={campaignsData} 
                margin={{ top: 5, right: 5, left: 0, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={9}
                  tick={{ fill: '#9ca3af' }}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={9}
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #10b981', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number | undefined) => value !== undefined ? [`$${value.toLocaleString()}`, 'Revenue'] : ['', 'Revenue']}
                  cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                >
                  {campaignsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI-Powered Insights */}
        <div className="bg-gray-800/30 rounded-lg p-2 sm:p-3 border border-gray-700/50 flex flex-col min-h-0">
          <h3 className="text-xs sm:text-sm font-medium mb-2 text-white">AI-Powered Insights</h3>
          <div className="flex-1 flex flex-col justify-center space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
              <p className="text-[10px] sm:text-xs text-gray-300">Identified Q3 revenue dip utue ad-spend saturation.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
              <p className="text-[10px] sm:text-xs text-gray-300">Forecast suggests 10% growth next quarter.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;


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
  Legend,
  ResponsiveContainer,
} from 'recharts';

const ChurnPredictionDashboard: React.FC = () => {

  // Mock data for churn trend
  const churnTrendData = [
    { time: '0w', actual: 0, predicted: 0 },
    { time: '12w', actual: 40, predicted: 25 },
    { time: '10w', actual: 20, predicted: 18 },
    { time: '20w', actual: 42, predicted: 35 },
    { time: '80w', actual: 30, predicted: 35 },
    { time: '12m', actual: 55, predicted: 38 },
  ];

  // Mock data for churn by segment
  const churnBySegmentData = [
    { segment: 'Free Tier', value: 88 },
    { segment: 'Small Business', value: 35 },
    { segment: 'Enterprise', value: 20 },
    { segment: 'Inactive Users', value: 20 },
  ];

  // Mock data for retention heat map
  const retentionData = [
    { cohort: 1, month1: 95, month2: 92, month3: 90, month4: 88, month5: 85, month6: 82, month7: 80, month8: 78, month9: 75, month10: 72, month11: 70, month12: 68 },
    { cohort: 2, month1: 90, month2: 85, month3: 80, month4: 75, month5: 70, month6: 65, month7: 60, month8: 55, month9: 50, month10: 45, month11: 40, month12: 35 },
    { cohort: 4, month1: 85, month2: 78, month3: 70, month4: 62, month5: 55, month6: 48, month7: 42, month8: 38, month9: 35, month10: 32, month11: 30, month12: 28 },
    { cohort: 5, month1: 80, month2: 70, month3: 60, month4: 50, month5: 42, month6: 35, month7: 30, month8: 28, month9: 25, month10: 22, month11: 20, month12: 18 },
    { cohort: 10, month1: 75, month2: 65, month3: 55, month4: 45, month5: 38, month6: 32, month7: 28, month8: 25, month9: 22, month10: 20, month11: 18, month12: 15 },
    { cohort: 20, month1: 70, month2: 60, month3: 50, month4: 40, month5: 32, month6: 28, month7: 25, month8: 22, month9: 20, month10: 18, month11: 15, month12: 12 },
  ];

  const getHeatMapColor = (value: number) => {
    if (value >= 80) return '#1e40af'; // Dark blue
    if (value >= 60) return '#3b82f6'; // Medium blue
    if (value >= 40) return '#60a5fa'; // Light blue
    return '#93c5fd'; // Very light blue
  };

  const riskScore = 28;

  return (
    <div className="bg-gray-900 text-white rounded-xl p-3 sm:p-4 shadow-2xl border border-gray-800 h-full w-full overflow-hidden flex flex-col">
      <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-white">Churn Prediction & Retention</h2>
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-2 sm:mb-3 flex-shrink-0">
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Current Churn Rate</div>
          <div className="text-lg sm:text-xl font-bold text-white">15.2%</div>
          <div className="flex items-center mt-1 sm:mt-2 text-green-400">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-xs">Decreasing</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Monthly Trend</div>
          <div className="text-lg sm:text-xl font-bold text-white">0.5%</div>
          <div className="flex items-center mt-1 sm:mt-2 text-red-400">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-xs">Trending</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">High-Risk Customers</div>
          <div className="text-lg sm:text-xl font-bold text-white">3,200</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Retention Rate</div>
          <div className="text-lg sm:text-xl font-bold text-white">84.8%</div>
          <div className="flex items-center mt-1 sm:mt-2 text-green-400">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-xs">Increasing</span>
          </div>
        </div>
      </div>

      {/* Middle Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3 flex-1 min-h-0">
        {/* Churn Trend Chart */}
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700 flex flex-col min-h-0">
          <h3 className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-2 text-gray-300">Churn Trend</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={churnTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual Churn %" />
              <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Predicted %" />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Retention Heat Map */}
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700 flex flex-col min-h-0">
          <h3 className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-2 text-gray-300">Retention Heat Map</h3>
          <div className="overflow-auto flex-1 min-h-0">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-12 gap-0.5 sm:gap-1 mb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                  <div key={month} className="text-[10px] sm:text-xs text-gray-400 text-center">{month}m</div>
                ))}
              </div>
              {retentionData.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                  <div className="text-[10px] sm:text-xs text-gray-400 pr-1 sm:pr-2 flex items-center">{row.cohort}</div>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                    const value = row[`month${month}` as keyof typeof row] as number;
                    return (
                      <div
                        key={month}
                        className="h-4 sm:h-5 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: getHeatMapColor(value) }}
                        title={`Cohort ${row.cohort}, Month ${month}: ${value}%`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-2">Months Since Signup</div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 flex-1 min-h-0">
        {/* Churn by Segment */}
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700 flex flex-col min-h-0">
          <h3 className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-2 text-gray-300">Churn by Segment</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={churnBySegmentData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis dataKey="segment" type="category" stroke="#9ca3af" fontSize={12} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* AI Churn Prediction */}
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700 flex flex-col min-h-0">
          <h3 className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-2 text-gray-300">AI Churn Prediction</h3>
          <div className="flex items-center justify-center mb-1 sm:mb-2 flex-1 min-h-0">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
              <svg className="transform -rotate-90 w-24 h-24 sm:w-32 sm:h-32">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#374151"
                  strokeWidth="8"
                  fill="none"
                  className="sm:hidden"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(riskScore / 100) * 175.93} 175.93`}
                  strokeLinecap="round"
                  className="sm:hidden"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#374151"
                  strokeWidth="10"
                  fill="none"
                  className="hidden sm:block"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${(riskScore / 100) * 226.19} 226.19`}
                  strokeLinecap="round"
                  className="hidden sm:block"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-white">{riskScore}%</div>
                  <div className="text-[8px] sm:text-[10px] text-gray-400">Risk Score</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-1 sm:mt-2 space-y-1 sm:space-y-1.5 flex-shrink-0">
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
              <span className="text-gray-400">Free Tier</span>
              <span className="text-red-400">High</span>
            </div>
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
              <span className="text-gray-400">Small Business</span>
              <span className="text-yellow-400">Medium</span>
            </div>
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
              <span className="text-gray-400">Enterprise</span>
              <span className="text-green-400">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChurnPredictionDashboard;


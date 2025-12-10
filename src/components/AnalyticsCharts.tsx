import React, { memo } from 'react';
import { Pie, Line, Bar } from 'react-chartjs-2';

interface AnalyticsChartsProps {
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsTimeline: Array<{ hour: string; count: number }>;
}

// Memoized chart components for better performance
export const AnalyticsCharts = memo(({ eventsByType, eventsBySeverity, eventsTimeline }: AnalyticsChartsProps) => {
  return (
    <>
      {/* Events by Type - Pie Chart */}
      <div>
        {Object.keys(eventsByType).length > 0 ? (
          <Pie
            data={{
              labels: Object.keys(eventsByType),
              datasets: [{
                data: Object.values(eventsByType),
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
              }]
            }}
            options={{ 
              responsive: true, 
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>

      {/* Events by Severity - Bar Chart */}
      <div>
        {Object.keys(eventsBySeverity).length > 0 ? (
          <Bar
            data={{
              labels: Object.keys(eventsBySeverity),
              datasets: [{
                label: 'Count',
                data: Object.values(eventsBySeverity),
                backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444', '#B71C1C']
              }]
            }}
            options={{ 
              responsive: true, 
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  display: false
                }
              }
            }}
          />
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>

      {/* Events Timeline - Line Chart */}
      <div>
        {eventsTimeline.length > 0 ? (
          <Line
            data={{
              labels: eventsTimeline.map(t => t.hour),
              datasets: [{
                label: 'Events',
                data: eventsTimeline.map(t => t.count),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
              }]
            }}
            options={{ 
              responsive: true, 
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>
    </>
  );
});

AnalyticsCharts.displayName = 'AnalyticsCharts';

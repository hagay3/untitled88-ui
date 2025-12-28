'use client';

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { ChoroplethController, GeoFeature, ColorScale, ProjectionScale } from 'chartjs-chart-geo';
import * as topojson from 'topojson-client';

// Register Chart.js components
Chart.register(...registerables, ChoroplethController, GeoFeature, ColorScale, ProjectionScale);

interface GeoMapChartProps {
  className?: string;
}

const GeoMapChart: React.FC<GeoMapChartProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Fetch world atlas data
    fetch('https://unpkg.com/world-atlas@2.0.2/countries-50m.json')
      .then((response) => response.json())
      .then((worldData) => {
        const countries = (topojson.feature(worldData, worldData.objects.countries) as any).features;

        // Sample sales data for countries
        const salesData: { [key: string]: number } = {
          'United States of America': 25,
          'China': 30,
          'Germany': 18,
          'United Kingdom': 15,
          'France': 12,
          'Japan': 20,
          'India': 22,
          'Brazil': 8,
          'Canada': 14,
          'Australia': 7,
          'Russia': 10,
          'South Korea': 16,
          'Italy': 11,
          'Spain': 9,
          'Mexico': 6,
        };

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart
        if (chartRef.current) {
          chartRef.current.destroy();
        }

        // Create new chart
        chartRef.current = new Chart(ctx, {
          type: 'choropleth',
          data: {
            labels: countries.map((d: any) => d.properties.name),
            datasets: [
              {
                label: 'Sales by Region ($M)',
                data: countries.map((d: any) => ({
                  feature: d,
                  value: salesData[d.properties.name] || 0,
                })),
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: (context: any) => {
                    const value = context.raw.value;
                    return value > 0 ? `Sales: $${value}M` : 'No data';
                  },
                },
                backgroundColor: '#1f2937',
                borderColor: '#06b6d4',
                borderWidth: 1,
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                displayColors: false,
              },
            },
            scales: {
              projection: {
                axis: 'x',
                projection: 'equalEarth',
              },
              color: {
                axis: 'x',
                quantize: 5,
                interpolate: (v: number) => {
                  // Custom color scale from dark to cyan
                  if (v === 0) return '#1e293b';
                  if (v < 0.2) return '#164e63';
                  if (v < 0.4) return '#0e7490';
                  if (v < 0.6) return '#0891b2';
                  if (v < 0.8) return '#06b6d4';
                  return '#22d3ee';
                },
                legend: {
                  position: 'bottom-right',
                  align: 'right',
                },
              },
            },
          },
        } as any);
      })
      .catch((error) => {
        console.error('Error loading world atlas:', error);
      });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
};

export default GeoMapChart;


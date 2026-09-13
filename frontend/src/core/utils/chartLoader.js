/**
 * ChartLoader Utility
 * Provides seamless loading and access to Chart.js across ERP modules.
 */
import Chart from 'chart.js/auto';

export function getChart() {
  if (typeof window !== 'undefined' && window.Chart) {
    return window.Chart;
  }
  if (typeof window !== 'undefined') {
    window.Chart = Chart;
  }
  return Chart;
}

export async function loadChartJs() {
  if (typeof window !== 'undefined' && window.Chart) {
    return window.Chart;
  }
  try {
    window.Chart = Chart;
    return Chart;
  } catch (e) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
      s.onload = () => resolve(window.Chart);
      s.onerror = (err) => reject(err);
      document.head.appendChild(s);
    });
  }
}

export default Chart;

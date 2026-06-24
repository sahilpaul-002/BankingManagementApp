import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

export default function OutboundChartSection() {
  // Sample data for 30 days
  const chartData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    payouts: Math.random() * 5000 + 2000,
    cardSpend: Math.random() * 3000 + 1000
  }));

  // Prepare data for ECharts
  const days = chartData.map(d => d.day);
  const payoutsData = chartData.map(d => d.payouts);
  const cardSpendData = chartData.map(d => d.cardSpend);

  const option: EChartsOption = {
    grid: {
      left: 0,
      right: 0,
      top: 10,
      bottom: 0,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: days,
      show: false
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [
      {
        name: 'Payouts',
        type: 'bar',
        stack: 'total',
        data: payoutsData,
        itemStyle: {
          color: 'var(--nav-bg)',
          borderRadius: [2, 2, 0, 0]
        },
        barGap: 0,
        barCategoryGap: '2%'
      },
      {
        name: 'Card spend',
        type: 'bar',
        stack: 'total',
        data: cardSpendData,
        itemStyle: {
          color: 'var(--gold)',
          borderRadius: [2, 2, 0, 0]
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    }
  };

  return (
    <div 
      className="p-6 border mb-6"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--line)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div 
        className="text-[10.5px] font-semibold tracking-[0.28em] uppercase flex items-center gap-2.5 mb-3.5"
        style={{ color: 'var(--ink-soft)' }}
      >
        <span style={{ color: 'var(--gold)' }}>—</span>
        Outbound · Last 30 Days
      </div>

      <div 
        className="font-medium tracking-[-0.004em] mb-4"
        style={{ 
          fontFamily: 'var(--display)',
          fontSize: '32px',
          lineHeight: '1',
          color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        $52,450
        <span 
          className="font-semibold uppercase ml-1.5"
          style={{ 
            fontFamily: 'var(--sans)',
            fontSize: '0.55em',
            color: 'var(--mute)',
            letterSpacing: '0.18em',
            verticalAlign: '0.18em'
          }}
        >
          USD
        </span>
      </div>

      {/* ECharts Chart */}
      <div className="h-24">
        <ReactECharts 
          option={option} 
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[11px]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ backgroundColor: 'var(--nav-bg)' }} />
          <span style={{ color: 'var(--ink-soft)' }}>Payouts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ backgroundColor: 'var(--gold)' }} />
          <span style={{ color: 'var(--ink-soft)' }}>Card spend</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex justify-between mt-2 text-[11px]" style={{ color: 'var(--mute)' }}>
        <span>30 days ago</span>
        <span>21 days</span>
        <span>14 days</span>
        <span>7 days</span>
        <span>Today</span>
      </div>
    </div>
  );
}
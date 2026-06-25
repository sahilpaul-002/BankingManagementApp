import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

export default function ExpenditureChartSection() {
  // Sample data for 30 days
  const chartData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    dayLabel: i === 29 ? "Today" : `${29 - i} days ago`,
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
    // grid: {
    //   left: 0,
    //   right: 0,
    //   top: 10,
    //   bottom: 10,
    //   containLabel: true
    // },
    // legend: {
    //   show: true,
    //   top: 0,
    //   right: 0,
    //   itemWidth: 12,
    //   itemHeight: 12,

    //   textStyle: {
    //     color: 'var(--ink-soft)',
    //     fontSize: 12
    //   }
    // },
    xAxis: {
      type: "category",
      data: chartData.map(d => d.dayLabel),
      // show: true
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
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(212, 159, 74, 0.6)',
        }
      }
    }
  };

  return (
    <div className="expenditureSection-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)]">
      <div className="expenditureSection-header-text text-xs sm:text-sm text-[var(--ink-soft)] font-semibold tracking-[0.28em] uppercase flex items-center gap-2.5 mb-3!">
        <span className='text-[var(--gold)]'>—</span>
        Expenditure · Last 30 Days
      </div>

      <div className="expenditureSection-totalExpenditureAmount-text text-xl sm:text-2xl text-[var(--ink)] font-medium mb-4!">
        $52,450
        <span className="text-sm sm:text-md text-[var(--mute)] font-semibold uppercase ml-2!">
          USD
        </span>
      </div>

      {/* ECharts Chart */}
      <div className="expenditureSection-chart h-24">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>

      {/* Timeline */}
      <div className="flex justify-between mt-2! text-[var(--mute)] text-xs" >
        <span>30 days ago</span>
        <span>21 days</span>
        <span>14 days</span>
        <span>7 days</span>
        <span>Today</span>
      </div>

      {/* Legend */}
      <div className="expenditureSection-chartLegend flex items-center gap-4 mt-4! text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[var(--nav-bg)] rounded-[3px]" />
          <span className='text-[var(--ink-soft)]'>Payouts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[var(--gold)] rounded-[3px]" />
          <span className='text-[var(--ink-soft)]'>Card spend</span>
        </div>
      </div>
    </div>
  );
}
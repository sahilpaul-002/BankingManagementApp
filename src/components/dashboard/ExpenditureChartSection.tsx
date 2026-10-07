import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useDispatch, useSelector } from 'react-redux';
import { Activity, useEffect } from 'react';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import { useGetPayoutsExpendituresQuery } from '@/redux/features/transfer/transferApis';
import type {
  CardExpenditureChartResponseDataType,
  ExpenditureChartItemType,
  PayoutExpenditureChartResponseDataType,
} from '@/types/dashboard/expenditureChartSectionTypes';
import { useGetAllCardsExpendituresQuery } from '@/redux/features/card/cardApi';
import ShowInConsole from '@/utils/ShowInConsole';
import { ChartNoAxesCombined, Info } from 'lucide-react';
import { selectIsAdmin, selectIsMasterAdmin } from '@/redux/slice/user/userSlice';

export default function ExpenditureChartSection() {
  // Configure useDispatch
  const dispatch = useDispatch();

  const isAdmin = useSelector(selectIsAdmin);
  const isMasterAdmin = useSelector(selectIsMasterAdmin);
  const canAccessPayoutsExpenditures = isAdmin || isMasterAdmin;

  // ------------------------------- GET EMAIL FROM SESSION STORAGE ---------------------------------- \\
  // Get necessary user details from session storage
  const userEmail = sessionStorage.getItem('userEmail');
  const userId = sessionStorage.getItem('userId');
  const userCardholderId = sessionStorage.getItem('cardholderId');

  useEffect(() => {
    // Validate email once
    if (!userEmail || !userId || !userCardholderId) {
      dispatch(
        setShowInfoBanner(
          'Application facing issue, necessary user details not present in session storage. Please re-login.'
        )
      );
      return;
    }
  }, [userEmail, userId, userCardholderId, dispatch]);
  // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

  // ----------------------------- Date Range Calculation ----------------------------- \\
  const today = new Date();

  const fromDateObject = new Date(today);
  fromDateObject.setDate(today.getDate() - 29);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const fromDate = formatDate(fromDateObject);
  const toDate = formatDate(today);
  // ----------------------------- XXXXXXXXXXXXXXXXXXXXX ----------------------------- \\

  // ----------------------- PAYOUTS EXPENDITURES / ALL CARDS EXPENDITURES ----------------------- \\
  // Payouts Expenditures
  const {data: getPayoutsExpendituresData, isLoading: getPayoutsExpendituresIsLoading, isFetching: getPayoutsExpendituresIsFetching, isError: getPayoutsExpendituresIsError} = useGetPayoutsExpendituresQuery({email: userEmail!, userId: userId!, fromDate: fromDate, toDate: toDate}, { skip: !userEmail || !userId || !canAccessPayoutsExpenditures, refetchOnMountOrArgChange: true });
  const payoutsExpendituresResponseData = getPayoutsExpendituresData?.data as PayoutExpenditureChartResponseDataType;
  const payoutsExpendituresList = (payoutsExpendituresResponseData?.payout_spend as ExpenditureChartItemType[]) ?? [];
  const hasPayoutExpenditure = !getPayoutsExpendituresIsError && payoutsExpendituresList.some((item) => Number(item.amount) > 0);

  // All Cards Expenditures
  const {data: getAllCardsExpendituresData, isLoading: getAllCardsExpendituresIsLoading, isFetching:getAllCardsExpendituresIsFetching, isError: getAllCardsExpendituresIsError} = useGetAllCardsExpendituresQuery({email: userEmail!, cardholderId: userCardholderId!, fromDate: fromDate, toDate: toDate}, {skip: !userEmail || !userCardholderId, refetchOnMountOrArgChange: true});
  const allCardsExpendituresResponseData = getAllCardsExpendituresData?.data as CardExpenditureChartResponseDataType;
  const allCardsExpendituresList = (allCardsExpendituresResponseData?.card_spend as ExpenditureChartItemType[]) ?? [];
  const hasCardExpenditure = !getAllCardsExpendituresIsError && allCardsExpendituresList.some((item) => Number(item.amount) > 0);

  const hasExpenditureData = hasPayoutExpenditure || hasCardExpenditure;
  const isExpenditureLoading = getPayoutsExpendituresIsLoading || getPayoutsExpendituresIsFetching || getAllCardsExpendituresIsLoading || getAllCardsExpendituresIsFetching;

  useEffect(() => {
    ShowInConsole('Payouts Expenditures', payoutsExpendituresResponseData);
  }, [payoutsExpendituresResponseData]);

  useEffect(() => {
    ShowInConsole('All Cards Expenditures', allCardsExpendituresResponseData);
  }, [allCardsExpendituresResponseData]);
  // ----------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ----------------------- \\

  // Construct Chart Data (Joining Both Api Datas)
  const payoutsMap = new Map(
    payoutsExpendituresList.map((item) => [item.date, Number(item.amount)])
  );

  const cardSpendMap = new Map(
    allCardsExpendituresList.map((item) => [item.date, Number(item.amount)])
  );

  const chartData = Array.from({ length: 30 }, (_, index) => {
    const currentDate = new Date(fromDateObject);
    currentDate.setDate(fromDateObject.getDate() + index);

    const date = formatDate(currentDate);

    return {
      date,
      day: index + 1,
      dayLabel: index === 29 ? 'Today' : `${29 - index}d ago`,
      payouts: payoutsMap.get(date) ?? 0,
      cardSpend: cardSpendMap.get(date) ?? 0,
    };
  });

  // Total Expenditures Values
  const totalPayoutSpend = Number(
    payoutsExpendituresResponseData?.total_payout_spend ?? '0'
  );
  const totalCardSpend = Number(
    allCardsExpendituresResponseData?.total_card_spend ?? '0'
  );
  const totalExpenditure = totalPayoutSpend + totalCardSpend;

  // Prepare data for ECharts
  const payoutsData = chartData.map((d) => d.payouts);
  const cardSpendData = chartData.map((d) => d.cardSpend);

  const option: EChartsOption = {
    grid: {
      left: 0,
      right: 0,
      top: 10,
      bottom: 0,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.dayLabel),
      show: false,
    },
    yAxis: {
      type: 'value',
      show: false,
      min: 0,
    },
    series: [
      {
        name: 'Payouts',
        type: 'bar',
        stack: 'expenditure',
        data: payoutsData,
        barMaxWidth: 14,
        itemStyle: {
          color: 'var(--ink-2)',
          borderRadius: [2, 2, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: 'var(--ink-soft)',
          },
        },
      },
      {
        name: 'Card spend',
        type: 'bar',
        stack: 'expenditure',
        data: cardSpendData,
        barMaxWidth: 14,
        itemStyle: {
          color: 'var(--gold)',
          borderRadius: [2, 2, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: 'var(--gold-2)',
          },
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--bg-surface)',
      borderColor: 'var(--line)',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: 'var(--ink)',
        fontSize: 12,
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(212, 154, 77, 0.1)',
        },
      },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const dataIndex = params[0].dataIndex;
        const current = chartData[dataIndex];
        const payouts = current?.payouts ?? 0;
        const cardSpend = current?.cardSpend ?? 0;
        const total = payouts + cardSpend;

        return `
          <div style="font-size: 12px; color: var(--ink);">
            <div style="font-weight: 600; margin-bottom: 6px; color: var(--ink);">${current?.date || ''} (${current?.dayLabel || ''})</div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
              <span style="color: var(--ink-soft); display: flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background-color: var(--ink-2);"></span>
                Payouts:
              </span>
              <strong style="color: var(--ink);">$${payouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 6px;">
              <span style="color: var(--ink-soft); display: flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background-color: var(--gold);"></span>
                Card spend:
              </span>
              <strong style="color: var(--ink);">$${cardSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div style="border-top: 1px solid var(--line); padding-top: 4px; display: flex; justify-content: space-between; gap: 16px;">
              <span style="font-weight: 600; color: var(--ink-soft);">Total:</span>
              <strong style="color: var(--ink);">$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          </div>
        `;
      },
    },
  };

  return (
    <>
      {/* Expenditure Loading State */}
      <Activity mode={isExpenditureLoading ? 'visible' : 'hidden'}>
        <div className="expenditureSection-container w-full h-full min-h-80 px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)] flex flex-col justify-between">
          <div className="expenditureSection-header flex items-center justify-between mb-3!">
            <div>
              <h3 className="text-xs sm:text-sm text-[var(--ink-soft)] font-semibold tracking-widest uppercase flex items-center gap-2.5">
                <span className="text-[var(--gold)]">—</span>
                Expenditure
              </h3>
              <p className="mt-1! text-xs text-[var(--ink-soft)]">
                Your expenditure for the last 30 days
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <ChartNoAxesCombined className="h-7 w-7 animate-pulse text-[var(--gold)]" />
          </div>
        </div>
      </Activity>

      {/* Expenditure Loaded State */}
      <Activity mode={!isExpenditureLoading ? 'visible' : 'hidden'}>
        {!hasExpenditureData ? (
          <div className="expenditureSection-container w-full h-full min-h-80 px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)] flex flex-col justify-between">
            <div className="expenditureSection-header flex items-center justify-between mb-3!">
              <div>
                <h3 className="text-xs sm:text-sm text-[var(--ink-soft)] font-semibold tracking-widest uppercase flex items-center gap-2.5">
                  <span className="text-[var(--gold)]">—</span>
                  Expenditure
                </h3>
                <p className="mt-1! text-xs text-[var(--ink-soft)]">
                  Your expenditure for the last 30 days
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center py-6!">
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <Info className="h-6 w-6 text-[var(--mute)]" />
                <span className="text-sm text-[var(--ink-soft)]">
                  Expenditure data is not available for the last 30 days.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="expenditureSection-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)] flex flex-col justify-between">
            {/* Header */}
            <div className="expenditureSection-header flex items-center justify-between mb-3!">
              <div>
                <h3 className="text-xs sm:text-sm text-[var(--ink-soft)] font-semibold tracking-widest uppercase flex items-center gap-2.5">
                  <span className="text-[var(--gold)]">—</span>
                  Expenditure
                </h3>
                <p className="mt-1! text-xs text-[var(--ink-soft)]">
                  Your expenditure for the last 30 days
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-[var(--ink-soft)] font-medium">
                  Total USD Equivalent Expenditure
                </p>
                <p className="mt-0.5! text-lg font-semibold text-[var(--ink)]">
                  ${totalExpenditure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="w-full pt-4!">
              <div className="h-40 w-full">
                <ReactECharts
                  option={option}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  opts={{
                    renderer: 'svg',
                  }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 pt-3!">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-xs bg-[var(--ink-2)]" />
                <span className="text-xs font-semibold text-[var(--ink-soft)]">
                  Payouts
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-xs bg-[var(--gold)]" />
                <span className="text-xs font-semibold text-[var(--ink-soft)]">
                  Card spend
                </span>
              </div>
            </div>
          </div>
        )}
      </Activity>
    </>
  );
}

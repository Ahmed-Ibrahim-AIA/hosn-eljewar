import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { calculate12MonthsHistory, MonthHistoryPoint, formatMoney } from '../utils/finance';
import { Revenue, Expense } from '../types';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Scale,
} from 'lucide-react';

interface FinancialEvolutionChartProps {
  revenues: Revenue[];
  expenses: Expense[];
  referenceMonth: string;
  currency: string;
}

type ChartType = 'area' | 'bar' | 'net';

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({
  revenues,
  expenses,
  referenceMonth,
  currency,
}) => {
  const [chartType, setChartType] = useState<ChartType>('area');

  // Compute 12-month historical series
  const data: MonthHistoryPoint[] = calculate12MonthsHistory(revenues, expenses, referenceMonth);

  // Summary statistics across 12 months
  const total12Revenues = data.reduce((sum, d) => sum + d.revenues, 0);
  const total12Expenses = data.reduce((sum, d) => sum + d.expenses, 0);
  const total12Net = total12Revenues - total12Expenses;
  const avgMonthlyRevenues = Math.round(total12Revenues / 12);
  const avgMonthlyExpenses = Math.round(total12Expenses / 12);

  // Month with highest revenue
  const peakMonth = [...data].sort((a, b) => b.revenues - a.revenues)[0];

  // Custom Arabic Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as MonthHistoryPoint;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-2 min-w-[190px]">
          <div className="font-bold border-b border-slate-700 pb-1.5 flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{point.monthLabel}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">({point.month})</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span>الإيرادات:</span>
              </span>
              <span className="font-bold text-white">
                {formatMoney(point.revenues, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-rose-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                <span>المصروفات:</span>
              </span>
              <span className="font-bold text-white">
                {formatMoney(point.expenses, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
              <span className="text-slate-300">صافي الحركة:</span>
              <span
                className={`font-black ${
                  point.netFlow >= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {point.netFlow >= 0 ? '+' : ''}
                {formatMoney(point.netFlow, currency)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                تطور الإيرادات والمصروفات خلال الـ 12 شهراً الماضية
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                رسم بياني مالي تفاعلي يوضح المقارنة الشهرية، التدفق النقدي، وصافي الفائض السنوي
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setChartType('area')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              chartType === 'area'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>مساحي (انسيابي)</span>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              chartType === 'bar'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>أعمدة مقارنة</span>
          </button>
          <button
            onClick={() => setChartType('net')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              chartType === 'net'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>صافي الفائض</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stats Cards for the 12 Months */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-medium">
            <span>إجمالي تحصيلات ١٢ شهر</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-900 mt-1">
            {formatMoney(total12Revenues, currency)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">
            بمتوسط شهري: {formatMoney(avgMonthlyRevenues, currency)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100">
          <div className="flex items-center justify-between text-rose-800 text-xs font-medium">
            <span>إجمالي مصروفات ١٢ شهر</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-black text-rose-900 mt-1">
            {formatMoney(total12Expenses, currency)}
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5">
            بمتوسط شهري: {formatMoney(avgMonthlyExpenses, currency)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
          <div className="flex items-center justify-between text-indigo-800 text-xs font-medium">
            <span>صافي الفائض السنوي</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className={`text-lg font-black mt-1 ${total12Net >= 0 ? 'text-indigo-900' : 'text-rose-700'}`}>
            {total12Net >= 0 ? '+' : ''}{formatMoney(total12Net, currency)}
          </div>
          <div className="text-[11px] text-indigo-700 mt-0.5">
            {total12Net >= 0 ? 'وفر نقدي متراكم بالخزينة' : 'عجز تراكمي'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
          <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
            <span>أعلى شهر في الإيرادات</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-900 mt-1">
            {peakMonth ? formatMoney(peakMonth.revenues, currency) : '—'}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            شهر {peakMonth ? peakMonth.monthLabel : '—'}
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                formatter={(value) => {
                  if (value === 'revenues') return 'الإيرادات والتحصيلات';
                  if (value === 'expenses') return 'المصروفات المنصرفة';
                  return value;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenues"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenues)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExpenses)"
              />
            </AreaChart>
          ) : chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                formatter={(value) => {
                  if (value === 'revenues') return 'الإيرادات والتحصيلات';
                  if (value === 'expenses') return 'المصروفات المنصرفة';
                  return value;
                }}
              />
              <Bar dataKey="revenues" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                formatter={() => 'صافي التدفق الشهري (فائض / عجز)'}
              />
              <Bar
                dataKey="netFlow"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                fill="#6366f1"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-3 gap-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>الإيرادات تشمل الاشتراكات الشهرية، رسوم الصيانة، والمساهمات الطارئة</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>المصروفات تشمل المصروفات الدورية الثابتة والفواتير والإصلاحات</span>
        </span>
      </div>

    </div>
  );
};

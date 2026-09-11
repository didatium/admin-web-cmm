import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  apiGet,
  useClasses,
  useRules,
  useScoreByWeek,
  useViphamByWeek,
  useWeeks,
  getCurrentWeekId,
  isScoreStale,
} from '@/shared';

import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../auth/AuthContext';

function getViolationCount(entry: any): number {
  if (!entry) return 0;

  // Two types:
  // - Normal violation: bonus == null -> quantity = number of students who violated
  // - Bonus/penalty record: bonus != null -> quantity = class-specific reward/penalty points
  //   If bonus != null and quantity < 0 (penalty points) it counts as 1 violation.
  const hasBonus = entry?.bonus != null;
  const rawQty = Number(entry?.quantity ?? 0);

  if (!hasBonus) {
    const q = Number.isFinite(rawQty) ? rawQty : 1;
    return q > 0 ? q : 0;
  }

  // hasBonus === true
  if (rawQty < 0) return 1; // penalty counts as one violation
  return 0; // reward or non-penalty bonus does not count as violation for counts
}

function DashboardCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="flex h-40 items-center justify-center text-sm text-slate-500">{message}</div>;
}

export function DashboardPage() {
  const { user } = useAuth();

  const { data: weeks = [], isLoading: weeksLoading, error: weeksError } = useWeeks();
  const { data: classes = [], isLoading: classesLoading, error: classesError } = useClasses();
  const { data: rules = [], isLoading: rulesLoading, error: rulesError } = useRules();

  const weekList = useMemo(() => (Array.isArray(weeks) ? weeks : []), [weeks]);
  const currentWeekId = useMemo(() => getCurrentWeekId(weekList, true), [weekList]);
  const currentWeek = useMemo(
    () => weekList.find((week: any) => String(week.week_id) === String(currentWeekId)),
    [weekList, currentWeekId],
  );

  const { data: currentWeekViolations = [], isLoading: violationsLoading, error: violationsError } = useViphamByWeek(currentWeekId);
  const { data: currentWeekScores = [], isLoading: scoresLoading, error: scoresError } = useScoreByWeek(currentWeekId);

  const recentWeeks = useMemo(() => {
    // identify current week index and take previous 5 weeks + current week (if available)
    const idx = weekList.findIndex((w: any) => String(w.week_id) === String(currentWeekId));
    if (idx >= 0) {
      const start = Math.max(0, idx - 5);
      return weekList.slice(start, idx + 1);
    }
    // fallback: last up to 6 weeks
    return weekList.slice(-6);
  }, [weekList, currentWeekId]);

  const trendQueries = useQueries({
    queries: recentWeeks.map((week: any) => ({
      queryKey: ['dashboard', 'vipham-week', week.week_id],
      queryFn: () => apiGet(`/viphamweek/${week.week_id}`),
      enabled: !!week.week_id,
      staleTime: 60_000,
    })),
  });

  const classMap = useMemo(
    () => Object.fromEntries((classes as any[]).map((cls: any) => [String(cls.class_id), cls])),
    [classes],
  );

  const ruleMap = useMemo(
    () => Object.fromEntries((rules as any[]).map((rule: any) => [String(rule.name_vp_id), rule])),
    [rules],
  );

  const currentClassTotals = useMemo(() => {
    const totals = new Map<string, number>();

    for (const item of Array.isArray(currentWeekViolations) ? currentWeekViolations : []) {
      const classId = String(item?.class_id ?? '');
      const cls = classMap[classId];
      const className = cls?.class_name.slice(3) ?? `Lớp ${classId}`;
      const count = getViolationCount(item);

      totals.set(className, (totals.get(className) ?? 0) + count);
    }

    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [classMap, currentWeekViolations]);

  const currentBreakdown = useMemo(() => {
    const groups = new Map<string, number>();
    const violations = Array.isArray(currentWeekViolations) ? currentWeekViolations : [];
    const total = violations.reduce((sum, item) => sum + getViolationCount(item), 0);

    for (const item of violations) {
      const ruleId = String(item?.name_vp_id ?? '');
      const rule = ruleMap[ruleId];
      const label = (rule?.type && String(rule.type).trim()) || rule?.name_vp || `VP ${ruleId || 'khác'}`;
      const count = getViolationCount(item);
      groups.set(label, (groups.get(label) ?? 0) + count);
    }

    const sorted = Array.from(groups.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Keep top 6 types by number of students; aggregate the rest into 'Khác'
    const TOP_N = 6;
    const top = sorted.slice(0, TOP_N);
    const rest = sorted.slice(TOP_N);
    const restSum = rest.reduce((s, e) => s + e.value, 0);

    const result = top.map((e) => ({
      name: e.name,
      value: e.value,
      percentage: total > 0 ? (e.value / total) * 100 : 0,
    }));

    if (restSum > 0) {
      result.push({ name: 'Khác', value: restSum, percentage: total > 0 ? (restSum / total) * 100 : 0 });
    }

    return result;
  }, [currentWeekViolations, ruleMap]);

  const schoolTrend = useMemo(() => {
    return recentWeeks.map((week: any, index: number) => {
      const result = trendQueries[index]?.data ?? [];
      const total = (Array.isArray(result) ? result : []).reduce(
        (sum, item) => sum + getViolationCount(item),
        0,
      );

      return {
        weekLabel: week.week_name || `Tuần ${index + 1}`,
        total,
      };
    });
  }, [recentWeeks, trendQueries]);

  const rankingData = useMemo(() => {
    const list = (classes as any[]).map((cls: any) => {
      const scoreRecord = (currentWeekScores as any[]).find(
        (score: any) => String(score.class_id) === String(cls.class_id),
      );
      const score = scoreRecord?.score != null ? Number(scoreRecord.score) : 0;

      return {
        class_id: cls.class_id,
        class_name: cls.class_name,
        grade: cls.grade,
        score,
      };
    });

    return list.sort((a, b) => b.score - a.score);
  }, [classes, currentWeekScores]);

  const topFive = rankingData.slice(0, 5);
  const bottomFive = [...rankingData].sort((a, b) => a.score - b.score).slice(0, 5);

  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A78BFA', '#F472B6', '#F59E0B'];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Xin chào, <span className="font-semibold text-slate-900">{user?.name || user?.user_name || 'Admin'}</span>
          </p>
        </div>
        <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {currentWeek ? `${currentWeek.week_name || 'Tuần hiện tại'} • ${currentWeek.start_date || '—'} → ${currentWeek.end_date || '—'}` : 'Chưa có dữ liệu tuần hiện tại'}
        </div>
      </div>

      <div className="grid gap-4">
        <DashboardCard title="Vi phạm theo lớp (tuần hiện tại)">
          {weeksLoading || classesLoading || violationsLoading ? (
            <WidgetSkeleton />
          ) : weeksError || classesError || violationsError ? (
            <EmptyState message="Không thể tải dữ liệu lớp/vi phạm tuần này" />
          ) : currentClassTotals.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu tuần này" />
          ) : (
            // Increased height to accommodate many classes (~30)
            <div className="h-[520px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentClassTotals} margin={{ top: 20, right: 20, left: 10, bottom: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={120} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Xu hướng vi phạm toàn trường">
          {weeksLoading || trendQueries.some((query) => query.isLoading) ? (
            <WidgetSkeleton />
          ) : weeksError ? (
            <EmptyState message="Không thể tải xu hướng vi phạm" />
          ) : schoolTrend.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu tuần này" />
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={schoolTrend} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Phân bổ loại vi phạm (tuần hiện tại)">
          {rulesLoading || violationsLoading ? (
            <WidgetSkeleton />
          ) : (rulesError || violationsError) ? (
            <EmptyState message="Không thể tải dữ liệu phân bổ vi phạm" />
          ) : currentBreakdown.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu tuần này" />
          ) : (
            <div className="grid h-80 grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={currentBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {currentBreakdown.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value ?? 0} vi phạm`, 'Số lượng']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {currentBreakdown.map((entry, index) => (
                  <div key={`${entry.name}-${index}`} className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-slate-700">{entry.name}</div>
                      <div className="text-xs text-slate-500">{entry.percentage.toFixed(1)}%</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{entry.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Bảng xếp hạng nhanh">
          {scoresLoading || classesLoading || weeksLoading ? (
            <WidgetSkeleton />
          ) : scoresError || classesError || weeksError ? (
            <EmptyState message="Không thể tải dữ liệu xếp hạng" />
          ) : rankingData.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu tuần này" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-emerald-700">Top 5 lớp điểm cao nhất</h3>
                </div>
                <ul className="space-y-2">
                  {topFive.map((item, idx) => (
                    <li key={`${item.class_id}-top`}>
                      <Link
                        to="/xbxh"
                        className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-sm transition hover:bg-emerald-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-800">{item.class_name}</span>
                          {isScoreStale(String(item.class_id), String(currentWeekId)) && <Badge variant="warning">Cần tính lại</Badge>}
                        </div>
                        <span className="font-semibold text-emerald-700">{Number(item.score).toFixed(1)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-rose-700">Top 5 lớp điểm thấp nhất</h3>
                </div>
                <ul className="space-y-2">
                  {bottomFive.map((item, idx) => (
                    <li key={`${item.class_id}-bottom`}>
                      <Link
                        to="/xbxh"
                        className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/80 px-3 py-2 text-sm transition hover:bg-rose-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-semibold text-white">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-800">{item.class_name}</span>
                        </div>
                        <span className="font-semibold text-rose-700">{Number(item.score).toFixed(1)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}

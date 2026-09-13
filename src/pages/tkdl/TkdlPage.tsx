import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { FileSpreadsheet, BarChart3, Filter } from 'lucide-react';
import { toast } from 'sonner';

import {
  useWeeks,
  useClasses,
  useScoreAllWeek,
  processScoreStatistics,
  processViphamStatistics,
  type ScoreStatItem,
  type ViphamStatItem,
} from '@/shared';

import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  exportScoreReportExcel,
  exportViphamReportExcel,
} from './exportTkdlExcelWeb';

export function TkdlPage() {
  const [reportType, setReportType] = useState<'diem' | 'vipham'>('diem');

  const { data: weeks, isLoading: loadingWeeks } = useWeeks();
  const { data: classes, isLoading: loadingClasses } = useClasses();
  const { data: scores, isLoading: loadingScores } = useScoreAllWeek();

  const weekList = useMemo(() => (weeks as any[]) ?? [], [weeks]);
  const classList = useMemo(() => (classes as any[]) ?? [], [classes]);
  const scoreList = useMemo(() => (scores as any[]) ?? [], [scores]);

  // Default start and end week
  const firstWeekId = weekList[0]?.week_id || 'wk01';
  const lastWeekId = weekList[weekList.length - 1]?.week_id || 'wk04';

  const [startWeekId, setStartWeekId] = useState<string>('');
  const [endWeekId, setEndWeekId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const activeStartWeekId = startWeekId || firstWeekId;
  const activeEndWeekId = endWeekId || lastWeekId;
  const activeClassId = selectedClassId || (classList[0]?.class_id || '');

  const startWeekObj = useMemo(
    () => weekList.find((w: any) => String(w.week_id) === String(activeStartWeekId)),
    [weekList, activeStartWeekId]
  );

  const endWeekObj = useMemo(
    () => weekList.find((w: any) => String(w.week_id) === String(activeEndWeekId)),
    [weekList, activeEndWeekId]
  );

  const selectClassObj = useMemo(
    () => classList.find((c: any) => String(c.class_id) === String(activeClassId)),
    [classList, activeClassId]
  );

  const startNum = parseInt(String(activeStartWeekId).replace(/\D/g, ''), 10) || 1;
  const endNum = parseInt(String(activeEndWeekId).replace(/\D/g, ''), 10) || 4;

  // Process score stats for Option 1
  const scoreStats = useMemo(() => {
    if (!scoreList.length) return [];
    const { dataByGrade } = processScoreStatistics(scoreList, startNum, endNum, classList);

    const allItems: ScoreStatItem[] = [
      ...(dataByGrade[10] || []),
      ...(dataByGrade[11] || []),
      ...(dataByGrade[12] || []),
    ];

    if (gradeFilter === 'all') return allItems;
    return allItems.filter((item) => String(item.grade) === gradeFilter);
  }, [scoreList, startNum, endNum, classList, gradeFilter]);

  // Process vipham stats for Option 2
  const viphamStats = useMemo(() => {
    if (!scoreList.length || !activeClassId) return [];
    const { statItems } = processViphamStatistics(scoreList, activeClassId, startNum, endNum);
    return statItems;
  }, [scoreList, activeClassId, startNum, endNum]);

  // Excel Export Handler
  const handleExportExcel = () => {
    if (!scoreList.length) {
      toast.error('Không có dữ liệu điểm để xuất báo cáo');
      return;
    }

    try {
      if (reportType === 'diem') {
        exportScoreReportExcel(scoreList, startWeekObj || { week_id: activeStartWeekId }, endWeekObj || { week_id: activeEndWeekId }, classList);
        toast.success('Đã xuất báo cáo thống kê điểm thành công!');
      } else {
        if (!activeClassId) {
          toast.error('Vui lòng chọn lớp học');
          return;
        }
        exportViphamReportExcel(scoreList, startWeekObj || { week_id: activeStartWeekId }, endWeekObj || { week_id: activeEndWeekId }, selectClassObj || { class_id: activeClassId });
        toast.success('Đã xuất báo cáo thống kê vi phạm thành công!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  // Columns definition for Score Statistics
  const scoreColumns: ColumnDef<ScoreStatItem>[] = useMemo(() => {
    const cols: ColumnDef<ScoreStatItem>[] = [
      {
        accessorKey: 'class_name',
        header: 'Lớp',
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">{row.original.class_name}</span>
        ),
      },
    ];

    // Weekly score columns for week numbers startNum..endNum
    for (let w = startNum; w <= endNum; w++) {
      cols.push({
        id: `week_${w}`,
        header: `T${w}`,
        cell: ({ row }) => {
          const val = row.original.weeklyScores[w];
          return val != null ? val : '—';
        },
      });
    }

    cols.push({
      accessorKey: 'totalScore',
      header: 'Tổng điểm',
      cell: ({ row }) => (
        <span className="font-bold text-primary">{row.original.totalScore}</span>
      ),
    });

    cols.push({
      accessorKey: 'rank',
      header: 'Thứ hạng',
      cell: ({ row }) => <Badge variant="outline">{row.original.rank}</Badge>,
    });

    return cols;
  }, [startNum, endNum]);

  // Columns definition for Vipham Statistics
  const viphamColumns: ColumnDef<ViphamStatItem>[] = useMemo(
    () => [
      {
        accessorKey: 'week_number',
        header: 'Tuần',
        cell: ({ row }) => (
          <span className="font-semibold">Tuần {row.original.week_number}</span>
        ),
      },
      {
        accessorKey: 'note',
        header: 'Vi phạm / Ghi chú',
        cell: ({ row }) => (
          <div className="max-w-xl text-xs whitespace-pre-line text-muted-foreground">
            {row.original.note || 'Không có vi phạm'}
          </div>
        ),
      },
      {
        accessorKey: 'score',
        header: 'Điểm số',
        cell: ({ row }) => (
          <span className="font-bold text-primary">{row.original.score}</span>
        ),
      },
    ],
    []
  );

  const isLoading = loadingWeeks || loadingClasses || loadingScores;

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thống kê dữ liệu</h1>
          <p className="text-sm text-muted-foreground">
            Xem và xuất báo cáo tổng kết thi đua, điểm số và vi phạm theo tuần
          </p>
        </div>

        <Button onClick={handleExportExcel} disabled={isLoading}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Xuất file Excel
        </Button>
      </div>

      {/* Option Switcher & Parameters Card */}
      <div className="bg-card border rounded-lg p-5 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 border-b pb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Bảng chọn thông số báo cáo</h3>
        </div>

        {/* Report Type Selector Buttons */}
        <div className="flex gap-2">
          <Button
            variant={reportType === 'diem' ? 'default' : 'outline'}
            onClick={() => setReportType('diem')}
            size="sm"
          >
            Thống kê điểm
          </Button>
          <Button
            variant={reportType === 'vipham' ? 'default' : 'outline'}
            onClick={() => setReportType('vipham')}
            size="sm"
          >
            Thống kê vi phạm
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {reportType === 'vipham' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Chọn lớp học</label>
              <Select value={activeClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp..." />
                </SelectTrigger>
                <SelectContent>
                  {classList.map((c: any) => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>
                      {c.class_name} ({c.class_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Tuần bắt đầu</label>
            <Select value={activeStartWeekId} onValueChange={setStartWeekId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn tuần..." />
              </SelectTrigger>
              <SelectContent>
                {weekList.map((w: any) => (
                  <SelectItem key={w.week_id} value={String(w.week_id)}>
                    {w.week_name || `Tuần ${String(w.week_id).replace(/\D/g, '')}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Tuần kết thúc</label>
            <Select value={activeEndWeekId} onValueChange={setEndWeekId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn tuần..." />
              </SelectTrigger>
              <SelectContent>
                {weekList.map((w: any) => (
                  <SelectItem key={w.week_id} value={String(w.week_id)}>
                    {w.week_name || `Tuần ${String(w.week_id).replace(/\D/g, '')}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reportType === 'diem' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Lọc khối (Xem nhanh)
              </label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khối..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả các khối</SelectItem>
                  <SelectItem value="10">Khối 10</SelectItem>
                  <SelectItem value="11">Khối 11</SelectItem>
                  <SelectItem value="12">Khối 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* On-Screen Report Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="min-w-0 max-w-full">
          {reportType === 'diem' ? (
            <div className="space-y-3 min-w-0 max-w-full">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Kết quả thống kê điểm từ Tuần {startNum} đến Tuần {endNum}
              </h3>
              <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card p-4 shadow-sm">
                <DataTable
                  columns={scoreColumns}
                  data={scoreStats}
                  searchPlaceholder="Tìm kiếm tên lớp..."
                  searchColumn="class_name"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 min-w-0 max-w-full">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Thống kê vi phạm lớp {selectClassObj?.class_name || activeClassId} từ Tuần {startNum} đến Tuần {endNum}
              </h3>
              <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card p-4 shadow-sm">
                <DataTable
                  columns={viphamColumns}
                  data={viphamStats}
                  searchPlaceholder="Tìm kiếm ghi chú..."
                  searchColumn="note"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

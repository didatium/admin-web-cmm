import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Calculator, Settings, FileSpreadsheet, Loader2, Award } from 'lucide-react';
import { toast } from 'sonner';

import {
  useClasses,
  useWeeks,
  useRules,
  useViphamByWeek,
  useSDBByWeek,
  useScoreByWeek,
  useCreateScore,
  useUpdateScore,
  TinhDiem2,
  calculateRankingNotes,
  getCurrentWeekId,
  clearScoreStale,
  isScoreStale,
} from 'cmm-shared';
import { useAuth } from '@/auth/AuthContext';

import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { BaseScoreDialog } from './BaseScoreDialog';
import { exportXbxhToExcel } from './exportExcelWeb';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type RankingRow = {
  rank: number;
  class_id: string;
  class_name: string;
  grade: number | null;
  base_score: number;
  deductions_bonuses: string;
  final_score: number;
  note: string;
  needs_recalculation: boolean;
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function XbxhPage() {
  const { user } = useAuth();
  const { data: classes, isLoading: loadingClasses } = useClasses();
  const { data: weeks, isLoading: loadingWeeks } = useWeeks();
  const { data: ruleList } = useRules();

  const classList = useMemo(() => (classes as any[]) ?? [], [classes]);
  const weekList = useMemo(() => (weeks as any[]) ?? [], [weeks]);

  // Initial week selection defaults to current week
  const defaultWeekId = useMemo(
    () => getCurrentWeekId(weekList, true),
    [weekList],
  );

  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [baseScoreDialogOpen, setBaseScoreDialogOpen] = useState(false);
  const [confirmCalculateDialogOpen, setConfirmCalculateDialogOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Active week ID
  const activeWeekId = selectedWeekId || defaultWeekId;

  // Active week object
  const activeWeekObj = useMemo(
    () => weekList.find((w: any) => String(w.week_id) === String(activeWeekId)),
    [weekList, activeWeekId],
  );

  // Query scores, violations, SDB for selected week
  const { data: scoreList, isLoading: loadingScores } = useScoreByWeek(activeWeekId);
  const { data: vpmList } = useViphamByWeek(activeWeekId);
  const { data: sdbList } = useSDBByWeek(activeWeekId);

  const createScore = useCreateScore();
  const updateScore = useUpdateScore();

  // Distinct grades for dropdown filter
  const grades = useMemo(() => {
    const set = new Set<string>();
    classList.forEach((c: any) => {
      if (c.grade != null) set.add(String(c.grade));
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [classList]);

  // Populate data3 (violations with rule objects)
  const data3 = useMemo(() => {
    if (!vpmList || !ruleList) return [];
    const dataTemp = JSON.parse(JSON.stringify(vpmList));
    dataTemp.forEach((item: any) => {
      if (item.bonus == null) {
        const vpmRule = (ruleList as any[]).find((r: any) => r.name_vp_id === item.name_vp_id);
        item.name_vp_id = vpmRule || item.name_vp_id;
      }
    });
    return dataTemp;
  }, [vpmList, ruleList]);

  // Build ranking rows
  const rankingRows = useMemo(() => {
    if (!classList.length) return [];

    // Filter by selected grade
    const filteredClasses = selectedGrade === 'all'
      ? classList
      : classList.filter((c: any) => String(c.grade) === selectedGrade);

    const scores = (scoreList as any[]) ?? [];

    const unranked: Omit<RankingRow, 'rank'>[] = filteredClasses.map((cls: any) => {
      const scoreRec = scores.find((s: any) => s.class_id === cls.class_id);
      const baseScore = scoreRec?.deft ?? 0;
      const finalScore = scoreRec?.score != null ? Number(Number(scoreRec.score).toFixed(2)) : 0;
      const note = scoreRec?.note ?? '';

      let deductionsBonuses = 'Không có vi phạm';
      if (note && note.trim()) {
        deductionsBonuses = note.trim();
      }

      return {
        class_id: cls.class_id,
        class_name: cls.class_name,
        grade: cls.grade,
        base_score: baseScore,
        deductions_bonuses: deductionsBonuses,
        final_score: finalScore,
        note: note,
        needs_recalculation: isScoreStale(String(cls.class_id), String(activeWeekId)),
      };
    });

    // Default sort by final score descending
    unranked.sort((a, b) => b.final_score - a.final_score);

    // Assign rank 1, 2, 3...
    return unranked.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [activeWeekId, classList, selectedGrade, scoreList]);

  // Handle Calculate Points
  const handleCalculatePoint = async () => {
    if (!activeWeekId) {
      toast.error('Vui lòng chọn tuần cần tính điểm');
      return;
    }

    try {
      setCalculating(true);
      const existingScores = (scoreList as any[]) ?? [];
      const scoreItems = TinhDiem2(data3, classList, user, activeWeekId, sdbList as any[]).map((item) => {
        const existingScore = existingScores.find((score: any) =>
          String(score.class_id) === String(item.class_id) && String(score.week_id) === String(item.week_id),
        );
        return { ...item, deft: existingScore?.deft ?? null };
      });
      await createScore.mutateAsync(scoreItems);

      const noteList = calculateRankingNotes(classList, data3, user, activeWeekObj || activeWeekId);
      await Promise.all(noteList.map(item => updateScore.mutateAsync(item)));
      clearScoreStale(scoreItems.map((item) => String(item.class_id)), activeWeekId);

      toast.success('Đã tính điểm thành công!');
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tính điểm, vui lòng thử lại');
    } finally {
      setCalculating(false);
    }
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    if (!scoreList || !(scoreList as any[]).length) {
      toast.error('Bạn phải thực hiện tính điểm trước khi xuất file Excel');
      return;
    }
    try {
      exportXbxhToExcel(
        scoreList as any[],
        vpmList as any[],
        ruleList as any[],
        sdbList as any[],
        classList,
        user,
        activeWeekObj,
      );
      toast.success('Đã xuất file Excel thành công');
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  // Table columns definition
  const columns: ColumnDef<RankingRow>[] = useMemo(
    () => [
      {
        accessorKey: 'rank',
        header: 'Thứ hạng',
        cell: ({ row }) => {
          const rank = row.original.rank;
          return (
            <div className="flex items-center gap-1.5 font-bold">
              {rank === 1 && <Award className="h-5 w-5 text-amber-500" />}
              {rank === 2 && <Award className="h-5 w-5 text-slate-400" />}
              {rank === 3 && <Award className="h-5 w-5 text-amber-700" />}
              <span>{rank}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'class_name',
        header: 'Lớp',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-semibold">{row.original.class_name}</span>
            {row.original.needs_recalculation && <Badge variant="warning">Cần tính lại</Badge>}
          </div>
        ),
      },
      {
        accessorKey: 'base_score',
        header: 'Điểm gốc',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.base_score}</Badge>
        ),
      },
      {
        accessorKey: 'deductions_bonuses',
        header: 'Vi phạm / Ghi chú',
        cell: ({ row }) => (
          <div className="max-w-md text-xs whitespace-pre-line text-muted-foreground">
            {row.original.deductions_bonuses}
          </div>
        ),
      },
      {
        accessorKey: 'final_score',
        header: 'Tổng điểm',
        cell: ({ row }) => (
          <span className="text-base font-bold text-primary">
            {row.original.final_score}
          </span>
        ),
      },
    ],
    [],
  );

  const isLoading = loadingClasses || loadingWeeks || loadingScores;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bảng xếp hạng</h1>
          <p className="text-sm text-muted-foreground">
            Xem và tính điểm thi đua xếp hạng các lớp theo tuần
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setBaseScoreDialogOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Thiết lập điểm gốc
          </Button>

          <Button
            onClick={() => setConfirmCalculateDialogOpen(true)}
            disabled={calculating || !activeWeekId}
          >
            {calculating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="mr-2 h-4 w-4" />
            )}
            Tính điểm
          </Button>

          <Button
            variant="secondary"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/40 p-4 rounded-lg border">
        {/* Week dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Tuần:</span>
          <Select
            value={activeWeekId}
            onValueChange={(val) => setSelectedWeekId(val)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Chọn tuần..." />
            </SelectTrigger>
            <SelectContent>
              {weekList.map((w: any) => (
                <SelectItem key={w.week_id} value={String(w.week_id)}>
                  {w.week_name || `Tuần ${String(w.week_id).replace('wk', '')}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grade filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Khối:</span>
          <Select
            value={selectedGrade}
            onValueChange={(val) => setSelectedGrade(val)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Chọn khối..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả các khối</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>
                  Khối {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DataTable */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rankingRows}
          searchPlaceholder="Tìm kiếm tên lớp..."
          searchColumn="class_name"
        />
      )}

      {/* Base Score Dialog */}
      <BaseScoreDialog
        open={baseScoreDialogOpen}
        onOpenChange={setBaseScoreDialogOpen}
        selectedWeekId={activeWeekId}
        weeks={weekList}
        classList={classList}
      />

      {/* Confirm Calculate Points AlertDialog */}
      <AlertDialog
        open={confirmCalculateDialogOpen}
        onOpenChange={setConfirmCalculateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận tính điểm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn tính điểm thi đua cho {activeWeekObj?.week_name || 'tuần này'} không? Hành động này sẽ tính lại điểm số và cập nhật ghi chú vi phạm cho tất cả các lớp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleCalculatePoint}>
              Chắc chắn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

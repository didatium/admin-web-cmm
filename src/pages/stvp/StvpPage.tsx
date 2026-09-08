import { useState, useMemo } from 'react';
import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import { Plus, BookOpen, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useClasses,
  useWeeks,
  useRules,
  useViphamByClassAndWeek,
  useDeleteVipham,
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

import { AddViolationDialog } from './AddViolationDialog';
import { AddAdhocViolationDialog } from './AddAdhocViolationDialog';
import { SDBDialog } from './SDBDialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type StudentEntry = { student_id: string | number; student_name: string };

type ViphamRow = {
  vpm_id: number;
  week_id?: string;
  class_id?: string;
  /** null → rule-based violation; non-null string → ad-hoc reason text */
  bonus?: string | null;
  /** For rule violations: number of students. For ad-hoc: the signed point value */
  quantity?: number | null;
  name_vp_id?: number | null;
  /** Array of students involved (only present for rule violations) */
  students?: StudentEntry[] | null;
  day?: number | null;
  create_by?: string | null;
  created_at?: string | null;
  modified_by?: string | null;
};

// Day label map  (mobile: day value = JS getDay(), 1=Mon…6=Sat)
const DAY_LABELS: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
};

// ---------------------------------------------------------------------------
// Helper — find current week by date
// ---------------------------------------------------------------------------
function findCurrentWeekId(weeks: any[]): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const current = weeks.find((w: any) => {
    const start = new Date(w.start_date);
    const end = new Date(w.end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  });
  return current ? String(current.week_id) : '';
}

// ---------------------------------------------------------------------------
// TableSkeleton
// ---------------------------------------------------------------------------
function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// StvpPage
// ---------------------------------------------------------------------------
export function StvpPage() {
  const { data: classes } = useClasses();
  const { data: weeks } = useWeeks();
  const { data: ruleList } = useRules();
  const { user } = useAuth();

  const classList = (classes as any[]) ?? [];
  const weekList = (weeks as any[]) ?? [];
  const rules = (ruleList as any[]) ?? [];

  // Initialise week to current week once data loads
  const defaultWeekId = useMemo(
    () => (weekList.length > 0 ? findCurrentWeekId(weekList) : ''),
    [weekList],
  );

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

  // Sync default week when weeks loads (only once)
  useMemo(() => {
    if (selectedWeek === '' && defaultWeekId) {
      setSelectedWeek(defaultWeekId);
    }
  }, [defaultWeekId]);

  const isReady = !!selectedClass && !!selectedWeek;

  const {
    data: viphamData,
    isLoading,
    isError,
    error,
    refetch,
  } = useViphamByClassAndWeek(isReady ? selectedClass : null, isReady ? selectedWeek : null);

  const deleteVipham = useDeleteVipham();

  // Dialog states
  const [showAddViolation, setShowAddViolation] = useState(false);
  const [showAddAdhoc, setShowAddAdhoc] = useState(false);
  const [showSDB, setShowSDB] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ViphamRow | null>(null);

  // Day filter (0 = all)
  const [dayFilter, setDayFilter] = useState<string>('all');

  // Enrich rows: for rule violations, attach rule name from ruleList (mirrors mobile index.js logic)
  const rows = useMemo(() => {
    const raw = (viphamData as ViphamRow[]) ?? [];
    const enriched = raw.map((item) => {
      if (item.bonus == null && item.name_vp_id != null) {
        const rule = rules.find((r: any) => r.name_vp_id === item.name_vp_id);
        return { ...item, _ruleName: rule?.name_vp ?? String(item.name_vp_id) };
      }
      return { ...item, _ruleName: null };
    });
    if (dayFilter === 'all') return enriched;
    return enriched.filter((r) => String(r.day) === dayFilter);
  }, [viphamData, rules, dayFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVipham.mutateAsync(deleteTarget.vpm_id);
      toast.success('Đã xoá bản ghi');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xoá thất bại');
    } finally {
      setDeleteTarget(null);
    }
  };

  /** True when the row is an ad-hoc bonus/penalty entry */
  const isAdHoc = (row: ViphamRow) => row.bonus != null;

  const columns: ColumnDef<ViphamRow & { _ruleName?: string | null }, unknown>[] = [
    {
      id: 'type',
      header: 'Loại',
      cell: ({ row }: CellContext<any, unknown>) => {
        const r = row.original;
        return isAdHoc(r) ? (
          <Badge variant="success">Điểm TT/Phạt</Badge>
        ) : (
          <Badge variant="destructive">Vi phạm</Badge>
        );
      },
    },
    {
      id: 'name',
      header: 'Tên vi phạm / Lý do',
      cell: ({ row }: CellContext<any, unknown>) => {
        const r = row.original;
        if (isAdHoc(r)) {
          // bonus = reason text
          return <span className="text-sm">{r.bonus ?? '—'}</span>;
        }
        // rule violation — show rule name
        return <span className="text-sm">{r._ruleName ?? '—'}</span>;
      },
    },
    {
      id: 'day',
      header: 'Ngày',
      cell: ({ row }: CellContext<any, unknown>) => {
        const r = row.original;
        return <span>{r.day != null ? DAY_LABELS[r.day] ?? `Thứ ${r.day}` : '—'}</span>;
      },
    },
    {
      id: 'qty_points',
      header: 'SL / Điểm',
      cell: ({ row }: CellContext<any, unknown>) => {
        const r = row.original;
        if (isAdHoc(r)) {
          // quantity = signed point value
          const pts = r.quantity ?? 0;
          return (
            <span
              className={
                pts >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
              }
            >
              {pts > 0 ? `+${pts}` : pts} điểm
            </span>
          );
        }
        // rule violation — quantity = number of students
        return <span>{r.quantity ?? '—'} học sinh</span>;
      },
    },
    {
      id: 'students',
      header: 'Học sinh vi phạm',
      cell: ({ row }: CellContext<any, unknown>) => {
        const r = row.original;
        // Only show student names for rule violations (bonus == null)
        if (!isAdHoc(r) && r.students && r.students.length > 0) {
          return (
            <span className="text-xs text-muted-foreground">
              {(r.students as StudentEntry[]).map((s) => s.student_name).join(', ')}
            </span>
          );
        }
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'create_by',
      header: 'Người tạo',
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }: CellContext<any, unknown>) => {
        const r = row.original as ViphamRow;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(r)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Xoá</span>
          </Button>
        );
      },
    },
  ];

  const selectedClassObj = classList.find((c: any) => String(c.class_id) === selectedClass);
  const selectedWeekObj = weekList.find((w: any) => String(w.week_id) === selectedWeek);
  const createdBy = (user as any)?.user_name ?? (user as any)?.name ?? 'admin';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sổ tay vi phạm</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý vi phạm, điểm thưởng/phạt và sổ đầu bài
          </p>
        </div>
        {isReady && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowSDB(true)}>
              <BookOpen className="mr-2 h-4 w-4" />
              Sổ đầu bài
            </Button>
            <Button variant="outline" onClick={() => setShowAddAdhoc(true)}>
              <Star className="mr-2 h-4 w-4" />
              Thêm điểm thưởng/phạt
            </Button>
            <Button onClick={() => setShowAddViolation(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm vi phạm
            </Button>
          </div>
        )}
      </div>

      {/* Selectors */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">Lớp:</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Chọn lớp..." />
            </SelectTrigger>
            <SelectContent>
              {classList.map((c: any) => (
                <SelectItem key={c.class_id} value={String(c.class_id)}>
                  {c.class_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">Tuần:</label>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Chọn tuần..." />
            </SelectTrigger>
            <SelectContent>
              {weekList.map((w: any) => (
                <SelectItem key={w.week_id} value={String(w.week_id)}>
                  {w.week_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isReady && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">Ngày:</label>
            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {DAY_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!isReady && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            Vui lòng chọn <strong>Lớp</strong> và <strong>Tuần</strong> để xem dữ liệu
          </p>
        </div>
      )}

      {/* Table */}
      {isReady && (
        <>
          {isLoading && <TableSkeleton />}

          {isError && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-semibold">Không thể tải dữ liệu</p>
              <p className="mt-1">{(error as Error)?.message ?? 'Lỗi không xác định'}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {selectedClassObj && selectedWeekObj && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">{selectedClassObj.class_name}</span> —{' '}
                  <span className="font-medium">{selectedWeekObj.week_name}</span>
                </p>
              )}
              <DataTable
                columns={columns}
                data={rows}
                searchPlaceholder="Tìm theo tên vi phạm / lý do..."
                searchColumn="name"
              />
            </>
          )}
        </>
      )}

      {/* Dialogs */}
      {isReady && (
        <>
          <AddViolationDialog
            open={showAddViolation}
            onClose={() => setShowAddViolation(false)}
            classId={selectedClass}
            weekId={selectedWeek}
            createdBy={createdBy}
          />
          <AddAdhocViolationDialog
            open={showAddAdhoc}
            onClose={() => setShowAddAdhoc(false)}
            classId={selectedClass}
            weekId={selectedWeek}
            createdBy={createdBy}
          />
          <SDBDialog
            open={showSDB}
            onClose={() => setShowSDB(false)}
            classId={selectedClass}
            weekId={selectedWeek}
            createdBy={createdBy}
          />
        </>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá bản ghi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá bản ghi này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVipham.isPending ? 'Đang xoá...' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

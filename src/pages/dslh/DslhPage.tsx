import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Trash2,
  KeyRound,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useClasses,
  useAllUsers,
  useResetPassword,
} from 'cmm-shared';

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

import { BulkCreateDialog } from './BulkCreateDialog';
import { SingleAccountDialog } from './SingleAccountDialog';
import { CascadeDeleteDialog, type DeleteTarget } from './CascadeDeleteDialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type MergedAccountRow = {
  user_id: string;
  user_name: string;
  role: string;
  class_id: string | null;
  class_name: string;
  grade: number | null;
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function DslhPage() {
  const { data: usersData, isLoading: loadingUsers } = useAllUsers();
  const { data: classesData, isLoading: loadingClasses } = useClasses();

  const usersList = useMemo(() => (usersData as any[]) ?? [], [usersData]);
  const classList = useMemo(() => (classesData as any[]) ?? [], [classesData]);

  // Grade filter selection
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Dialog States
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  const [singleCreateOpen, setSingleCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  // Password Reveal state
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});

  const resetPassword = useResetPassword();

  // Distinct grades for dropdown filter
  const grades = useMemo(() => {
    const set = new Set<string>();
    classList.forEach((c: any) => {
      if (c.grade != null) set.add(String(c.grade));
    });
    usersList.forEach((u: any) => {
      if (u.grade_scope != null) set.add(String(u.grade_scope));
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [classList, usersList]);

  // Merged data rows: combines class + matching account (or admin accounts)
  const mergedRows: MergedAccountRow[] = useMemo(() => {
    const rows: MergedAccountRow[] = [];
    const processedUserIds = new Set<string>();

    // 1. Process classes and their linked Sao Đỏ users
    classList.forEach((cls: any) => {
      // Business rule: one Sao Đỏ account is linked to each class; cascade
      // deletion deliberately removes this first matching account only.
      const matchedUser = usersList.find((u: any) => u.user_class === cls.class_id);
      if (matchedUser) {
        processedUserIds.add(matchedUser.user_id);
      }

      rows.push({
        user_id: matchedUser?.user_id || '',
        user_name: matchedUser?.user_name || 'Chưa gán',
        role: matchedUser?.role || 'sao_do',
        class_id: cls.class_id,
        class_name: cls.class_name,
        grade: cls.grade,
      });
    });

    // 2. Process admin users who don't have a user_class (e.g. Admin Khối, System Admin)
    usersList.forEach((u: any) => {
      if (!processedUserIds.has(u.user_id)) {
        rows.push({
          user_id: u.user_id,
          user_name: u.user_name,
          role: u.role || 'admin',
          class_id: null,
          class_name: '—',
          grade: u.grade_scope ?? null,
        });
      }
    });

    // Filter by selected grade
    return rows.filter((row) => {
      if (selectedGrade === 'all') return true;
      return String(row.grade) === selectedGrade;
    });
  }, [classList, usersList, selectedGrade]);

  // Password reset handler
  const handleResetPassword = (userId: string) => {
    if (!userId) return;
    resetPassword.mutate(userId, {
      onSuccess: (res: any) => {
        const pass = typeof res === 'string' ? res : (res?.data || res?.password || 'Đã đặt lại');
        setRevealedPasswords((prev) => ({ ...prev, [userId]: pass }));
        toast.success('Đặt lại mật khẩu thành công');
      },
      onError: () => {
        toast.error('Không thể đặt lại mật khẩu');
      },
    });
  };

  // Columns definition: username, permissions, class name, password (with reset button), delete operation
  const columns: ColumnDef<MergedAccountRow>[] = useMemo(
    () => [
      {
        accessorKey: 'user_name',
        header: 'Tài khoản',
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">{row.original.user_name}</span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Quyền',
        cell: ({ row }) => {
          const role = row.original.role;
          if (role === 'admin') return <Badge className="bg-purple-600">Admin System</Badge>;
          if (role === 'admin_khoi') return <Badge className="bg-blue-600">Admin Khối</Badge>;
          return <Badge variant="outline">Sao Đỏ</Badge>;
        },
      },
      {
        accessorKey: 'class_name',
        header: 'Tên lớp',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.class_name}</span>
        ),
      },
      {
        accessorKey: 'password',
        header: 'Mật khẩu',
        cell: ({ row }) => {
          const userId = row.original.user_id;
          const isRevealed = revealedPasswords[userId];
          if (!userId) return <span className="text-muted-foreground text-xs">—</span>;

          return isRevealed ? (
            <span className="font-mono font-bold text-primary px-2 py-1 bg-primary/10 rounded text-xs">
              {isRevealed}
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleResetPassword(userId)}
            >
              <KeyRound className="mr-1 h-3.5 w-3.5" />
              Đặt lại mật khẩu
            </Button>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            title="Xóa lớp & tài khoản"
            onClick={() =>
              setDeleteTarget({
                type: 'class',
                classId: row.original.class_id || '',
                className: row.original.class_name,
                userId: row.original.user_id || null,
              })
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [revealedPasswords],
  );

  const isLoading = loadingUsers || loadingClasses;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách lớp học</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý tài khoản Sao Đỏ và lớp học trong hệ thống
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setSingleCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo 1 tài khoản/lớp
          </Button>

          <Button onClick={() => setBulkCreateOpen(true)}>
            <Layers className="mr-2 h-4 w-4" />
            Tạo mới danh sách (Khối)
          </Button>

          <Button
            variant="destructive"
            onClick={() => setDeleteTarget({ type: 'all' })}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa toàn bộ danh sách
          </Button>
        </div>
      </div>

      {/* Grade Selector Filter Bar */}
      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Lọc theo Khối:</span>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Chọn khối" />
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

        <span className="text-xs text-muted-foreground font-medium">
          Tổng số: {mergedRows.length} mục
        </span>
      </div>

      {/* Single Merged Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={mergedRows}
          searchPlaceholder="Tìm kiếm tài khoản hoặc tên lớp..."
          searchColumn="class_name"
        />
      )}

      {/* Bulk Create Dialog */}
      <BulkCreateDialog
        open={bulkCreateOpen}
        onClose={() => setBulkCreateOpen(false)}
      />

      {/* Single Create Dialog */}
      <SingleAccountDialog
        open={singleCreateOpen}
        onClose={() => setSingleCreateOpen(false)}
      />

      {/* Cascade Delete Dialog */}
      <CascadeDeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

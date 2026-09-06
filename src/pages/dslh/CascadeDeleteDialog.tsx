import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  useDeleteClass,
  useDeleteAllClasses,
  useDeleteUser,
  useDeleteAllUsers,
  useDeleteScoreByClass,
  useDeleteAllScore,
  useDeleteLichtruc,
  useDeleteAllLichtruc,
  useDeleteViphamByClass,
  useDeleteAllVipham,
  useDeleteSDBByClass,
  useDeleteAllSDB,
} from 'cmm-shared';

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

export type DeleteTarget =
  | { type: 'class'; classId: string; className: string; userId?: string | null }
  | { type: 'all' }
  | null;

interface CascadeDeleteDialogProps {
  target: DeleteTarget;
  onClose: () => void;
}

export function CascadeDeleteDialog({ target, onClose }: CascadeDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const deleteClass = useDeleteClass();
  const deleteAllClasses = useDeleteAllClasses();
  const deleteUser = useDeleteUser();
  const deleteAllUsers = useDeleteAllUsers();

  const deleteScoreByClass = useDeleteScoreByClass();
  const deleteAllScore = useDeleteAllScore();

  const deleteLichtruc = useDeleteLichtruc();
  const deleteAllLichtruc = useDeleteAllLichtruc();

  const deleteViphamByClass = useDeleteViphamByClass();
  const deleteAllVipham = useDeleteAllVipham();

  const deleteSDBByClass = useDeleteSDBByClass();
  const deleteAllSDB = useDeleteAllSDB();

  if (!target) return null;

  const isDeleteAll = target.type === 'all';

  // Helper to safely execute a delete step without breaking if record doesn't exist (404)
  const safeDelete = async (fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (err: any) {
      console.warn('Cascade delete sub-step skipped:', err?.message || err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);

      if (isDeleteAll) {
        // Cascade delete ALL in exact sequence
        await safeDelete(() => deleteAllVipham.mutateAsync());
        await safeDelete(() => deleteAllScore.mutateAsync());
        await safeDelete(() => deleteAllLichtruc.mutateAsync());
        await safeDelete(() => deleteAllSDB.mutateAsync());
        await safeDelete(() => deleteAllUsers.mutateAsync());
        await safeDelete(() => deleteAllClasses.mutateAsync());

        toast.success('Đã xoá toàn bộ danh sách thành công!');
      } else {
        const { classId, userId, className } = target;

        // Cascade delete single class in exact sequence
        await safeDelete(() => deleteViphamByClass.mutateAsync(classId));
        await safeDelete(() => deleteScoreByClass.mutateAsync(classId));
        await safeDelete(() => deleteLichtruc.mutateAsync(classId));
        await safeDelete(() => deleteSDBByClass.mutateAsync(classId));

        if (userId) {
          await safeDelete(() => deleteUser.mutateAsync(userId));
        }

        // Deleting class record is mandatory
        await deleteClass.mutateAsync(classId);

        toast.success(`Đã xoá thành công lớp ${className} và dữ liệu liên quan!`);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xoá dữ liệu, vui lòng thử lại');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!target} onOpenChange={(o) => !o && !deleting && onClose()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {isDeleteAll ? 'Xác nhận xóa TOÀN BỘ danh sách?' : `Xác nhận xóa ${target.className}?`}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2 text-sm text-muted-foreground">
              <div>
                Thao tác này là <strong className="text-destructive">không thể hoàn tác</strong>. Tất cả dữ liệu thuộc chuỗi liên kết sau đây sẽ bị xoá vĩnh viễn:
              </div>

              <ol className="list-decimal list-inside space-y-1 bg-destructive/10 p-3 rounded-md text-destructive-foreground text-xs font-mono">
                <li>Lịch sử vi phạm (Violations)</li>
                <li>Điểm thi đua (Scores)</li>
                <li>Lịch trực thi đua (Duty schedules)</li>
                <li>Sổ đầu bài (SDB records)</li>
                <li>Tài khoản Sao Đỏ / Người dùng liên kết</li>
                <li>Hồ sơ Lớp học (Class entity)</li>
              </ol>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Hủy bỏ</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleteAll ? 'Xóa toàn bộ vĩnh viễn' : 'Xóa lớp & dữ liệu liên quan'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

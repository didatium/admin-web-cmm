import { AlertCircle, Download, FileText } from 'lucide-react';
import { FormatDate } from 'cmm-shared';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { exportStudentViphamExcel } from './exportStudentViphamExcel';

type StudentRow = {
  student_id: number;
  student_name: string;
  class_id: string;
  gioi_tinh?: string;
  ngay_sinh?: string;
};

type ClassRow = {
  class_id: string;
  class_name: string;
};

export function StudentViolationsModal({
  open,
  student,
  targetClass,
  viphamList = [],
  onClose,
}: {
  open: boolean;
  student: StudentRow | null;
  targetClass?: ClassRow;
  viphamList: any[];
  onClose: () => void;
}) {
  if (!student) return null;

  // Filter violations where student is present in vpm.students
  const studentViolations = viphamList.filter((vpm) =>
    (vpm.students ?? []).some((s: any) => s.student_id === student.student_id)
  );

  const handleExport = () => {
    exportStudentViphamExcel(student, targetClass, studentViolations);
  };

  const formattedDob = student.ngay_sinh
    ? new Date(student.ngay_sinh).toLocaleDateString('vi-VN')
    : '—';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Lịch Sử Vi Phạm: {student.student_name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground pt-1">
              <span>
                Lớp: <strong className="text-foreground">{targetClass?.class_name || student.class_id}</strong>
              </span>
              <span>•</span>
              <span>
                Giới tính: <strong className="text-foreground">{student.gioi_tinh || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                Ngày sinh: <strong className="text-foreground">{formattedDob}</strong>
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 flex-1 overflow-hidden flex flex-col space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-semibold">Danh sách vi phạm chi tiết</span>
            <Badge variant={studentViolations.length > 0 ? 'destructive' : 'secondary'} className="px-2.5 py-0.5">
              {studentViolations.length} lượt vi phạm
            </Badge>
          </div>

          <div className="border rounded-md flex-1 overflow-hidden">
            <div className="h-[300px] overflow-y-auto">
              {studentViolations.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <p>Học sinh chưa ghi nhận vi phạm nào.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-[50px]">STT</TableHead>
                      <TableHead className="w-[100px]">Tuần</TableHead>
                      <TableHead className="w-[140px]">Ngày ghi nhận</TableHead>
                      <TableHead>Nội dung vi phạm / Điểm cộng trừ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentViolations.map((vpm, index) => {
                      const weekLabel = vpm.week_id
                        ? `Tuần ${String(vpm.week_id).replace(/\D/g, '')}`
                        : '—';
                      const dateStr = vpm.create_at || vpm.created_at
                        ? FormatDate(vpm.create_at || vpm.created_at)
                        : '—';
                      const content = vpm.name_vp || vpm.bonus || 'Vi phạm';

                      return (
                        <TableRow key={vpm.vpm_id || index}>
                          <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                          <TableCell className="font-medium text-xs">{weekLabel}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{dateStr}</TableCell>
                          <TableCell className="text-sm font-medium">{content}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={studentViolations.length === 0}
            className="gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <Download className="h-4 w-4" />
            Xuất Excel
          </Button>

          <Button type="button" variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

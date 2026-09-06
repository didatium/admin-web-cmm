import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreateClass, useCreateUser } from 'cmm-shared';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { makeClass, makeUser } from './dslhHelpers';

interface BulkCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BulkCreateDialog({ open, onClose }: BulkCreateDialogProps) {
  const [k10, setK10] = useState<number>(0);
  const [k11, setK11] = useState<number>(0);
  const [k12, setK12] = useState<number>(0);

  const [lst10, setLst10] = useState<Record<number, string>>({});
  const [lst11, setLst11] = useState<Record<number, string>>({});
  const [lst12, setLst12] = useState<Record<number, string>>({});

  const [submitting, setSubmitting] = useState(false);

  const createClass = useCreateClass();
  const createUser = useCreateUser();

  const handleReset = () => {
    setK10(0);
    setK11(0);
    setK12(0);
    setLst10({});
    setLst11({});
    setLst12({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleCreate = async () => {
    const names10 = Object.values(lst10).filter(Boolean);
    const names11 = Object.values(lst11).filter(Boolean);
    const names12 = Object.values(lst12).filter(Boolean);

    const allNames = [...names10, ...names11, ...names12];
    if (allNames.length === 0) {
      toast.error('Vui lòng nhập ít nhất một tên lớp');
      return;
    }

    try {
      setSubmitting(true);

      const rawClasses = [
        ...makeClass(names10),
        ...makeClass(names11),
        ...makeClass(names12),
      ];

      const newUsers = [
        ...makeUser(names10),
        ...makeUser(names11),
        ...makeUser(names12),
      ];

      // Remove duplicate classes by class_name
      const uniqueClasses = rawClasses.filter(
        (item, index, self) => index === self.findIndex((c) => c.class_name === item.class_name),
      );

      const classResults = await Promise.allSettled(
        uniqueClasses.map((c) => createClass.mutateAsync(c)),
      );
      const failedClasses = classResults.filter((r) => r.status === 'rejected');

      const userResults = await Promise.allSettled(
        newUsers.map((u) => createUser.mutateAsync(u)),
      );
      const failedUsers = userResults.filter((r) => r.status === 'rejected');

      handleClose();

      if (failedClasses.length > 0 || failedUsers.length > 0) {
        toast.warning(
          `Đã xử lý xong. Lỗi: ${failedClasses.length} lớp và ${failedUsers.length} tài khoản không thể tạo (có thể do đã tồn tại).`,
        );
      } else {
        toast.success(`Tạo mới thành công ${uniqueClasses.length} lớp và ${newUsers.length} tài khoản!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi không xác định xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo danh sách lớp học theo khối</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Quantity selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/40 p-4 rounded-lg border">
            <div>
              <label className="text-sm font-medium">Số lớp Khối 10</label>
              <Input
                type="number"
                min={0}
                max={20}
                value={k10}
                onChange={(e) => setK10(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Số lớp Khối 11</label>
              <Input
                type="number"
                min={0}
                max={20}
                value={k11}
                onChange={(e) => setK11(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Số lớp Khối 12</label>
              <Input
                type="number"
                min={0}
                max={20}
                value={k12}
                onChange={(e) => setK12(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="mt-1"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Nhập tên lớp vào các ô dưới đây (ví dụ: 10A1, 10A2, 11A1...). Hệ thống sẽ tự tạo tên lớp và tài khoản Sao Đỏ tương ứng.
          </p>

          {/* Inputs for Grade 10 */}
          {k10 > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary">Khối 10 ({k10} lớp)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: k10 }, (_, i) => (
                  <Input
                    key={`k10-${i}`}
                    placeholder={`VD: 10A${i + 1}`}
                    value={lst10[i] || ''}
                    onChange={(e) => setLst10((prev) => ({ ...prev, [i]: e.target.value }))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inputs for Grade 11 */}
          {k11 > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary">Khối 11 ({k11} lớp)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: k11 }, (_, i) => (
                  <Input
                    key={`k11-${i}`}
                    placeholder={`VD: 11A${i + 1}`}
                    value={lst11[i] || ''}
                    onChange={(e) => setLst11((prev) => ({ ...prev, [i]: e.target.value }))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inputs for Grade 12 */}
          {k12 > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary">Khối 12 ({k12} lớp)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: k12 }, (_, i) => (
                  <Input
                    key={`k12-${i}`}
                    placeholder={`VD: 12A${i + 1}`}
                    value={lst12[i] || ''}
                    onChange={(e) => setLst12((prev) => ({ ...prev, [i]: e.target.value }))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo mới
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

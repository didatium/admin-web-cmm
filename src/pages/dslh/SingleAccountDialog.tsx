import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreateClass, useCreateUser, useClasses } from '@/shared';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { makeAdmin, makeClass, makeUser } from './dslhHelpers';

interface SingleAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SingleAccountDialog({ open, onClose }: SingleAccountDialogProps) {
  const [accountType, setAccountType] = useState<'admin' | 'sao_do'>('sao_do');
  const [grade, setGrade] = useState<string>('10');
  const [classNameInput, setClassNameInput] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const { data: classList } = useClasses();
  const createClass = useCreateClass();
  const createUser = useCreateUser();

  const handleReset = () => {
    setAccountType('sao_do');
    setGrade('10');
    setClassNameInput('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (accountType === 'admin') {
        const adminData = makeAdmin(grade);
        await createUser.mutateAsync(adminData);
        toast.success(`Đã tạo tài khoản Admin Khối ${grade} thành công!`);
        handleClose();
      } else {
        const cleanName = classNameInput.trim();
        if (!cleanName) {
          toast.error('Vui lòng nhập tên lớp');
          return;
        }

        const targetClassId = 'cls' + cleanName.replace(/^(lớp|lop|class|cls)\s*/i, '').trim();

        // Check if class already exists
        const exists = (classList as any[])?.find((c: any) => c.class_id === targetClassId);
        if (exists) {
          toast.error(`Lớp ${cleanName} đã tồn tại trong hệ thống!`);
          return;
        }

        const newClass = makeClass([cleanName])[0];
        const newUser = makeUser([cleanName])[0];

        await createClass.mutateAsync(newClass);
        await createUser.mutateAsync(newUser);

        toast.success(`Đã tạo thành công lớp ${newClass.class_name} và tài khoản Sao Đỏ ${newUser.user_name}!`);
        handleClose();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể tạo tài khoản, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo 1 tài khoản / lớp học</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Account Type Selector */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Loại tài khoản</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  value="sao_do"
                  checked={accountType === 'sao_do'}
                  onChange={() => setAccountType('sao_do')}
                  className="h-4 w-4 text-primary"
                />
                <span>Sao Đỏ / Lớp mới</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  value="admin"
                  checked={accountType === 'admin'}
                  onChange={() => setAccountType('admin')}
                  className="h-4 w-4 text-primary"
                />
                <span>Admin Khối</span>
              </label>
            </div>
          </div>

          {accountType === 'admin' ? (
            <div className="space-y-1">
              <label className="text-sm font-medium">Chọn khối quản lý</label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khối" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Khối 10</SelectItem>
                  <SelectItem value="11">Khối 11</SelectItem>
                  <SelectItem value="12">Khối 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-sm font-medium">Tên lớp mới</label>
              <Input
                placeholder="VD: 10A1"
                value={classNameInput}
                onChange={(e) => setClassNameInput(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

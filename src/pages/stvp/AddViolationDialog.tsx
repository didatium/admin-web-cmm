import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRules, useCreateVipham, useStudentsByClass } from 'cmm-shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DAY_OPTIONS = [
  { value: '0', label: 'Chủ nhật' },
  { value: '1', label: 'Thứ 2' },
  { value: '2', label: 'Thứ 3' },
  { value: '3', label: 'Thứ 4' },
  { value: '4', label: 'Thứ 5' },
  { value: '5', label: 'Thứ 6' },
  { value: '6', label: 'Thứ 7' },
];

const schema = z.object({
  name_vp_id: z.string().min(1, 'Vui lòng chọn vi phạm'),
  day: z.string().min(1, 'Vui lòng chọn ngày'),
  quantity: z
    .string()
    .min(1, 'Số lượng là bắt buộc')
    .regex(/^\d+$/, 'Phải là số nguyên dương'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  classId: string;
  weekId: string;
  createdBy: string;
  onSaved?: () => void;
}

export function AddViolationDialog({ open, onClose, classId, weekId, createdBy, onSaved }: Props) {
  const { data: rules } = useRules();
  const { data: students } = useStudentsByClass(classId);
  const createVipham = useCreateVipham();

  // Multi-select for students (optional)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name_vp_id: '', day: '', quantity: '1' },
  });

  const handleClose = () => {
    form.reset();
    setSelectedStudents([]);
    onClose();
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      await createVipham.mutateAsync({
        week_id: weekId,
        class_id: classId,
        name_vp_id: parseInt(values.name_vp_id, 10),
        quantity: parseInt(values.quantity, 10),
        day: parseInt(values.day, 10),
        student_ids: selectedStudents.length > 0 ? selectedStudents : [],
        create_by: createdBy,
      });
      onSaved?.();
      toast.success('Thêm vi phạm thành công');
      handleClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((s) => s !== studentId) : [...prev, studentId],
    );
  };

  const ruleList = (rules as any[]) ?? [];
  const studentList = (students as any[]) ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm vi phạm</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Rule selector */}
            <FormField
              control={form.control}
              name="name_vp_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vi phạm</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vi phạm..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ruleList.map((r: any) => (
                        <SelectItem key={r.name_vp_id} value={String(r.name_vp_id)}>
                          {r.name_vp} ({r.minus_pnt} điểm)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Day selector */}
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngày..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DAY_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số học sinh vi phạm</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional student multi-select */}
            {studentList.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Học sinh cụ thể (tuỳ chọn)</p>
                <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">
                  {studentList.map((s: any) => {
                    const sid = String(s.student_id);
                    const checked = selectedStudents.includes(sid);
                    return (
                      <label
                        key={sid}
                        className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStudent(sid)}
                          className="accent-primary"
                        />
                        {s.student_name}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Huỷ
              </Button>
              <Button type="submit" disabled={createVipham.isPending}>
                {createVipham.isPending ? 'Đang lưu...' : 'Thêm'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

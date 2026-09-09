import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateVipham } from 'cmm-shared';
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
  day: z.string().min(1, 'Vui lòng chọn ngày'),
  // bonus = reason text (mirrors mobile: bonus: title)
  bonus: z.string().min(1, 'Lý do là bắt buộc').max(200, 'Tối đa 200 ký tự'),
  // quantity = the actual point value (mirrors mobile: quantity: score)
  quantity: z
    .string()
    .min(1, 'Điểm là bắt buộc')
    .regex(/^-?\d+$/, 'Phải là số nguyên'),
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

export function AddAdhocViolationDialog({ open, onClose, classId, weekId, createdBy, onSaved }: Props) {
  const createVipham = useCreateVipham();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { day: '', bonus: '', quantity: '' },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      // Matches mobile HandleBonus payload exactly:
      // { bonus: title, quantity: score, create_by, week_id, class_id, day }
      await createVipham.mutateAsync({
        week_id: weekId,
        class_id: classId,
        day: parseInt(values.day, 10),
        bonus: values.bonus,
        quantity: parseInt(values.quantity, 10),
        create_by: createdBy,
      });
      onSaved?.();
      toast.success('Thêm điểm thưởng/phạt thành công');
      handleClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm điểm thưởng / phạt</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Day selector */}
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày vi phạm</FormLabel>
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

            {/* Reason (bonus field) */}
            <FormField
              control={form.control}
              name="bonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lí do</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập lý do thưởng/phạt..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Points (quantity field — allow negative for penalty) */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm cộng/trừ (âm = phạt, dương = thưởng)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 5 hoặc -3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

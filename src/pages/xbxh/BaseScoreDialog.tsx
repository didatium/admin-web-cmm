import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useUpdateScore } from '@/shared';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const baseScoreSchema = z.object({
  inik10: z.string().min(1, 'Điểm gốc phải >= 0').regex(/^\d+$/, 'Phải là số nguyên dương'),
  inik11: z.string().min(1, 'Điểm gốc phải >= 0').regex(/^\d+$/, 'Phải là số nguyên dương'),
  inik12: z.string().min(1, 'Điểm gốc phải >= 0').regex(/^\d+$/, 'Phải là số nguyên dương'),
  scope: z.enum(['all', 'once']),
});

type BaseScoreFormValues = z.infer<typeof baseScoreSchema>;

interface BaseScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedWeekId: string;
  weeks: any[];
  classList: any[];
}

export function BaseScoreDialog({
  open,
  onOpenChange,
  selectedWeekId,
  weeks,
  classList,
}: BaseScoreDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const updateScore = useUpdateScore();

  const form = useForm<BaseScoreFormValues>({
    resolver: zodResolver(baseScoreSchema),
    defaultValues: {
      inik10: '0',
      inik11: '0',
      inik12: '0',
      scope: 'all',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        inik10: '0',
        inik11: '0',
        inik12: '0',
        scope: 'all',
      });
    }
  }, [open, form]);

  const getScoreByGrade = (grade: number | string | null | undefined, values: BaseScoreFormValues) => {
    const gStr = String(grade ?? '');
    const num10 = parseInt(values.inik10, 10) || 0;
    const num11 = parseInt(values.inik11, 10) || 0;
    const num12 = parseInt(values.inik12, 10) || 0;

    if (gStr.includes('10')) return num10;
    if (gStr.includes('11')) return num11;
    if (gStr.includes('12')) return num12;
    return num10;
  };

  const onSubmit = async (values: BaseScoreFormValues) => {
    try {
      setSubmitting(true);

      const targetWeeks = values.scope === 'all'
        ? weeks.filter((w: any) => String(w.week_id) >= String(selectedWeekId))
        : weeks.filter((w: any) => String(w.week_id) === String(selectedWeekId));

      const defItems: { week_id: string; class_id: string; deft: number }[] = [];

      targetWeeks.forEach((w: any) => {
        classList.forEach((c: any) => {
          const deftVal = getScoreByGrade(c.grade || c.class_id, values);
          defItems.push({
            week_id: String(w.week_id),
            class_id: String(c.class_id),
            deft: deftVal,
          });
        });
      });

      await Promise.all(defItems.map(item => updateScore.mutateAsync(item)));

      toast.success('Thiết lập điểm gốc thành công');
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi khi thiết lập điểm gốc, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thiết lập điểm gốc</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inik10"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm gốc khối 10</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inik11"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm gốc khối 11</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inik12"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm gốc khối 12</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Phạm vi áp dụng</FormLabel>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        value="all"
                        checked={field.value === 'all'}
                        onChange={() => field.onChange('all')}
                        className="h-4 w-4 text-primary"
                      />
                      <span>Áp dụng cho tất cả các tuần (từ tuần này trở đi)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        value="once"
                        checked={field.value === 'once'}
                        onChange={() => field.onChange('once')}
                        className="h-4 w-4 text-primary"
                      />
                      <span>Chỉ áp dụng cho tuần hiện tại</span>
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hoàn thành
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSDBByClassAndWeek, useCreateSDB, useUpdateSDB } from 'cmm-shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Mirrors the mobile DEFAULT_SDB structure: array of { day, Tiet1..Tiet5 }
const DEFAULT_SDB = [
  { day: '1', Tiet1: '0', Tiet2: '0', Tiet3: '0', Tiet4: '0', Tiet5: '0' },
  { day: '2', Tiet1: '0', Tiet2: '0', Tiet3: '0', Tiet4: '0', Tiet5: '0' },
  { day: '3', Tiet1: '0', Tiet2: '0', Tiet3: '0', Tiet4: '0', Tiet5: '0' },
  { day: '4', Tiet1: '0', Tiet2: '0', Tiet3: '0', Tiet4: '0', Tiet5: '0' },
  { day: '5', Tiet1: '0', Tiet2: '0', Tiet3: '0', Tiet4: '0', Tiet5: '0' },
  { day: '6', Tiet1: '0', Tiet2: '0', Tiet3: '0', Tiet4: '0', Tiet5: '0' },
];

const DAY_LABELS: Record<string, string> = {
  '0': 'Chủ nhật',
  '1': 'Thứ 2',
  '2': 'Thứ 3',
  '3': 'Thứ 4',
  '4': 'Thứ 5',
  '5': 'Thứ 6',
  '6': 'Thứ 7',
};

const PERIOD_KEYS = ['Tiet1', 'Tiet2', 'Tiet3', 'Tiet4', 'Tiet5'] as const;

type SDBRow = {
  day: string;
  Tiet1: string;
  Tiet2: string;
  Tiet3: string;
  Tiet4: string;
  Tiet5: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  classId: string;
  weekId: string;
  createdBy: string;
  onSaved?: () => void;
}

export function SDBDialog({ open, onClose, classId, weekId, createdBy, onSaved }: Props) {
  const { data: existing, isLoading } = useSDBByClassAndWeek(classId, weekId);
  const createSDB = useCreateSDB();
  const updateSDB = useUpdateSDB();

  const [localSDBList, setLocalSDBList] = useState<SDBRow[]>(DEFAULT_SDB);
  // "Số tiết" = total lessons per week (validated > 0 before saving)
  const [localSotiet, setLocalSotiet] = useState(0);

  // Populate from existing record whenever dialog opens or data arrives
  useEffect(() => {
    if (!open) return;
    if (existing && (existing as any).record_id) {
      const rec = existing as any;
      try {
        const parsed =
          typeof rec.periods_data === 'string'
            ? JSON.parse(rec.periods_data)
            : rec.periods_data;
        setLocalSDBList(Array.isArray(parsed) ? parsed : DEFAULT_SDB);
      } catch {
        setLocalSDBList(DEFAULT_SDB);
      }
      setLocalSotiet(rec.quantity ?? 0);
    } else {
      setLocalSDBList(DEFAULT_SDB);
      setLocalSotiet(0);
    }
  }, [open, existing]);

  const handleCellChange = (key: string, value: string, idx: number) => {
    // Strip non-numeric characters (mirrors mobile .replace(/\s+|,|-|[.]/g, ''))
    const cleaned = value.replace(/[^0-9]/g, '');
    setLocalSDBList((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: cleaned } : row)),
    );
  };

  const handleSave = async () => {
    if (localSotiet === 0) {
      toast.error('Bạn chưa nhập số tiết');
      return;
    }
    try {
      const payload = {
        week_id: weekId,
        class_id: classId,
        periods_data: JSON.stringify(localSDBList),
        quantity: localSotiet,
        create_by: createdBy,
      };

      const rec = existing as any;
      if (rec?.record_id) {
        await updateSDB.mutateAsync({ record_id: rec.record_id, sdb_data: payload });
        toast.success('Cập nhật sổ đầu bài thành công');
      } else {
        await createSDB.mutateAsync(payload);
        toast.success('Lưu sổ đầu bài thành công');
      }
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  };

  const isSaving = createSDB.isPending || updateSDB.isPending;
  const isExisting = !!(existing as any)?.record_id;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sổ đầu bài</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Đang tải...</div>
        ) : (
          <div className="space-y-4">
            {/* Period grid — columns: Thứ | Tiết 1–5 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border px-3 py-2 text-center font-semibold w-16">Thứ</th>
                    {PERIOD_KEYS.map((k) => (
                      <th
                        key={k}
                        className="border px-3 py-2 text-center font-semibold min-w-[72px]"
                      >
                        Tiết {k.replace('Tiet', '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localSDBList.map((row, idx) => (
                    <tr key={row.day} className="hover:bg-muted/30">
                      <td className="border px-3 py-2 text-center font-medium">
                        {DAY_LABELS[row.day] ?? `Thứ ${row.day}`}
                      </td>
                      {PERIOD_KEYS.map((k) => (
                        <td key={k} className="border px-1 py-1 text-center">
                          <Input
                            type="number"
                            min={0}
                            value={row[k]}
                            onChange={(e) => handleCellChange(k, e.target.value, idx)}
                            className="h-8 w-14 mx-auto text-center p-1"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Số tiết per week */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium whitespace-nowrap">Số tiết (cả tuần):</label>
              <Input
                type="number"
                min={0}
                value={localSotiet}
                onChange={(e) => setLocalSotiet(parseInt(e.target.value, 10) || 0)}
                className="w-24 text-center"
              />
              {localSotiet === 0 && (
                <span className="text-xs text-destructive">Phải nhập số tiết lớn hơn 0</span>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? 'Đang lưu...' : isExisting ? 'Cập nhật' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo } from 'react';
import { FileSpreadsheet, Save, Trash2, Upload, CheckCircle2, XCircle, AlertTriangle, CalendarRange } from 'lucide-react';
import { toast } from 'sonner';
import XLSX from 'xlsx-js-style';

import {
  useWeeks,
  useClasses,
  useLichtrucByWeek,
  useSaveLichtruc,
  useDeleteAllLichtruc,
} from 'cmm-shared';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

// ---------------------------------------------------------------------------
// Helper — find current week
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
  return current ? String(current.week_id) : (weeks[0] ? String(weeks[0].week_id) : '');
}

// ---------------------------------------------------------------------------
// Helper — class_id normalization (same as mobile: 'cls' + shortName)
// ---------------------------------------------------------------------------
function toClassId(raw: string): string {
  const cleaned = String(raw).trim().replace(/^Lớp\s*/i, '').replace(/^cls/i, '').replace(/\s+/g, '');
  return 'cls' + cleaned;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
type AssignmentRow = {
  class_active: string; // class being served
  class_passive: string; // duty class
};

type ValidationError = {
  class_active?: string;
  global?: string;
};

function validateAssignments(rows: AssignmentRow[]): ValidationError[] {
  const errors: ValidationError[] = rows.map(() => ({}));
  const passiveCount: Record<string, number> = {};

  // Rule 1: self-duty — class_active === class_passive
  rows.forEach((row, i) => {
    if (row.class_passive && row.class_active === row.class_passive) {
      errors[i].class_active = `Lớp trực không thể trùng với lớp bị trực (${row.class_active.slice(3)})`;
    }
    if (row.class_passive) {
      passiveCount[row.class_passive] = (passiveCount[row.class_passive] ?? 0) + 1;
    }
  });

  // Rule 2: duplicate passive — same class_passive assigned more than once in week
  rows.forEach((row, i) => {
    if (row.class_passive && passiveCount[row.class_passive] > 1) {
      errors[i].class_active = errors[i].class_active
        ? errors[i].class_active + '; '
        : '' + `Lớp trực "${row.class_passive.slice(3)}" đã được phân công cho nhiều lớp`;
    }
  });

  return errors;
}

// ---------------------------------------------------------------------------
// Excel Import Dialog
// ---------------------------------------------------------------------------
type ExcelImportRow = {
  class_active: string;
  class_passive: string;
};

type ExcelImportResult = {
  rowIndex: number;
  rawActive: string;
  rawPassive: string;
  class_active: string;
  class_passive: string;
  isValid: boolean;
  errorMessage?: string;
};

function ImportExcelDialog({
  open,
  classList,
  onClose,
  onImport,
}: {
  open: boolean;
  classList: any[];
  onClose: () => void;
  onImport: (rows: ExcelImportRow[]) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ExcelImportResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const validClassIds = useMemo(() => new Set(classList.map((c: any) => c.class_id)), [classList]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    parseFile(f);
  };

  const parseFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        const results: ExcelImportResult[] = rawData.map((row, idx) => {
          const rawActive = String(row['Lớp'] ?? '').trim();
          const rawPassive = String(row['Lớp trực'] ?? '').trim();

          // Strip "Lớp" prefix and prepend "cls" — matching mobile logic exactly
          const class_active = toClassId(rawActive);
          const class_passive = toClassId(rawPassive);

          let isValid = true;
          let errorMessage = '';
          if (!rawActive) { isValid = false; errorMessage = 'Thiếu cột "Lớp"'; }
          else if (!rawPassive) { isValid = false; errorMessage = 'Thiếu cột "Lớp trực"'; }
          else if (!validClassIds.has(class_active)) { isValid = false; errorMessage = `Không tìm thấy lớp "${rawActive}"`; }
          else if (!validClassIds.has(class_passive)) { isValid = false; errorMessage = `Không tìm thấy lớp trực "${rawPassive}"`; }
          else if (class_active === class_passive) { isValid = false; errorMessage = 'Lớp trực trùng với lớp bị trực'; }

          return { rowIndex: idx + 2, rawActive, rawPassive, class_active, class_passive, isValid, errorMessage };
        });

        setParsedRows(results);
      } catch {
        toast.error('Không thể đọc file Excel. Kiểm tra lại định dạng!');
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleConfirm = async () => {
    if (validRows.length === 0) { toast.error('Không có dữ liệu hợp lệ'); return; }
    setIsProcessing(true);
    try {
      await onImport(validRows.map((r) => ({ class_active: r.class_active, class_passive: r.class_passive })));
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedRows([]);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Import Lịch Trực Từ Excel
          </DialogTitle>
          <DialogDescription>
            Tải lên file Excel với các cột: <strong>Lớp</strong>, <strong>Lớp trực</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/30 justify-center">
            <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} id="lt-excel-input" className="hidden" />
            <label htmlFor="lt-excel-input" className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline">
              <Upload className="h-4 w-4" />
              {file ? file.name : 'Chọn file Excel...'}
            </label>
          </div>

          {parsedRows.length > 0 && (
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline">Tổng: {parsedRows.length}</Badge>
                <Badge className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Hợp lệ: {validRows.length}</Badge>
                {invalidRows.length > 0 && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Lỗi: {invalidRows.length}</Badge>}
              </div>
              {invalidRows.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-800 flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  Có {invalidRows.length} dòng lỗi sẽ bỏ qua. Các dòng hợp lệ vẫn được nhập.
                </div>
              )}
              <div className="border rounded-md flex-1 overflow-hidden">
                <div className="h-[220px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="w-[50px]">Dòng</TableHead>
                        <TableHead>Lớp</TableHead>
                        <TableHead>Lớp trực</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row) => (
                        <TableRow key={row.rowIndex} className={!row.isValid ? 'bg-destructive/5' : ''}>
                          <TableCell className="font-mono text-xs">{row.rowIndex}</TableCell>
                          <TableCell>{row.rawActive || '—'}</TableCell>
                          <TableCell>{row.rawPassive || '—'}</TableCell>
                          <TableCell>
                            {row.isValid
                              ? <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-xs">Sẵn sàng</Badge>
                              : <Badge variant="destructive" className="text-xs">{row.errorMessage}</Badge>
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>Hủy</Button>
          <Button onClick={handleConfirm} disabled={validRows.length === 0 || isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isProcessing ? 'Đang lưu...' : `Nhập ${validRows.length} dòng`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export function SxltPage() {
  const { data: weeks, isLoading: loadingWeeks } = useWeeks();
  const { data: classes, isLoading: loadingClasses } = useClasses();

  const weekList = useMemo(() => (weeks as any[]) ?? [], [weeks]);
  const classList = useMemo(() => (classes as any[]) ?? [], [classes]);

  const defaultWeekId = useMemo(
    () => (weekList.length > 0 ? findCurrentWeekId(weekList) : ''),
    [weekList],
  );

  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('10');
  const [showImport, setShowImport] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeWeekId = selectedWeekId || defaultWeekId;

  const { data: ltData, isLoading: loadingLt } = useLichtrucByWeek(activeWeekId);
  const saveLichtruc = useSaveLichtruc();
  const deleteAllLichtruc = useDeleteAllLichtruc();

  // ltList: all assignments for this week
  const ltList: any[] = useMemo(() => (ltData as any[]) ?? [], [ltData]);

  // Distinct grades from classes
  const grades = useMemo(() => {
    const set = new Set<string>();
    classList.forEach((c: any) => { if (c.grade != null) set.add(String(c.grade)); });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [classList]);

  // Classes in selected grade
  const gradeClasses = useMemo(
    () => classList.filter((c: any) => String(c.grade) === String(selectedGrade)),
    [classList, selectedGrade],
  );

  // Build editable assignment state: { [class_active_id]: class_passive_id | '' }
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  // When ltList or grade changes, re-seed assignments from server data
  useMemo(() => {
    const seed: Record<string, string> = {};
    gradeClasses.forEach((c: any) => {
      const existing = ltList.find((lt: any) => lt.class_active === c.class_id);
      seed[c.class_id] = existing ? existing.class_passive : '';
    });
    setAssignments(seed);
  }, [ltList, gradeClasses]);

  // Rows for current grade
  const rows: AssignmentRow[] = gradeClasses.map((c: any) => ({
    class_active: c.class_id,
    class_passive: assignments[c.class_id] ?? '',
  }));

  const errors = useMemo(() => validateAssignments(rows), [rows]);
  const hasErrors = errors.some((e) => e.class_active);
  const filledCount = rows.filter((r) => r.class_passive).length;

  // All passive classes already picked in this grade (for disabling in selects)
  const usedPassiveInGrade = useMemo(() => {
    const used = new Set<string>();
    rows.forEach((r) => { if (r.class_passive) used.add(r.class_passive); });
    return used;
  }, [rows]);

  const handleChange = (classActiveId: string, newPassiveId: string) => {
    setAssignments((prev) => ({ ...prev, [classActiveId]: newPassiveId }));
  };

  const handleSave = async () => {
    if (hasErrors) {
      toast.error('Vui lòng sửa các lỗi trước khi lưu');
      return;
    }

    const filledRows = rows.filter((r) => r.class_passive);
    if (filledRows.length === 0) {
      toast.error('Chưa có lịch trực nào được phân công');
      return;
    }

    const payload = filledRows.map((r) => ({
      week_id: activeWeekId,
      class_active: r.class_active,
      class_passive: r.class_passive,
    }));

    setIsSaving(true);
    try {
      await saveLichtruc.mutateAsync(payload);
      toast.success(`Đã lưu lịch trực ${filledRows.length} lớp khối ${selectedGrade}`);
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi khi lưu lịch trực');
    } finally {
      setIsSaving(false);
      setConfirmSaveOpen(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAllLichtruc.mutateAsync();
      toast.success('Đã xóa toàn bộ lịch trực');
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi khi xóa');
    } finally {
      setConfirmClearOpen(false);
    }
  };

  const handleImport = async (importRows: { class_active: string; class_passive: string }[]) => {
    // Validate the imported batch using same rules
    const asAssignmentRows: AssignmentRow[] = importRows.map((r) => ({
      class_active: r.class_active,
      class_passive: r.class_passive,
    }));
    const importErrors = validateAssignments(asAssignmentRows);
    const importHasErrors = importErrors.some((e) => e.class_active);
    if (importHasErrors) {
      const msg = importErrors.find((e) => e.class_active)?.class_active;
      throw new Error(msg || 'Dữ liệu import không hợp lệ');
    }

    const payload = importRows.map((r) => ({
      week_id: activeWeekId,
      class_active: r.class_active,
      class_passive: r.class_passive,
    }));
    await saveLichtruc.mutateAsync(payload);
    toast.success(`Đã import ${payload.length} lịch trực`);
  };

  const isLoading = loadingWeeks || loadingClasses || loadingLt;

  // Week label
  const activeWeek = weekList.find((w: any) => String(w.week_id) === String(activeWeekId));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-indigo-600" />
            Sắp Xếp Lịch Trực
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Phân công lớp trực theo tuần và khối
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            Import Excel
          </Button>
          <Button variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => setConfirmClearOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa tất cả
          </Button>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">Tuần:</span>
          <Select
            value={activeWeekId}
            onValueChange={(v) => setSelectedWeekId(v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={loadingWeeks ? 'Đang tải...' : 'Chọn tuần'} />
            </SelectTrigger>
            <SelectContent>
              {weekList.map((w: any) => (
                <SelectItem key={w.week_id} value={String(w.week_id)}>
                  Tuần {w.week_id}
                  {w.start_date && w.end_date
                    ? ` (${new Date(w.start_date).toLocaleDateString('vi-VN')} – ${new Date(w.end_date).toLocaleDateString('vi-VN')})`
                    : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">Khối:</span>
          <div className="flex gap-1">
            {(grades.length > 0 ? grades : ['10', '11', '12']).map((g) => (
              <Button
                key={g}
                variant={selectedGrade === g ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedGrade(g)}
                className="w-20"
              >
                Khối {g}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      {activeWeek && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="outline">
            Tuần {activeWeek.week_id}
          </Badge>
          <span>
            {filledCount}/{gradeClasses.length} lớp đã phân công
          </span>
          {hasErrors && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> Có lỗi cần sửa
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : gradeClasses.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border rounded-lg">
          Không có lớp học nào trong khối {selectedGrade}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[60px]">STT</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Lớp trực</TableHead>
                <TableHead className="w-[160px]">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradeClasses.map((cls: any, index: number) => {
                const classActiveId = cls.class_id;
                const currentPassive = assignments[classActiveId] ?? '';
                const rowError = errors[index]?.class_active;

                return (
                  <TableRow key={classActiveId} className={rowError ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-mono text-sm text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{cls.class_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Select
                          value={currentPassive}
                          onValueChange={(v) => handleChange(classActiveId, v)}
                        >
                          <SelectTrigger className={`w-[200px] ${rowError ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="Chọn lớp trực..." />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Empty option to clear */}
                            <SelectItem value="_none">— Chưa phân công —</SelectItem>
                            {classList.map((c: any) => {
                              const isUsedElsewhere = usedPassiveInGrade.has(c.class_id) && c.class_id !== currentPassive;
                              const isSelf = c.class_id === classActiveId;
                              return (
                                <SelectItem
                                  key={c.class_id}
                                  value={c.class_id}
                                  disabled={isUsedElsewhere || isSelf}
                                >
                                  {c.class_name}
                                  {isSelf ? ' (chính lớp này)' : ''}
                                  {isUsedElsewhere ? ' (đã phân công)' : ''}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {rowError && (
                          <p className="text-xs text-destructive">{rowError}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {currentPassive && currentPassive !== '_none' ? (
                        <Badge variant="success" className="text-xs">Đã phân công</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Chưa phân công</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Save button */}
      {!isLoading && gradeClasses.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => setConfirmSaveOpen(true)}
            disabled={hasErrors || isSaving || filledCount === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Đang lưu...' : `Lưu lịch trực (${filledCount} lớp)`}
          </Button>
        </div>
      )}

      {/* Confirm Save */}
      <AlertDialog open={confirmSaveOpen} onOpenChange={(o) => !o && setConfirmSaveOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận lưu lịch trực</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp lưu lịch trực cho <strong>{filledCount} lớp</strong> thuộc Khối {selectedGrade},
              Tuần {activeWeekId}. Dữ liệu cũ của các lớp này sẽ được ghi đè.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Xác nhận lưu'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Clear All */}
      <AlertDialog open={confirmClearOpen} onOpenChange={(o) => !o && setConfirmClearOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa toàn bộ lịch trực?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa <strong>tất cả</strong> lịch trực hiện có trong hệ thống. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <ImportExcelDialog
        open={showImport}
        classList={classList}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </div>
  );
}

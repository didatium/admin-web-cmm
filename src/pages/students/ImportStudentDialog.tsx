import { useState } from 'react';
import XLSX from 'xlsx-js-style';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

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


type ClassRow = {
  class_id: string;
  class_name: string;
};

type ImportRowResult = {
  rowIndex: number;
  rawName: string;
  rawClassName: string;
  rawGender: string;
  rawDate: string;
  matchedClassId: string | null;
  parsedDate: string | null;
  isValid: boolean;
  errorMessage?: string;
};

const toIsoDate = (year: number, month: number, day: number): string | null => {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const parseExcelDate = (excelDate: any): string | null => {
  if (!excelDate) return null;

  if (typeof excelDate === 'string') {
    const trimmed = excelDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return toIsoDate(y, m, d);
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('/');
      return toIsoDate(Number(y), Number(m), Number(d));
    }
  }

  const num = Number(excelDate);
  if (!isNaN(num) && num > 0) {
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    return toIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  return null;
};

const findClassId = (rawInput: any, classList: ClassRow[]): string | null => {
  if (!rawInput) return null;

  const cleanInput = String(rawInput)
    .trim()
    .toUpperCase()
    .replace(/^LỚP\s*|^Lớp\s*|^CLS\s*/i, '')
    .replace(/\s+/g, '');

  const matchedClass = classList.find((c) => {
    const cleanClassId = String(c.class_id)
      .toUpperCase()
      .replace(/^CLS/i, '')
      .replace(/\s+/g, '');

    const cleanClassName = String(c.class_name)
      .toUpperCase()
      .replace(/^LỚP\s*|^Lớp\s*/i, '')
      .replace(/\s+/g, '');

    return cleanInput === cleanClassId || cleanInput === cleanClassName;
  });

  return matchedClass ? matchedClass.class_id : null;
};

export function ImportStudentDialog({
  open,
  classes,
  onClose,
  onImport,
}: {
  open: boolean;
  classes: ClassRow[];
  onClose: () => void;
  onImport: (validRows: { student_name: string; class_id: string; gioi_tinh: string; ngay_sinh: string }[]) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ImportRowResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    parseExcel(selectedFile);
  };

  const parseExcel = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        if (rawData.length === 0) {
          toast.error('File Excel không có dữ liệu');
          setParsedRows([]);
          return;
        }

        const results: ImportRowResult[] = rawData.map((row, idx) => {
          const rawClassName = String(row['Lớp'] || row['lớp'] || row['Class'] || '').trim();
          const rawName = String(row['Họ và tên'] || row['Họ và Tên'] || '').trim();
          const rawDate = row['Ngày sinh'] || row['ngày sinh'] || '';
          const rawGender = String(row['Giới tính'] || row['giới tính'] || 'Nam').trim();

          const matchedClassId = findClassId(rawClassName, classes);
          const parsedDate = parseExcelDate(rawDate);

          let isValid = true;
          let errorMessage = '';

          if (!rawName) {
            isValid = false;
            errorMessage = 'Thiếu Họ và Tên học sinh';
          } else if (!rawClassName) {
            isValid = false;
            errorMessage = 'Thiếu tên Lớp';
          } else if (!matchedClassId) {
            isValid = false;
            errorMessage = `Không tìm thấy lớp học [${rawClassName}] trong hệ thống`;
          } else if (!parsedDate) {
            isValid = false;
            errorMessage = 'Ngày sinh không hợp lệ';
          }

          return {
            rowIndex: idx + 2, // Excel 1-based header offset
            rawName,
            rawClassName,
            rawGender,
            rawDate: String(rawDate),
            matchedClassId,
            parsedDate,
            isValid,
            errorMessage,
          };
        });

        setParsedRows(results);
      } catch (err) {
        console.error(err);
        toast.error('Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng!');
      }
    };
    reader.readAsArrayBuffer(fileToParse);
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleConfirmImport = async () => {
    if (validRows.length === 0) {
      toast.error('Không có dòng dữ liệu hợp lệ nào để nhập!');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = validRows.map((r) => ({
        student_name: r.rawName,
        class_id: r.matchedClassId!,
        gioi_tinh: r.rawGender,
        ngay_sinh: r.parsedDate!,
      }));

      await onImport(payload);
      toast.success(`Đã nhập thành công ${validRows.length} học sinh!`);
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra trong quá trình nhập dữ liệu.');
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Import Danh Sách Học Sinh Từ Excel
          </DialogTitle>
          <DialogDescription>
            Tải lên file Excel (.xlsx, .xls) chứa danh sách học sinh. Định dạng cột yêu cầu:
            <span className="font-semibold text-foreground"> Họ và tên, Lớp, Giới tính, Ngày sinh</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/30 justify-center">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              id="excel-file-input"
              className="hidden"
            />
            <label
              htmlFor="excel-file-input"
              className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline"
            >
              <Upload className="h-4 w-4" />
              {file ? file.name : 'Chọn file Excel từ máy tính...'}
            </label>
          </div>

          {parsedRows.length > 0 && (
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-1">
                    Tổng số: <span className="font-bold">{parsedRows.length}</span> dòng
                  </Badge>
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Hợp lệ: {validRows.length}
                  </Badge>
                  {invalidRows.length > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Có lỗi: {invalidRows.length}
                    </Badge>
                  )}
                </div>
              </div>

              {invalidRows.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    Có <strong>{invalidRows.length}</strong> dòng bị lỗi sẽ bỏ qua không nhập. Các dòng hợp lệ vẫn sẽ được nhập bình thường.
                  </div>
                </div>
              )}

              <div className="border rounded-md flex-1 overflow-hidden">
                <div className="h-[280px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead className="w-[60px]">Dòng</TableHead>
                        <TableHead>Họ và tên</TableHead>
                        <TableHead>Lớp nhập</TableHead>
                        <TableHead>Lớp hệ thống</TableHead>
                        <TableHead>Giới tính</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row) => (
                        <TableRow key={row.rowIndex} className={!row.isValid ? 'bg-destructive/5' : ''}>
                          <TableCell className="font-mono text-xs">{row.rowIndex}</TableCell>
                          <TableCell className="font-medium">{row.rawName || '—'}</TableCell>
                          <TableCell>{row.rawClassName || '—'}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.matchedClassId ? (
                              <Badge variant="secondary" className="font-mono">
                                {row.matchedClassId}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{row.rawGender}</TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-600/30 bg-emerald-50">
                                Sẵn sàng
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                {row.errorMessage}
                              </Badge>
                            )}
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
          <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirmImport}
            disabled={validRows.length === 0 || isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isProcessing ? 'Đang nhập...' : `Nhập ${validRows.length} học sinh`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { CalendarIcon, MoreHorizontal, Plus, FileSpreadsheet } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useQueries } from '@tanstack/react-query';

import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useClasses,
  useViphamByClass,
  apiGet,
} from '@/shared';

import { cn } from '@/lib/utils';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { ImportStudentDialog } from './ImportStudentDialog';
import { StudentViolationsModal } from './StudentViolationsModal';

// --- Types ---
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

const createStudentSchema = z.object({
  student_name: z.string().min(1, 'Tên học sinh là bắt buộc').max(100, 'Tối đa 100 ký tự'),
  class_id: z.string().min(1, 'Lớp là bắt buộc'),
  gioi_tinh: z.string().min(1, 'Vui lòng chọn giới tính'),
  ngay_sinh: z.string().min(1, 'Vui lòng chọn ngày sinh'),
});

const editStudentSchema = z.object({
  student_id: z.number(),
  student_name: z.string().min(1, 'Tên học sinh là bắt buộc').max(100, 'Tối đa 100 ký tự'),
  class_id: z.string().min(1, 'Lớp là bắt buộc'),
  gioi_tinh: z.string().min(1, 'Vui lòng chọn giới tính'),
  ngay_sinh: z.string().min(1, 'Vui lòng chọn ngày sinh'),
});

type CreateStudentForm = z.infer<typeof createStudentSchema>;
type EditStudentForm = z.infer<typeof editStudentSchema>;

// --- Create Dialog ---
function CreateStudentDialog({
  open,
  classes,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  classes: ClassRow[];
  onClose: () => void;
  onSubmit: (values: CreateStudentForm) => Promise<void>;
  isLoading: boolean;
}) {
  const form = useForm<CreateStudentForm>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: { student_name: '', class_id: '', gioi_tinh: '', ngay_sinh: '' },
  });

  const handleSubmit = async (values: CreateStudentForm) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm Học Sinh</DialogTitle>
        </DialogHeader>
        {classes.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            Chưa có lớp học nào — Vui lòng tạo lớp học trước.
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="student_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên Học Sinh</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Nguyễn Văn A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lớp</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn lớp" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.class_id} value={cls.class_id}>
                              {cls.class_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gioi_tinh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giới tính</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn giới tính" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Nam">Nam</SelectItem>
                          <SelectItem value="Nữ">Nữ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ngay_sinh"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày sinh</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "dd/MM/yyyy", { locale: vi })
                            ) : (
                              <span>Chọn ngày sinh</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          captionLayout="dropdown"
                          startMonth={new Date(1990, 0)}
                          endMonth={new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Đang lưu...' : 'Thêm mới'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Dialog ---
function EditStudentDialog({
  open,
  defaultValues,
  classes,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  defaultValues: EditStudentForm;
  classes: ClassRow[];
  onClose: () => void;
  onSubmit: (values: EditStudentForm) => Promise<void>;
  isLoading: boolean;
}) {
  const form = useForm<EditStudentForm>({
    resolver: zodResolver(editStudentSchema),
    defaultValues,
    values: defaultValues,
  });

  const handleSubmit = async (values: EditStudentForm) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa Thông Tin Học Sinh</DialogTitle>
        </DialogHeader>
        {classes.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            Chưa có lớp học nào — Vui lòng tạo lớp học trước.
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="student_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên Học Sinh</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Nguyễn Văn A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lớp</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn lớp" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.class_id} value={cls.class_id}>
                              {cls.class_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gioi_tinh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giới tính</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn giới tính" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Nam">Nam</SelectItem>
                          <SelectItem value="Nữ">Nữ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ngay_sinh"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày sinh</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "dd/MM/yyyy", { locale: vi })
                            ) : (
                              <span>Chọn ngày sinh</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          captionLayout="dropdown"
                          startMonth={new Date(1990, 0)}
                          endMonth={new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// --- StudentsPage ---
export function StudentsPage() {
  const { data: students, isLoading, isError, error, refetch } = useStudents();
  const { data: classesData } = useClasses();

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null);
  const [selectedStudentForViolation, setSelectedStudentForViolation] = useState<StudentRow | null>(null);

  const [filterClass, setFilterClass] = useState<string>('all');

  const classes = (classesData as ClassRow[]) || [];
  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => map.set(c.class_id, c.class_name));
    return map;
  }, [classes]);

  const allStudents = (students as StudentRow[]) || [];

  // Filter students by selected class
  const filteredStudents = useMemo(() => {
    if (filterClass === 'all') return allStudents;
    return allStudents.filter((s) => s.class_id === filterClass);
  }, [allStudents, filterClass]);

  // Violation queries using shared hook logic
  const { data: singleClassVipham = [] } = useViphamByClass(filterClass !== 'all' ? filterClass : undefined);

  const allClassViphamQueries = useQueries({
    queries: filterClass === 'all'
      ? classes.map((c) => ({
        queryKey: ['vipham', 'class', c.class_id],
        queryFn: () => apiGet('/viphamclass/' + c.class_id),
        enabled: filterClass === 'all',
      }))
      : [],
  });

  const viphamList = useMemo(() => {
    if (filterClass !== 'all') {
      return Array.isArray(singleClassVipham) ? singleClassVipham : [];
    }
    const combined: any[] = [];
    allClassViphamQueries.forEach((q) => {
      if (Array.isArray(q.data)) {
        combined.push(...q.data);
      }
    });
    return combined;
  }, [filterClass, singleClassVipham, allClassViphamQueries]);

  // Aggregate violation counts per student matching mobile logic:
  // viphamList.forEach(vpm => (vpm.students ?? []).forEach(s => counts[s.student_id]++))
  const violationCountByStudent = useMemo(() => {
    const counts: Record<number, number> = {};
    viphamList.forEach((vpm: any) => {
      (vpm.students ?? []).forEach((s: any) => {
        if (s && s.student_id) {
          counts[s.student_id] = (counts[s.student_id] ?? 0) + 1;
        }
      });
    });
    return counts;
  }, [viphamList]);

  const formatDateForApi = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    return dateStr;
  };

  const handleCreateSubmit = async (values: CreateStudentForm) => {
    try {
      await createStudent.mutateAsync({
        student_name: values.student_name,
        class_id: values.class_id,
        gioi_tinh: values.gioi_tinh,
        ngay_sinh: formatDateForApi(values.ngay_sinh),
      });
      toast.success('Thêm học sinh thành công');
      setShowCreate(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    }
  };

  const handleBatchImport = async (validRows: { student_name: string; class_id: string; gioi_tinh: string; ngay_sinh: string }[]) => {
    try {
      await Promise.all(validRows.map((item) => createStudent.mutateAsync({
        ...item,
        ngay_sinh: formatDateForApi(item.ngay_sinh),
      })));
      refetch();
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleEditSubmit = async (values: EditStudentForm) => {
    if (!editTarget) return;
    try {
      await updateStudent.mutateAsync({
        student_id: values.student_id,
        student_name: values.student_name,
        class_id: values.class_id,
        gioi_tinh: values.gioi_tinh,
        ngay_sinh: formatDateForApi(values.ngay_sinh),
      });
      toast.success('Cập nhật thông tin thành công');
      setEditTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStudent.mutateAsync(deleteTarget.student_id);
      toast.success(`Đã xóa học sinh "${deleteTarget.student_name}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa học sinh');
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<StudentRow, unknown>[] = [
    {
      id: 'stt',
      header: 'STT',
      cell: ({ row }) => row.index + 1,
    },
    { accessorKey: 'student_name', header: 'Tên học sinh' },
    {
      accessorKey: 'class_id',
      header: 'Lớp',
      cell: ({ row }: CellContext<StudentRow, unknown>) => {
        const classId = row.getValue('class_id') as string;
        return classMap.get(classId) || classId;
      },
    },
    { accessorKey: 'gioi_tinh', header: 'Giới tính' },
    {
      accessorKey: 'ngay_sinh',
      header: 'Ngày sinh',
      cell: ({ row }: CellContext<StudentRow, unknown>) => {
        const val = row.getValue('ngay_sinh') as string | null;
        return val ? format(new Date(val), 'dd/MM/yyyy', { locale: vi }) : '—';
      },
    },
    {
      id: 'violation_count',
      header: 'Số vi phạm',
      cell: ({ row }: CellContext<StudentRow, unknown>) => {
        const student = row.original as StudentRow;
        const count = violationCountByStudent[student.student_id] || 0;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedStudentForViolation(student)}
            className="h-8 px-2 flex items-center gap-1.5 hover:bg-muted"
          >
            {count > 0 ? (
              <Badge variant="destructive" className="px-2 py-0.5 text-xs font-semibold cursor-pointer">
                {count}
              </Badge>
            ) : (
              <Badge variant="outline" className="px-2 py-0.5 text-xs text-muted-foreground font-normal cursor-pointer">
                0
              </Badge>
            )}
          </Button>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }: CellContext<StudentRow, unknown>) => {
        const rowData = row.original as StudentRow;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedStudentForViolation(rowData)}>
                Xem vi phạm
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditTarget(rowData)}>Chỉnh sửa</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteTarget(rowData)}
              >
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const targetClassForViolationModal = useMemo(() => {
    if (!selectedStudentForViolation) return undefined;
    return classes.find((c) => c.class_id === selectedStudentForViolation.class_id);
  }, [selectedStudentForViolation, classes]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý học sinh</h1>
          <p className="text-sm text-muted-foreground">Quản lý học sinh và thông tin lớp học</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
            Import Excel
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm Học Sinh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Lọc theo Lớp:</span>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tất cả các lớp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả các lớp</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.class_id} value={cls.class_id}>
                {cls.class_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <TableSkeleton />}

      {isError && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Không thể tải danh sách học sinh</p>
          <p className="mt-1">{(error as Error)?.message ?? 'Lỗi không xác định'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <DataTable
          columns={columns}
          data={filteredStudents}
          searchPlaceholder="Tìm kiếm theo tên học sinh..."
          searchColumn="student_name"
        />
      )}

      <CreateStudentDialog
        open={showCreate}
        classes={classes}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createStudent.isPending}
      />

      <ImportStudentDialog
        open={showImport}
        classes={classes}
        onClose={() => setShowImport(false)}
        onImport={handleBatchImport}
      />

      {selectedStudentForViolation && (
        <StudentViolationsModal
          open={!!selectedStudentForViolation}
          student={selectedStudentForViolation}
          targetClass={targetClassForViolationModal}
          viphamList={viphamList}
          onClose={() => setSelectedStudentForViolation(null)}
        />
      )}

      {editTarget && (
        <EditStudentDialog
          open={!!editTarget}
          classes={classes}
          defaultValues={{
            student_id: editTarget.student_id,
            student_name: editTarget.student_name,
            class_id: editTarget.class_id,
            gioi_tinh: editTarget.gioi_tinh || '',
            ngay_sinh: formatDateForApi(editTarget.ngay_sinh),
          }}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
          isLoading={updateStudent.isPending}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Học Sinh</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa học sinh{' '}
              <span className="font-semibold">"{deleteTarget?.student_name}"</span> không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStudent.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import { useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from '@/shared';

import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
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

// --- Types ---
type ClassRow = {
  class_id: string;
  class_name: string;
  grade: number | null;
};

// --- Helpers ---
function extractClassName(input: string): string {
  return input.replace(/^(lớp|lop|class|cls)\s*/i, '').trim().toUpperCase();
}

function getKhoiLop(tenLop: string | undefined): number | null {
  if (!tenLop) return null;
  const match = tenLop.toString().match(/\d+/);

  if (match) {
    const khoi = parseInt(match[0], 10);
    if (khoi >= 1 && khoi <= 12) {
      return khoi;
    }
  }
  return null;
}

// --- Zod schema
const classSchema = z.object({
  class_name: z.string().min(1, 'Class name is required').max(10, 'Max 10 characters'),
});

type ClassFormValues = z.infer<typeof classSchema>;

// --- ClassFormDialog ---
type DialogMode = 'create' | 'edit';

interface ClassFormDialogProps {
  open: boolean;
  mode: DialogMode;
  defaultValues?: ClassFormValues;
  onClose: () => void;
  onSubmit: (values: ClassFormValues) => Promise<void>;
  isLoading: boolean;
}

function ClassFormDialog({
  open,
  mode,
  defaultValues,
  onClose,
  onSubmit,
  isLoading,
}: ClassFormDialogProps) {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: defaultValues ?? { class_name: '' },
    values: defaultValues,
  });

  const handleSubmit = async (values: ClassFormValues) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Class' : 'Edit Class'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="class_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 10T1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Loading Skeleton ---
function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// --- ClassesPage ---
export function ClassesPage() {
  const { data: classes, isLoading, isError, error, refetch } = useClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [editTarget, setEditTarget] = useState<ClassRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);

  // --- Helpers ---
  const openCreate = () => {
    setEditTarget(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const openEdit = (row: ClassRow) => {
    setEditTarget(row);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
  };

  const handleFormSubmit = async (values: ClassFormValues) => {
    const rawClassName = extractClassName(values.class_name);

    if (!rawClassName) {
      toast.error('Tên lớp không hợp lệ');
      return;
    }

    const computedGrade = getKhoiLop(rawClassName);
    const newClassId = 'cls' + rawClassName;
    const finalClassName = 'Lớp ' + rawClassName;

    try {
      if (dialogMode === 'create') {
        const isDuplicate = (classes as ClassRow[])?.some(
          (c) =>
            c.class_id === newClassId ||
            c.class_name.toLowerCase() === finalClassName.toLowerCase()
        );

        if (isDuplicate) {
          toast.error('This class already exists');
          return;
        }

        const payload = {
          class_id: newClassId,
          class_name: finalClassName,
          ...(computedGrade !== null ? { grade: computedGrade } : {}),
        };
        await createClass.mutateAsync(payload);
        toast.success('Class created successfully');
      } else {
        if (!editTarget) return;
        const payload = {
          class_id: editTarget.class_id,
          class_name: finalClassName,
          ...(computedGrade !== null ? { grade: computedGrade } : {}),
        };
        await updateClass.mutateAsync(payload);
        toast.success('Class updated successfully');
      }
      closeDialog();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteClass.mutateAsync(deleteTarget.class_id);
      toast.success(`Class "${deleteTarget.class_id}" deleted`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete class';
      toast.error(message);
    } finally {
      setDeleteTarget(null);
    }
  };

  // --- Columns ---
  const columns: ColumnDef<ClassRow, unknown>[] = [
    {
      accessorKey: 'class_id',
      header: 'Class ID',
    },
    {
      accessorKey: 'class_name',
      header: 'Class Name',
    },
    {
      accessorKey: 'grade',
      header: 'Grade',
      cell: ({ row }: CellContext<ClassRow, unknown>) =>
        (row.getValue('grade') as number | null) ?? '—',
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }: CellContext<ClassRow, unknown>) => {
        const rowData = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(rowData)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteTarget(rowData)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // --- Render ---
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-sm text-muted-foreground">Manage school classes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {isLoading && <TableSkeleton />}

      {isError && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Failed to load classes</p>
          <p className="mt-1">{(error as Error)?.message ?? 'Unknown error'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <DataTable
          columns={columns}
          data={(classes as ClassRow[]) ?? []}
          searchPlaceholder="Search by class ID..."
          searchColumn="class_id"
        />
      )}

      {/* Create / Edit Dialog */}
      <ClassFormDialog
        open={dialogOpen}
        mode={dialogMode}
        defaultValues={
          editTarget
            ? {
              class_name: editTarget.class_name,
            }
            : undefined
        }
        onClose={closeDialog}
        onSubmit={handleFormSubmit}
        isLoading={createClass.isPending || updateClass.isPending}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete class{' '}
              <span className="font-semibold">{deleteTarget?.class_id}</span>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClass.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

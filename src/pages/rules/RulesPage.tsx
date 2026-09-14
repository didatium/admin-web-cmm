import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import { useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useRules, useCreateRule, useUpdateRule, useDeleteRule } from '@/shared';

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
// Rules model: name_vp_id (integer, auto by DB), name_vp (string max 100), minus_pnt (integer), type (string max 100, nullable — free string)
// createRulesSchema: name_vp required, minus_pnt required, type optional
// updateRulesSchema: name_vp_id required, rest optional
type RuleRow = {
  name_vp_id: number;
  name_vp: string;
  minus_pnt: number;
  type: string | null;
};

const createRuleSchema = z.object({
  name_vp: z.string().min(1, 'Rule name is required').max(100, 'Max 100 characters'),
  minus_pnt: z
    .string()
    .min(1, 'Penalty points required')
    .regex(/^-?\d+$/, 'Must be an integer'),
  type: z.string().max(100, 'Max 100 characters').optional(),
});

const editRuleSchema = z.object({
  name_vp: z.string().min(1, 'Rule name is required').max(100, 'Max 100 characters'),
  minus_pnt: z.string().regex(/^-?\d+$/, 'Must be an integer'),
  type: z.string().max(100, 'Max 100 characters').optional(),
});

type CreateRuleForm = z.infer<typeof createRuleSchema>;
type EditRuleForm = z.infer<typeof editRuleSchema>;

// --- Create Dialog ---
function CreateRuleDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateRuleForm) => Promise<void>;
  isLoading: boolean;
}) {
  const form = useForm<CreateRuleForm>({
    resolver: zodResolver(createRuleSchema),
    defaultValues: { name_vp: '', minus_pnt: '', type: '' },
  });

  const handleSubmit = async (values: CreateRuleForm) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm luật</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name_vp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên luật</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Nói chuyện trong giờ học" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minus_pnt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm thưởng/phạt</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. -5 với điểm phạt/5 với điểm thưởng" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Dialog ---
function EditRuleDialog({
  open,
  defaultValues,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  defaultValues: EditRuleForm;
  onClose: () => void;
  onSubmit: (values: EditRuleForm) => Promise<void>;
  isLoading: boolean;
}) {
  const form = useForm<EditRuleForm>({
    resolver: zodResolver(editRuleSchema),
    defaultValues,
    values: defaultValues,
  });

  const handleSubmit = async (values: EditRuleForm) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa luật</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name_vp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên luật</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Nói chuyện trong giờ học" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minus_pnt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm thưởng/phạt</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. -5 với điểm phạt/5 với điểm thưởng" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
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

// --- RulesPage ---
export function RulesPage() {
  const { data: rules, isLoading, isError, error, refetch } = useRules();
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<RuleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RuleRow | null>(null);

  const handleCreateSubmit = async (values: CreateRuleForm) => {
    try {
      await createRule.mutateAsync({
        name_vp: values.name_vp,
        minus_pnt: parseInt(values.minus_pnt, 10),
        type: values.type && values.type.trim() !== '' ? values.type.trim() : null,
      });
      toast.success('Thêm luật thành công');
      setShowCreate(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEditSubmit = async (values: EditRuleForm) => {
    if (!editTarget) return;
    try {
      await updateRule.mutateAsync({
        name_vp_id: editTarget.name_vp_id,
        name_vp: values.name_vp,
        minus_pnt: parseInt(values.minus_pnt, 10),
        type: values.type && values.type.trim() !== '' ? values.type.trim() : null,
      });
      toast.success('Chỉnh sửa luật thành công');
      setEditTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRule.mutateAsync(deleteTarget.name_vp_id);
      toast.success(`Luật "${deleteTarget.name_vp}" đã bị xóa`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete rule');
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<RuleRow, unknown>[] = [
    { accessorKey: 'name_vp_id', header: 'ID' },
    { accessorKey: 'name_vp', header: 'Tên luật' },
    { accessorKey: 'minus_pnt', header: 'Điểm thưởng/phạt' },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }: CellContext<RuleRow, unknown>) => {
        const rowData = row.original as RuleRow;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditTarget(rowData)}>Edit</DropdownMenuItem>
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Giao ước thi đua</h1>
          <p className="text-sm text-muted-foreground">Thiết lập danh mục các tiêu chí nội quy</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm luật
        </Button>
      </div>

      {isLoading && <TableSkeleton />}

      {isError && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Failed to load rules</p>
          <p className="mt-1">{(error as Error)?.message ?? 'Unknown error'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <DataTable
          columns={columns}
          data={(rules as RuleRow[]) ?? []}
          searchPlaceholder="Search by rule name..."
          searchColumn="name_vp"
        />
      )}

      <CreateRuleDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createRule.isPending}
      />

      {editTarget && (
        <EditRuleDialog
          open={!!editTarget}
          defaultValues={{
            name_vp: editTarget.name_vp,
            minus_pnt: String(editTarget.minus_pnt),
            type: editTarget.type ?? '',
          }}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
          isLoading={updateRule.isPending}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa luật</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa luật này không{' '}
              <span className="font-semibold">"{deleteTarget?.name_vp}"</span>? Hành vi này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRule.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

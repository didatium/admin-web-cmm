import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import { useState } from 'react';
import { MoreHorizontal, Plus, CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useWeeks, useCreateWeek, useUpdateWeek } from '@/shared';

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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// --- Types ---
// Week model: week_id (string max 4), week_name (string max 10), start_date (string|null), end_date (string|null)
// updateWeekSchema in validators.js: { week_id required, start_date optional, end_date optional }
// week_name is NOT present in updateWeekSchema — cannot be updated via PUT /week
type WeekRow = {
  week_id: string;
  week_name: string;
  start_date: string | null;
  end_date: string | null;
};

// Separate schemas for create vs edit (different required fields)
const createWeekSchema = z.object({
  week_id: z.string().min(1, 'Week ID is required').max(4, 'Max 4 characters'),
  week_name: z.string().min(1, 'Week name is required').max(10, 'Max 10 characters'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const editWeekSchema = z.object({
  week_id: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type CreateWeekForm = z.infer<typeof createWeekSchema>;
type EditWeekForm = z.infer<typeof editWeekSchema>;

// --- Shared date fields component ---
const clean = (s: string | undefined) => (s && s.trim() !== '' ? s.trim() : undefined);

// --- Create Dialog ---
function CreateWeekDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateWeekForm) => Promise<void>;
  isLoading: boolean;
}) {
  const form = useForm<CreateWeekForm>({
    resolver: zodResolver(createWeekSchema),
    defaultValues: { week_id: '', week_name: '', start_date: '', end_date: '' },
  });

  const handleSubmit = async (values: CreateWeekForm) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Week</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="week_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Week ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. W01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="week_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Week Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Tuần 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
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
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date: Date | undefined) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
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
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date: Date | undefined) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                      />
                    </PopoverContent>
                  </Popover>
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
function EditWeekDialog({
  open,
  defaultValues,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  defaultValues: EditWeekForm;
  onClose: () => void;
  onSubmit: (values: EditWeekForm) => Promise<void>;
  isLoading: boolean;
}) {
  const form = useForm<EditWeekForm>({
    resolver: zodResolver(editWeekSchema),
    defaultValues,
    values: defaultValues,
  });

  const handleSubmit = async (values: EditWeekForm) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Week</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="week_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Week ID</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
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
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date: Date | undefined) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
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
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date: Date | undefined) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                      />
                    </PopoverContent>
                  </Popover>
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

// --- WeeksPage ---
export function WeeksPage() {
  const { data: weeks, isLoading, isError, error, refetch } = useWeeks();
  const createWeek = useCreateWeek();
  const updateWeek = useUpdateWeek();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<WeekRow | null>(null);

  const handleCreateSubmit = async (values: CreateWeekForm) => {
    try {
      await createWeek.mutateAsync({
        week_id: values.week_id,
        week_name: values.week_name,
        start_date: clean(values.start_date),
        end_date: clean(values.end_date),
      });
      toast.success('Week created successfully');
      setShowCreate(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEditSubmit = async (values: EditWeekForm) => {
    try {
      await updateWeek.mutateAsync({
        week_id: values.week_id,
        start_date: clean(values.start_date),
        end_date: clean(values.end_date),
      });
      toast.success('Week updated successfully');
      setEditTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const columns: ColumnDef<WeekRow, unknown>[] = [
    { accessorKey: 'week_id', header: 'Week ID' },
    { accessorKey: 'week_name', header: 'Week Name' },
    {
      accessorKey: 'start_date',
      header: 'Start Date',
      cell: ({ row }: CellContext<WeekRow, unknown>) => {
        const val = row.getValue('start_date') as string | null;
        return val ? format(new Date(val), 'dd/MM/yyyy', { locale: vi }) : '—';
      },
    },
    {
      accessorKey: 'end_date',
      header: 'End Date',
      cell: ({ row }: CellContext<WeekRow, unknown>) => {
        const val = row.getValue('end_date') as string | null;
        return val ? format(new Date(val), 'dd/MM/yyyy', { locale: vi }) : '—';
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }: CellContext<WeekRow, unknown>) => {
        const rowData = row.original as WeekRow;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditTarget(rowData)}>Edit</DropdownMenuItem>
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
          <h1 className="text-2xl font-bold">Weeks</h1>
          <p className="text-sm text-muted-foreground">Manage school weeks</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Week
        </Button>
      </div>

      {isLoading && <TableSkeleton />}

      {isError && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Failed to load weeks</p>
          <p className="mt-1">{(error as Error)?.message ?? 'Unknown error'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <DataTable
          columns={columns}
          data={(weeks as WeekRow[]) ?? []}
          searchPlaceholder="Search by week ID..."
          searchColumn="week_id"
        />
      )}

      <CreateWeekDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createWeek.isPending}
      />

      {editTarget && (
        <EditWeekDialog
          open={!!editTarget}
          defaultValues={{
            week_id: editTarget.week_id,
            start_date: editTarget.start_date ?? '',
            end_date: editTarget.end_date ?? '',
          }}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
          isLoading={updateWeek.isPending}
        />
      )}
    </div>
  );
}

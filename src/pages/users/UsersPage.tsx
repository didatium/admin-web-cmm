import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import { useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  useAllUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetPassword,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// --- Role constants (match backend / mobile)
const ROLE_ADMIN = 'admin';
const ROLE_ADMIN_KHOI = 'admin_khoi';
const ROLE_SAO_DO = 'sao_do';

// --- Types ---
type UserRow = {
  user_id: string;
  user_name: string;
  role?: string | null;
  user_class?: string | null;
  grade_scope?: number | null;
};

// --- Zod schemas (aligned with backend validators.js)
const createUserSchema = z.object({
  user_id: z.string().min(1, 'User ID is required').max(6, 'Max 6 characters'),
  password: z.string().min(1, 'Password is required').max(100, 'Max 100 characters'),
  user_name: z.string().min(1, 'User name is required').max(10, 'Max 10 characters'),
  role: z.string().max(10).optional().nullable(),
  user_class: z.string().max(7).optional().nullable(),
  grade_scope: z
    .string()
    .regex(/^\d*$/, 'Must be a number or blank')
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : Number(s))),
});

const editUserSchema = z.object({
  user_id: z.string().min(1).max(6),
  // password is not allowed in edit dialog per requirements
  user_name: z.string().min(1, 'User name is required').max(10, 'Max 10 characters').optional(),
  role: z.string().max(10).optional().nullable(),
  user_class: z.string().max(7).optional().nullable(),
  grade_scope: z
    .string()
    .regex(/^\d*$/, 'Must be a number or blank')
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : Number(s))),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;

// --- Create / Edit Dialog ---
type DialogMode = 'create' | 'edit';

function UserFormDialog({
  open,
  mode,
  defaultValues,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  mode: DialogMode;
  defaultValues?: any;
  onClose: () => void;
  onSubmit: (values: CreateUserForm | EditUserForm) => Promise<void>;
  isLoading: boolean;
}) {
  const schema = mode === 'create' ? createUserSchema : editUserSchema;
  const form = useForm<any>({
    resolver: zodResolver(schema as any),
    defaultValues:
      defaultValues ??
      (mode === 'create'
        ? { user_id: '', password: '', user_name: '', role: undefined, user_class: '', grade_scope: '' }
        : { user_id: '', user_name: '', role: undefined, user_class: '', grade_scope: '' }),
    values: defaultValues,
  });

  const roleValue = form.watch('role');

  const handleSubmit = async (values: any) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add User' : 'Edit User'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 10A1" {...field} disabled={mode === 'edit'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="user_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ROLE_ADMIN}>{'Admin'}</SelectItem>
                        <SelectItem value={ROLE_SAO_DO}>{'Sao Đo'}</SelectItem>
                        <SelectItem value={ROLE_ADMIN_KHOI}>{'Admin Khối'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 10A1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* grade_scope only relevant when role === 'admin_khoi' */}
            {roleValue === ROLE_ADMIN_KHOI && (
              <FormField
                control={form.control}
                name="grade_scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Scope (e.g. 10)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Grade number" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

// --- Reset Password Dialog ---
function ResetPasswordDialog({ open, onOpenChange, onConfirm, isLoading }: { open: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => Promise<string | undefined>; isLoading: boolean; }) {
  const [result, setResult] = useState<string | null>(null);

  const handleConfirm = async () => {
    setResult(null);
    try {
      const newPw = await onConfirm();
      if (newPw) {
        setResult(newPw);
        toast.success(`New password: ${newPw}`);
        // leave dialog open briefly to show result then close
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">Confirm to generate a new password for this user. The server will generate and return the new password.</p>
          {result && (
            <div className="mt-3 font-mono rounded-md border px-3 py-2 bg-gray-50">{result}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isLoading}>{isLoading ? 'Resetting...' : 'Reset Password'}</Button>
        </DialogFooter>
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

export function UsersPage() {
  const { data: users, isLoading, isError, error, refetch } = useAllUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const openCreate = () => {
    setEditTarget(null);
    setDialogMode('create');
    setDialogOpen(true);
  };
  const openEdit = (row: UserRow) => {
    setEditTarget(row);
    setDialogMode('edit');
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
  };

  const handleFormSubmit = async (values: any) => {
    // transform grade_scope if present
    const payload: any = {
      user_id: values.user_id,
      user_name: values.user_name,
    };
    if (values.role !== undefined) payload.role = values.role;
    if (values.user_class !== undefined && values.user_class !== '') payload.user_class = values.user_class;
    if (values.grade_scope !== undefined && values.grade_scope !== '') payload.grade_scope = values.grade_scope;
    if (dialogMode === 'create') {
      payload.password = values.password;
    }

    try {
      if (dialogMode === 'create') {
        await createUser.mutateAsync(payload);
        toast.success('User created successfully');
      } else {
        await updateUser.mutateAsync(payload);
        toast.success('User updated successfully');
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
      await deleteUser.mutateAsync(deleteTarget.user_id);
      toast.success(`User "${deleteTarget.user_id}" deleted`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleResetConfirm = async () => {
    if (!resetTarget) return undefined;
    try {
      const newPw = await resetPassword.mutateAsync(resetTarget.user_id);
      toast.success(`New password generated`);
      // show password in UI is handled by ResetPasswordDialog through toast as well
      return newPw as string | undefined;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      toast.error(message);
      return undefined;
    } finally {
      setResetTarget(null);
    }
  };

  // --- Columns ---
  const columns: ColumnDef<UserRow, unknown>[] = [
    { accessorKey: 'user_id', header: 'User ID' },
    { accessorKey: 'user_name', header: 'User Name' },
    { accessorKey: 'role', header: 'Role' },
    {
      accessorKey: 'user_class',
      header: 'Class',
      cell: ({ row }: CellContext<UserRow, unknown>) => row.getValue('user_class') ?? '—',
    },
    {
      accessorKey: 'grade_scope',
      header: 'Grade Scope',
      cell: ({ row }: CellContext<UserRow, unknown>) => (row.getValue('grade_scope') as number | null) ?? '—',
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }: CellContext<UserRow, unknown>) => {
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
              <DropdownMenuItem onClick={() => { setResetTarget(rowData); setResetDialogOpen(true); }}>Reset Password</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(rowData)}>Delete</DropdownMenuItem>
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
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage application users</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {isLoading && <TableSkeleton />}

      {isError && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Failed to load users</p>
          <p className="mt-1">{(error as Error)?.message ?? 'Unknown error'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <DataTable columns={columns} data={(users as UserRow[]) ?? []} searchPlaceholder="Search by user ID..." searchColumn="user_id" />
      )}

      {/* Create / Edit Dialog */}
      <UserFormDialog
        open={dialogOpen}
        mode={dialogMode}
        defaultValues={
          editTarget
            ? {
                user_id: editTarget.user_id,
                user_name: editTarget.user_name,
                role: editTarget.role ?? undefined,
                user_class: editTarget.user_class ?? '',
                grade_scope: editTarget.grade_scope != null ? String(editTarget.grade_scope) : '',
              }
            : undefined
        }
        onClose={closeDialog}
        onSubmit={handleFormSubmit}
        isLoading={createUser.isPending || updateUser.isPending}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onConfirm={handleResetConfirm}
        isLoading={resetPassword.isPending}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user <span className="font-semibold">{deleteTarget?.user_id}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteUser.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

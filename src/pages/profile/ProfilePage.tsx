import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSelfUpdateUser } from '@/shared';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { User as UserIcon, KeyRound, Shield, Lock } from 'lucide-react';

const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu mới')
      .max(100, 'Mật khẩu tối đa 100 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ProfilePage() {
  const { user } = useAuth();
  const selfUpdateUserMutation = useSelfUpdateUser();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await selfUpdateUserMutation.mutateAsync({
        password: values.password,
      });
      toast.success('Đổi mật khẩu thành công');
      form.reset();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    }
  };

  const getRoleLabel = (role?: string | null) => {
    if (!role) return '-';
    switch (role) {
      case 'admin':
        return 'Quản trị viên (Admin)';
      case 'admin_khoi':
        return 'Admin khối';
      case 'sao_do':
        return 'Sao đỏ';
      default:
        return role;
    }
  };

  const userId = user?.user_id || user?.id || '-';
  const userName = user?.user_name || user?.name || '-';
  const userRole = user?.role || '-';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tài khoản của tôi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem thông tin tài khoản và thay đổi mật khẩu đăng nhập
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info Section (Read-only) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
              <p className="text-xs text-gray-500">Thông tin được chỉ định bởi hệ thống</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500 block mb-1">
                Mã người dùng (User ID)
              </label>
              <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900">
                {userId}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500 block mb-1">
                Tên đăng nhập
              </label>
              <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                {userName}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500 block mb-1">
                Vai trò (Role)
              </label>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
                  <Shield className="h-3 w-3 mr-1 text-indigo-600" />
                  {getRoleLabel(userRole)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h2>
              <p className="text-xs text-gray-500">Cập nhật mật khẩu bảo vệ tài khoản</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="Nhập mật khẩu mới (tối đa 100 ký tự)"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="Nhập lại mật khẩu mới"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={selfUpdateUserMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {selfUpdateUserMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

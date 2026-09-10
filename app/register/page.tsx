"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { pushToast } from "@/components/ui/toast";

function translateAuthError(raw: string): string {
  if (raw.includes('already exists')) return 'Tài khoản với email này đã tồn tại. Vui lòng đăng nhập hoặc dùng email khác.';
  if (raw.includes('valid email')) return 'Vui lòng nhập đúng định dạng email.';
  if (raw.includes('Password must be')) return 'Mật khẩu phải có từ 8 ký tự trở lên.';
  if (raw.includes('unavailable')) return 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.';
  return raw || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { register, isLoggedIn, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Vui lòng nhập đúng định dạng email.");
        setLoading(false);
        return;
      }

      await register(email.trim(), password);

      pushToast({
        title: 'Đăng ký thành công!',
        message: `Chào mừng bạn đến với FinPilot!`,
        type: 'success',
        icon: '🎉',
      });

      router.push("/dashboard");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setError(translateAuthError(raw));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center fade-in px-4 sm:px-6 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
          <p className="text-sm text-muted-foreground mt-1">Tham gia FinPilot để theo dõi thị trường thông minh</p>
        </div>

        <form onSubmit={handleRegister} className="card space-y-4">
          {error && <div role="alert" className="text-sm text-red-500 bg-red-500/10 p-3 rounded-xl">{error}</div>}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input className="input" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required id="register-email" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Mật khẩu</label>
            <input className="input" type="password" placeholder="Tối thiểu 8 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} required id="register-password" />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading || authLoading} id="register-submit">
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản? <a href="/login" className="text-primary hover:underline">Đăng nhập</a>
          </p>
        </form>
      </div>
    </div>
  );
}

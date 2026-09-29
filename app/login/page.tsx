"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { pushToast } from "@/components/ui/toast";

function translateLoginError(raw: string): string {
  if (raw.includes('Invalid email or password')) return 'Email hoặc mật khẩu không chính xác.';
  if (raw.includes('valid email')) return 'Vui lòng nhập đúng định dạng email.';
  if (raw.includes('Password must be')) return 'Mật khẩu phải có từ 8 ký tự trở lên.';
  if (raw.includes('unavailable')) return 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.';
  return raw || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.';
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, isLoggedIn, loading: authLoading } = useAuth();

  // If already logged in, redirect
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email.trim(), password);

      // Push welcome toast
      pushToast({
        title: 'Đăng nhập thành công!',
        message: `Chào mừng bạn trở lại, ${email.trim()}. Hãy xem thị trường hôm nay!`,
        type: 'success',
        icon: '👋',
      });

      router.push("/dashboard");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setError(translateLoginError(raw));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center fade-in px-4 sm:px-6 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3 transition-transform duration-200 hover:scale-105">
            <Image
              src="/logo-emblem.png"
              alt="FinPilot Logo"
              width={80}
              height={56}
              className="h-16 w-auto mx-auto object-contain drop-shadow-[0_4px_20px_rgba(59,130,246,0.35)]"
              priority
            />
          </Link>
          <h1 className="text-2xl font-bold">Đăng nhập</h1>
          <p className="text-sm text-muted-foreground mt-1">Đăng nhập để theo dõi watchlist và nhận phân tích AI</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4">
          {error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-xl">{error}</div>}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input className="input" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required id="login-email" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Mật khẩu</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required id="login-password" />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading || authLoading} id="login-submit">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản? <a href="/register" className="text-primary hover:underline">Đăng ký</a>
          </p>
        </form>
      </div>
    </div>
  );
}

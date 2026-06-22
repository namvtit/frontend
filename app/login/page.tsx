"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { pushToast } from "@/components/ui/toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, isLoggedIn } = useAuth();

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
      // Validate against stored accounts in localStorage
      const accounts = JSON.parse(localStorage.getItem("pisi_accounts") || "[]");
      const account = accounts.find((a: { email: string; passwordHash: string }) => a.email === email);

      if (!account) {
        setError("Email chưa được đăng ký. Vui lòng đăng ký tài khoản mới.");
        setLoading(false);
        return;
      }

      // Check password (demo: base64 comparison — do not use for real auth)
      const inputHash = btoa(password);
      if (inputHash !== account.passwordHash) {
        setError("Mật khẩu không đúng. Vui lòng thử lại.");
        setLoading(false);
        return;
      }

      await login(email, password);

      // Push welcome toast
      pushToast({
        title: 'Đăng nhập thành công!',
        message: `Chào mừng bạn trở lại, ${account.name}. Hãy xem thị trường hôm nay!`,
        type: 'success',
        icon: '👋',
      });

      router.push("/dashboard");
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
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
          <button type="submit" className="btn btn-primary w-full" disabled={loading} id="login-submit">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
          <div className="text-center text-xs text-muted-foreground bg-muted/30 rounded-lg py-2">
            Demo: <span className="font-mono">demo@finpilot.com</span> / <span className="font-mono">demo1234</span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản? <a href="/register" className="text-primary hover:underline">Đăng ký</a>
          </p>
        </form>
      </div>
    </div>
  );
}

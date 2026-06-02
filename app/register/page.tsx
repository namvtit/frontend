"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { window.location.href = "/dashboard"; }, 800);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
          <p className="text-sm text-muted-foreground mt-1">Tham gia PISI Markets để theo dõi thị trường thông minh</p>
        </div>

        <form onSubmit={handleRegister} className="card space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Họ tên (tùy chọn)</label>
            <input className="input" type="text" placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} id="register-name" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input className="input" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required id="register-email" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Mật khẩu</label>
            <input className="input" type="password" placeholder="Tối thiểu 6 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} required id="register-password" />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading} id="register-submit">
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

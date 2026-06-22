"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Settings,
  Cpu,
  Shield,
  Globe,
  Users,
  Layers,
  ChevronDown,
  ChevronRight,
  Check,
  Sliders,
  Database,
  Lock,
  BarChart3,
  Zap,
  ArrowRight,
  Code,
  RefreshCcw,
  Bell,
  Palette,
  FileText,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   B2B ENTERPRISE PAGE — FinPilot for Business
   ═══════════════════════════════════════════════ */

/* ── Mock enterprise config state ── */
const DEFAULT_CONFIG = {
  riskModel: "var-monte-carlo",
  dataFeed: "realtime-premium",
  alertThreshold: 5,
  maxPositionSize: 25,
  autoRebalance: true,
  complianceMode: "sec-standard",
  apiRateLimit: 1000,
  whiteLabel: false,
  ssoProvider: "saml",
  dataRetention: 365,
  aiModel: "gpt-4o",
  sentimentSource: "multi-source",
};

const RISK_MODELS = [
  { id: "var-monte-carlo", name: "VaR Monte Carlo", desc: "Mô hình hóa hàng nghìn kịch bản thị trường" },
  { id: "var-historical", name: "VaR Historical", desc: "Dựa trên phân bổ lợi suất lịch sử" },
  { id: "cvar-expected", name: "CVaR / Expected Shortfall", desc: "Đo lường rủi ro đuôi phân phối" },
  { id: "custom-factor", name: "Custom Factor Model", desc: "Mô hình đa nhân tố tùy chỉnh" },
];

const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", desc: "Mô hình mạnh nhất, phân tích sâu" },
  { id: "claude-sonnet", name: "Claude Sonnet", desc: "Cân bằng tốc độ và chất lượng" },
  { id: "gemini-pro", name: "Gemini Pro", desc: "Phân tích multimodal, xử lý biểu đồ" },
  { id: "custom-finetuned", name: "Custom Fine-tuned", desc: "Mô hình riêng đã fine-tune cho DN" },
];

const DATA_FEEDS = [
  { id: "realtime-premium", name: "Real-time Premium", latency: "< 50ms" },
  { id: "realtime-standard", name: "Real-time Standard", latency: "< 200ms" },
  { id: "delayed-15m", name: "Delayed (15 min)", latency: "15 phút" },
];

const COMPLIANCE_MODES = [
  { id: "sec-standard", name: "SEC Standard" },
  { id: "mifid-ii", name: "MiFID II (EU)" },
  { id: "sfc-hk", name: "SFC (Hong Kong)" },
  { id: "custom-vn", name: "SSC Vietnam" },
];

const SSO_PROVIDERS = [
  { id: "saml", name: "SAML 2.0" },
  { id: "oauth2", name: "OAuth 2.0 / OIDC" },
  { id: "azure-ad", name: "Azure AD" },
  { id: "okta", name: "Okta" },
];

const ENTERPRISE_CLIENTS = [
  { name: "VPBank Securities", sector: "Chứng khoán" },
  { name: "Techcombank Capital", sector: "Ngân hàng" },
  { name: "Dragon Capital", sector: "Quỹ đầu tư" },
  { name: "Manulife Vietnam", sector: "Bảo hiểm" },
  { name: "FPT Capital", sector: "Công nghệ" },
  { name: "VinFast Financial", sector: "Tập đoàn" },
];

const ENTERPRISE_FEATURES = [
  {
    icon: <Cpu className="w-6 h-6" />,
    title: "AI Model Configuration",
    desc: "Chọn và tinh chỉnh mô hình AI cho từng use case: phân tích kỹ thuật, sentiment, dự báo.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: <Sliders className="w-6 h-6" />,
    title: "Quản lý rủi ro tùy chỉnh",
    desc: "Cấu hình mô hình VaR, CVaR, position limits, và cảnh báo biến động theo ngưỡng riêng.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: "Data Feed & API",
    desc: "Kết nối đến nguồn dữ liệu real-time, REST/WebSocket API, webhook tự động hóa.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Compliance & Audit",
    desc: "Tuân thủ SEC, MiFID II, SSC Vietnam. Audit log đầy đủ, báo cáo theo yêu cầu.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Team Management",
    desc: "SSO/SAML, phân quyền RBAC, quản lý nhóm trader với vai trò và giới hạn riêng.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: "White-label Platform",
    desc: "Tùy chỉnh giao diện, logo, domain riêng. Triển khai nền tảng mang thương hiệu của bạn.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
];

/* ── Collapsible Config Section ── */
function ConfigSection({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-primary">{icon}</span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge && <span className="badge badge-demo text-[10px]">{badge}</span>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 py-4 border-t border-border space-y-4">{children}</div>}
    </div>
  );
}

/* ── Toggle Switch ── */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

/* ── Slider with value ── */
function RangeSlider({ label, value, onChange, min, max, unit, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit: string; step?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-sm font-mono font-semibold text-primary">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ── Select Dropdown ── */
function SelectBox({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { id: string; name: string; desc?: string; latency?: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              value === opt.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-background hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${value === opt.id ? "text-primary" : "text-foreground"}`}>{opt.name}</p>
                {opt.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>}
              </div>
              <div className="flex items-center gap-2">
                {opt.latency && <span className="text-[10px] font-mono text-muted-foreground">{opt.latency}</span>}
                {value === opt.id && <Check className="w-4 h-4 text-primary" />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════ */
export default function EnterprisePage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<"config" | "preview">("config");
  const [saved, setSaved] = useState(false);

  const updateConfig = <K extends keyof typeof DEFAULT_CONFIG>(key: K, value: typeof DEFAULT_CONFIG[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background fade-in pb-20">
      {/* ═══ HERO SECTION ═══ */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 25% 50%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 20%, rgba(139,92,246,0.2) 0%, transparent 50%)",
        }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/10 mb-6">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-300 tracking-wide uppercase">Enterprise Solutions</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Nền tảng tài chính
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  cho doanh nghiệp
                </span>
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-xl">
                Triển khai nền tảng phân tích tài chính AI chuyên dụng cho tổ chức của bạn.
                Cấu hình mô hình rủi ro, tùy chỉnh AI, quản lý team — tất cả trong một nơi.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#config" className="btn bg-white text-slate-900 font-semibold hover:bg-slate-100 px-6 py-3 text-base">
                  Bắt đầu cấu hình <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#contact" className="btn border border-white/20 text-white hover:bg-white/10 px-6 py-3 text-base backdrop-blur">
                  Liên hệ Sales <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right: Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Doanh nghiệp tin tưởng", value: "Sắp ra mắt", icon: <Building2 className="w-5 h-5" />, status: "Beta" },
                { label: "Mục tiêu API Uptime SLA", value: "99.95%", icon: <Globe className="w-5 h-5" />, status: "Dự kiến" },
                { label: "Tài sản được quản lý", value: "Sắp ra mắt", icon: <BarChart3 className="w-5 h-5" />, status: "Thử nghiệm" },
                { label: "Độ trễ trung bình", value: "< 50ms", icon: <Zap className="w-5 h-5" />, status: "Kỳ vọng" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-5 relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="text-indigo-400">{stat.icon}</div>
                    <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {stat.status}
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CLIENT LOGOS ═══ */}
      <section className="border-b border-border py-10 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-center text-muted-foreground uppercase tracking-widest font-semibold mb-6">
            Tương thích cấu trúc dữ liệu của các tổ chức tài chính hàng đầu
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
            {ENTERPRISE_CLIENTS.map((client) => (
              <div key={client.name} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <p className="text-[10px] text-muted-foreground text-center font-medium leading-tight">{client.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES GRID ═══ */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Tính năng Enterprise</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Mọi công cụ mà tổ chức tài chính cần — từ cấu hình AI đến compliance, tất cả đều có thể tùy chỉnh.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ENTERPRISE_FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONFIGURATION CONSOLE ═══ */}
      <section id="config" className="py-16 px-4 bg-muted/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Settings className="w-7 h-7 text-primary" />
                Enterprise Console
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Cấu hình platform cho tổ chức của bạn. Thay đổi được áp dụng ngay lập tức.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Tab: Config / Preview */}
              <div className="tab-list">
                <button className={`tab-item ${activeTab === "config" ? "active" : ""}`} onClick={() => setActiveTab("config")}>
                  <Settings className="w-3.5 h-3.5 inline mr-1" /> Cấu hình
                </button>
                <button className={`tab-item ${activeTab === "preview" ? "active" : ""}`} onClick={() => setActiveTab("preview")}>
                  <Code className="w-3.5 h-3.5 inline mr-1" /> API Preview
                </button>
              </div>
              <button onClick={handleSave} className={`btn text-sm ${saved ? "bg-emerald-500 text-white" : "btn-primary"}`}>
                {saved ? (
                  <><Check className="w-4 h-4" /> Đã lưu</>
                ) : (
                  <><RefreshCcw className="w-4 h-4" /> Lưu cấu hình</>
                )}
              </button>
            </div>
          </div>

          {activeTab === "config" ? (
            <div className="grid lg:grid-cols-2 gap-5">
              {/* ── Left Column ── */}
              <div className="space-y-4">
                <ConfigSection title="AI Model" icon={<Cpu className="w-4 h-4" />} badge="Core" defaultOpen>
                  <SelectBox label="Mô hình phân tích AI" value={config.aiModel} onChange={(v) => updateConfig("aiModel", v)} options={AI_MODELS} />
                  <SelectBox label="Nguồn dữ liệu Sentiment" value={config.sentimentSource} onChange={(v) => updateConfig("sentimentSource", v)} options={[
                    { id: "multi-source", name: "Multi-source (Tin tức + MXH + Forum)", desc: "Tổng hợp đa nguồn" },
                    { id: "news-only", name: "News Only", desc: "Chỉ tin tức chính thống" },
                    { id: "social-heavy", name: "Social-weighted", desc: "Trọng số cao cho mạng xã hội" },
                  ]} />
                </ConfigSection>

                <ConfigSection title="Mô hình quản lý rủi ro" icon={<Shield className="w-4 h-4" />} badge="Risk">
                  <SelectBox label="Phương pháp đo lường rủi ro" value={config.riskModel} onChange={(v) => updateConfig("riskModel", v)} options={RISK_MODELS} />
                  <RangeSlider label="Ngưỡng cảnh báo biến động" value={config.alertThreshold} onChange={(v) => updateConfig("alertThreshold", v)} min={1} max={20} unit="%" />
                  <RangeSlider label="Position Size tối đa" value={config.maxPositionSize} onChange={(v) => updateConfig("maxPositionSize", v)} min={5} max={100} unit="%" step={5} />
                  <Toggle label="Tự động tái cân bằng danh mục" checked={config.autoRebalance} onChange={(v) => updateConfig("autoRebalance", v)} />
                </ConfigSection>

                <ConfigSection title="Dữ liệu & API" icon={<Database className="w-4 h-4" />}>
                  <SelectBox label="Data Feed" value={config.dataFeed} onChange={(v) => updateConfig("dataFeed", v)} options={DATA_FEEDS} />
                  <RangeSlider label="API Rate Limit" value={config.apiRateLimit} onChange={(v) => updateConfig("apiRateLimit", v)} min={100} max={10000} unit=" req/min" step={100} />
                  <RangeSlider label="Lưu trữ dữ liệu" value={config.dataRetention} onChange={(v) => updateConfig("dataRetention", v)} min={30} max={1825} unit=" ngày" step={30} />
                </ConfigSection>
              </div>

              {/* ── Right Column ── */}
              <div className="space-y-4">
                <ConfigSection title="Compliance & Bảo mật" icon={<Lock className="w-4 h-4" />} badge="Security" defaultOpen>
                  <SelectBox label="Tiêu chuẩn Compliance" value={config.complianceMode} onChange={(v) => updateConfig("complianceMode", v)} options={COMPLIANCE_MODES} />
                  <SelectBox label="SSO Provider" value={config.ssoProvider} onChange={(v) => updateConfig("ssoProvider", v)} options={SSO_PROVIDERS} />
                </ConfigSection>

                <ConfigSection title="Giao diện & Thương hiệu" icon={<Palette className="w-4 h-4" />}>
                  <Toggle label="White-label (Custom branding)" checked={config.whiteLabel} onChange={(v) => updateConfig("whiteLabel", v)} />
                  {config.whiteLabel && (
                    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-dashed border-border">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Tên thương hiệu</label>
                        <input className="input" placeholder="VD: VPBank Trading Platform" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Custom Domain</label>
                        <input className="input" placeholder="VD: trading.vpbank.com.vn" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Primary Color</label>
                        <div className="flex gap-2">
                          {["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map((c) => (
                            <button key={c} className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-white/50 transition-all" style={{ background: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </ConfigSection>

                <ConfigSection title="Thông báo & Webhook" icon={<Bell className="w-4 h-4" />}>
                  <Toggle label="Email Alerts" checked={true} onChange={() => {}} />
                  <Toggle label="Slack Integration" checked={false} onChange={() => {}} />
                  <Toggle label="Webhook Notifications" checked={true} onChange={() => {}} />
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Webhook URL</label>
                    <input className="input font-mono text-xs" placeholder="https://api.your-company.com/webhooks/pisi" />
                  </div>
                </ConfigSection>

                {/* Live status card */}
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" /> Trạng thái hệ thống
                    </h4>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Hoạt động bình thường
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: "API Gateway", status: "Operational", latency: "23ms" },
                      { name: "Data Pipeline", status: "Operational", latency: "45ms" },
                      { name: "AI Inference", status: "Operational", latency: "120ms" },
                      { name: "WebSocket Feed", status: "Operational", latency: "12ms" },
                    ].map((s) => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-foreground">{s.name}</span>
                        </div>
                        <span className="font-mono text-muted-foreground">{s.latency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── API Preview Tab ── */
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Configuration JSON</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(config, null, 2))}
                  className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Copy to clipboard
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
                <code>{JSON.stringify(config, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* ═══ ENTERPRISE PRICING ═══ */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Enterprise Plans</h2>
            <p className="text-muted-foreground">Giải pháp linh hoạt, thanh toán theo quy mô sử dụng</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Startup",
                price: "$499",
                period: "/tháng",
                desc: "Cho đội nhóm nhỏ, quỹ đầu tư mới",
                features: ["Tối đa 10 users", "API 1,000 req/min", "1 AI Model", "Email support"],
                cta: "Bắt đầu dùng thử",
                style: "border-border",
              },
              {
                name: "Business",
                price: "$1,499",
                period: "/tháng",
                desc: "Cho CTCK, quỹ đầu tư vừa",
                features: ["Tối đa 50 users", "API 5,000 req/min", "3 AI Models", "SSO/SAML", "Dedicated CSM", "Custom reports"],
                cta: "Liên hệ Sales",
                style: "border-primary border-2 shadow-xl shadow-primary/10",
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                desc: "Cho tập đoàn tài chính lớn",
                features: ["Unlimited users", "API không giới hạn", "Custom AI fine-tuning", "On-premise option", "White-label", "24/7 Priority support", "Dedicated infrastructure"],
                cta: "Liên hệ tư vấn",
                style: "border-border",
              },
            ].map((plan) => (
              <div key={plan.name} className={`relative flex flex-col rounded-2xl border bg-card p-7 transition-transform hover:-translate-y-1 ${plan.style}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-0 right-0 mx-auto w-max px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                    Phổ biến nhất
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`btn w-full ${plan.popular ? "btn-primary" : "btn-secondary"}`}>{plan.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA / CONTACT ═══ */}
      <section id="contact" className="py-16 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-10 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "radial-gradient(circle at 30% 40%, rgba(99,102,241,0.4) 0%, transparent 60%)",
            }} />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Sẵn sàng nâng cấp tổ chức của bạn?
              </h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-8">
                Đội ngũ chuyên gia của FinPilot sẽ giúp bạn triển khai nền tảng phân tích tài chính phù hợp nhất.
                Trải nghiệm miễn phí 30 ngày.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button className="btn bg-white text-slate-900 font-semibold hover:bg-slate-100 px-8 py-3 text-base">
                  <FileText className="w-4 h-4" /> Đăng ký tư vấn
                </button>
                <button className="btn border border-white/20 text-white hover:bg-white/10 px-8 py-3 text-base backdrop-blur">
                  <HelpCircle className="w-4 h-4" /> Tải whitepaper
                </button>
              </div>
              <p className="mt-6 text-xs text-slate-500">
                Hoặc gọi trực tiếp: <span className="text-slate-300 font-semibold">+84 28 3820 XXXX</span> • sales@pisimarkets.vn
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Check, Sparkles, Zap, Shield } from "lucide-react";

const PLANS = [
  {
    name: "Cơ bản",
    description: "Dành cho người mới bắt đầu tìm hiểu thị trường",
    price: "Miễn phí",
    period: "mãi mãi",
    icon: <Shield className="w-6 h-6 text-indigo-500" />,
    features: [
      "Dữ liệu thị trường (độ trễ 15 phút)",
      "Theo dõi tối đa 10 mã cổ phiếu",
      "Đọc tin tức tổng hợp",
      "Hỏi đáp AI cơ bản (5 câu/ngày)",
    ],
    buttonText: "Bắt đầu ngay",
    buttonClass: "btn w-full bg-secondary text-foreground hover:bg-secondary/80",
    popular: false,
  },
  {
    name: "Pro",
    description: "Dành cho nhà đầu tư chủ động & chuyên nghiệp",
    price: "199.000đ",
    period: "/tháng",
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    features: [
      "Dữ liệu Real-time (thời gian thực)",
      "Không giới hạn Watchlist",
      "Biểu đồ phân tích kỹ thuật nâng cao",
      "Trợ lý AI thông minh (Không giới hạn)",
      "Cảnh báo giá & tin tức qua Email/SMS",
      "Bộ lọc thị trường chuyên sâu",
    ],
    buttonText: "Nâng cấp Pro",
    buttonClass: "btn w-full btn-primary",
    popular: true,
  },
  {
    name: "Elite",
    description: "Giải pháp toàn diện cho tổ chức và quỹ đầu tư",
    price: "499.000đ",
    period: "/tháng",
    icon: <Sparkles className="w-6 h-6 text-emerald-500" />,
    features: [
      "Tất cả tính năng của gói Pro",
      "Truy cập API dữ liệu thị trường",
      "Webhook cảnh báo tự động hóa",
      "Báo cáo phân tích chuyên sâu (Weekly)",
      "Hỗ trợ ưu tiên 24/7 1-kèm-1",
    ],
    buttonText: "Liên hệ ngay",
    buttonClass: "btn w-full bg-emerald-500 text-white hover:bg-emerald-600",
    popular: false,
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-background fade-in pb-20">
      {/* Header */}
      <section className="py-20 px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Chọn gói dịch vụ phù hợp với bạn
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            Trải nghiệm nền tảng đầu tư thông minh với dữ liệu thời gian thực và trợ lý AI đắc lực.
          </p>

          {/* Toggle Billing */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>Thanh toán hàng tháng</span>
            <button 
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus:outline-none"
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Thanh toán hàng năm <span className="ml-1 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">-20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map((plan, i) => (
              <div 
                key={plan.name} 
                className={`relative flex flex-col rounded-3xl p-8 transition-transform hover:-translate-y-1 ${
                  plan.popular 
                    ? "bg-card border-2 border-primary shadow-xl shadow-primary/10" 
                    : "bg-card border border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-max px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                    Phổ biến nhất
                  </div>
                )}
                
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price === "Miễn phí" ? plan.price : (isAnnual ? (parseInt(plan.price.replace(/\D/g,'')) * 0.8).toLocaleString('vi-VN') + "đ" : plan.price)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">{plan.period}</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-foreground">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={plan.buttonClass}>
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ or Trust Section */}
      <section className="mt-20 px-4 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">Bạn còn câu hỏi?</h2>
          <p className="text-muted-foreground text-sm mb-6">Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
          <button className="text-primary hover:underline font-medium">Trò chuyện với chuyên viên hỗ trợ →</button>
        </div>
      </section>
    </div>
  );
}

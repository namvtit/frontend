'use client';

import { NEWS, INDICES } from '@/lib/market/mock-data';
import Link from 'next/link';

const BREAKING_NEWS = [
  { label: 'BREAKING', text: 'NVIDIA lập kỷ lục vốn hóa $5.15T, siêu chip Blackwell GB200 cháy hàng tới hết 2027', sentiment: 'bullish' as const },
  { label: 'MACRO', text: 'Fed giữ nguyên lãi suất 5.25% - 5.50% — chờ đợi thêm tín hiệu từ lạm phát', sentiment: 'neutral' as const },
  { label: 'CẢNH BÁO', text: 'Tesla triệu hồi 200,000 xe do lỗi Autopilot — NHTSA mở điều tra', sentiment: 'bearish' as const },
  { label: 'AI INSIGHT', text: 'Apple tăng tốc tích hợp Apple Intelligence sâu vào chip M-series và iOS', sentiment: 'bullish' as const },
  { label: 'NÓNG', text: 'Giá dầu WTI lao dốc 3.2% sau báo cáo tồn kho bất ngờ tăng vọt', sentiment: 'bearish' as const },
  { label: 'DOANH NGHIỆP', text: 'Berkshire Hathaway nắm giữ 180 tỷ USD tiền mặt, kiên nhẫn chờ cơ hội', sentiment: 'neutral' as const },
  { label: 'BREAKING', text: 'Bitcoin phá đỉnh $100,000 lần đầu tiên trong lịch sử tài chính số', sentiment: 'bullish' as const },
  { label: 'CẢNH BÁO', text: 'Meta đối mặt điều tra quy định mới về cạnh tranh tại Liên minh Châu Âu', sentiment: 'bearish' as const },
  { label: 'VIỆC LÀM', text: 'Báo cáo việc làm Mỹ đạt 175k sát dự báo — củng cố kịch bản hạ cánh mềm', sentiment: 'neutral' as const },
  { label: 'TÂM LÝ', text: 'Khối quỹ ETF toàn cầu mua ròng kỷ lục $8.5B vào nhóm cổ phiếu tăng trưởng', sentiment: 'bullish' as const },
  { label: 'THANH TOÁN', text: 'Khối lượng giao dịch thẻ Visa tăng 8% — chi tiêu tiêu dùng toàn cầu ổn định', sentiment: 'neutral' as const },
  { label: 'CẢNH BÁO', text: 'UnitedHealth chịu áp lực chi phí y tế gia tăng — kéo lùi nhóm bảo hiểm', sentiment: 'bearish' as const },
];

// Triple the items for seamless infinite scroll
const scrollItems = [...BREAKING_NEWS, ...BREAKING_NEWS, ...BREAKING_NEWS];

function SentimentDot({ sentiment }: { sentiment: 'bullish' | 'bearish' | 'neutral' }) {
  const color = sentiment === 'bullish'
    ? 'bg-emerald-500'
    : sentiment === 'bearish'
      ? 'bg-red-500'
      : 'bg-amber-500';
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

export function NewsTicker() {
  return (
    <div className="hidden md:block w-full border-t border-border bg-card/80 backdrop-blur-sm overflow-hidden news-ticker-bar">
      <div className="flex items-center h-9">
        {/* LIVE badge — fixed left with gradient fade */}
        <div className="relative z-10 flex items-center gap-1.5 pl-4 pr-5 border-r border-border shrink-0 h-full bg-card">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
          </span>
          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Live</span>
          {/* Gradient fade to mask scroll overlap */}
          <div className="absolute right-0 top-0 bottom-0 w-4 translate-x-full bg-gradient-to-r from-card to-transparent pointer-events-none" />
        </div>

        {/* Scrolling news */}
        <div className="overflow-hidden flex-1">
          <div className="news-ticker-scroll flex gap-10 px-6 whitespace-nowrap">
          {scrollItems.map((item, idx) => (
            <div
              key={`news-${idx}`}
              className="flex items-center gap-2 text-sm"
            >
              <SentimentDot sentiment={item.sentiment} />
              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                item.label === 'BREAKING' || item.label === 'NÓNG'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : item.label === 'CẢNH BÁO'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : item.label === 'TÂM LÝ'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : item.label === 'AI INSIGHT'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'bg-primary/10 text-primary'
              }`}>
                {item.label}
              </span>
              <span className="text-foreground/90 font-medium">{item.text}</span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

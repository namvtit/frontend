// ── Market Events for Replay ──
// Deterministic event definitions with historical/simulated labels

import type { ReplaySeed } from './types';

export type EventSourceType = 'historical' | 'simulated';

export interface MarketEvent {
  id: string;
  date: string; // ISO date string
  type: 'price' | 'news';
  sourceType: EventSourceType;
  title: string;
  headline?: string;
  affectedSymbols: string[];
  affectedSectors: string[];
  explanation: string;
  suggestedActionTemplates: string[];
}

// Helper to generate event ID
function eventId(date: string, index: number): string {
  return `event_${date}_${index}`;
}

// ── Price volatility events ──

const PRICE_VOLATILITY_EVENTS: Record<ReplaySeed, MarketEvent[]> = {
  golden: [
    // Late January 2025: AI/semiconductor volatility
    {
      id: eventId('2025-01-28', 1),
      date: '2025-01-28',
      type: 'price',
      sourceType: 'simulated',
      title: 'Biến động bán tháo ngắn hạn',
      affectedSymbols: ['NVDA', 'AMD', 'AVGO'],
      affectedSectors: ['Technology'],
      explanation: 'Cổ phiếu bán dẫn AI chịu áp lực chốt lời ngắn hạn sau đợt tăng mạnh. Đây là biến động kỹ thuật thông thường, không phải tín hiệu xu hướng dài hạn thay đổi.',
      suggestedActionTemplates: [
        'Giữ nguyên vị thế nếu có tầm nhìn dài hạn',
        'Cân nhắc mua thêm nếu muốn trung bình giá',
        'Giảm tỷ trọng nếu cần bảo toàn vốn',
      ],
    },
    // Mid-March 2025: Sector rotation
    {
      id: eventId('2025-03-15', 2),
      date: '2025-03-15',
      type: 'price',
      sourceType: 'simulated',
      title: 'Điều chỉnh cơ cấu ngành',
      affectedSymbols: ['AAPL', 'MSFT', 'GOOGL'],
      affectedSectors: ['Technology'],
      explanation: 'Thị trường chứng khoán điều chỉnh nhẹ khi nhà đầu tư chốt lời ở một số cổ phiếu công nghệ lớn. Dòng tiền có xu hướng chảy sang các ngành phòng thủ.',
      suggestedActionTemplates: [
        'Cân nhắc chuyển một phần sang cổ phiếu phòng thủ',
        'Giữ nguyên danh mục công nghệ nếu tin vào xu hướng dài hạn',
        'Tái cân bằng danh mục về target allocation',
      ],
    },
    // Late April 2025: Recovery momentum
    {
      id: eventId('2025-04-22', 3),
      date: '2025-04-22',
      type: 'price',
      sourceType: 'simulated',
      title: 'Đà phục hồi mạnh mẽ',
      affectedSymbols: ['SPY', 'AAPL', 'MSFT', 'NVDA'],
      affectedSectors: ['Technology', 'Defensives'],
      explanation: 'Thị trường bắt đầu phục hồi sau giai đoạn điều chỉnh. Các cổ phiếu chất lượng cao dẫn đầu đà tăng. Đây có thể là thời điểm tốt để đánh giá lại danh mục.',
      suggestedActionTemplates: [
        'Cân nhắc chốt lời một phần các vị thế đã tăng mạnh',
        'Tái cân bằng danh mục',
        'Giữ nguyên để tận dụng đà tăng',
      ],
    },
  ],
  resilience: [
    // Early January 2025: Initial shock
    {
      id: eventId('2025-01-15', 1),
      date: '2025-01-15',
      type: 'price',
      sourceType: 'simulated',
      title: 'Áp lực bán ban đầu',
      affectedSymbols: ['NVDA', 'TSLA', 'META'],
      affectedSectors: ['Technology'],
      explanation: 'Thị trường chứng khoán bắt đầu năm mới với áp lực bán đáng kể. Cổ phiếu công nghệ và growth chịu ảnh hưởng nặng nề nhất trong giai đoạn này.',
      suggestedActionTemplates: [
        'Xem xét giảm tỷ trọng cổ phiếu rủi ro cao',
        'Tăng tiền mặt dự phòng',
        'Giữ nguyên nếu có khẩu vị rủi ro cao',
      ],
    },
    // Mid-February 2025: Continued weakness
    {
      id: eventId('2025-02-18', 2),
      date: '2025-02-18',
      type: 'price',
      sourceType: 'simulated',
      title: 'Thị trường tiếp tục yếu',
      affectedSymbols: ['TSLA', 'NVDA', 'AMD'],
      affectedSectors: ['Technology'],
      explanation: 'Sau đợt bán ban đầu, thị trường tiếp tục yếu. Biến động cao khiến nhiều nhà đầu tư hoảng sợ. Tuy nhiên, đây có thể là cơ hội cho người có tầm nhìn dài hạn.',
      suggestedActionTemplates: [
        'Tránh bán hoảng loạn',
        'Cân nhắc mua có kiểm soát nếu điều kiện tài chính cho phép',
        'Tăng tỷ trọng tiền mặt nếu cần an toàn',
      ],
    },
    // Late April 2025: Recovery signs
    {
      id: eventId('2025-04-25', 3),
      date: '2025-04-25',
      type: 'price',
      sourceType: 'simulated',
      title: 'Dấu hiệu phục hồi',
      affectedSymbols: ['SPY', 'JPM', 'JNJ'],
      affectedSectors: ['Financials', 'Healthcare', 'Defensives'],
      explanation: 'Thị trường bắt đầu cho thấy dấu hiệu ổn định. Các cổ phiếu phòng thủ và tài chính dẫn dắt. Cần theo dõi để xác nhận xu hướng.',
      suggestedActionTemplates: [
        'Theo dõi thêm trước khi hành động',
        'Cân nhắc tăng tỷ trọng cổ phiếu chất lượng',
        'Giữ nguyên chiến lược phòng thủ',
      ],
    },
  ],
};

// ── News events ──

const NEWS_EVENTS: Record<ReplaySeed, MarketEvent[]> = {
  golden: [
    // DeepSeek-related market uncertainty (late January 2025)
    {
      id: eventId('2025-01-28', 1),
      date: '2025-01-28',
      type: 'news',
      sourceType: 'historical',
      title: 'DeepSeek khiến thị trường chao đảo',
      headline: 'Mô hình AI mới từ Trung Quốc làm dấy lên lo ngại về chi phí phát triển AI',
      affectedSymbols: ['NVDA', 'AMD', 'MSFT'],
      affectedSectors: ['Technology'],
      explanation: 'Sự xuất hiện của mô hình AI mới từ DeepSeek làm dấy lên câu hỏi về chi phí phát triển trí tuệ nhân tạo. Nhiều nhà đầu tư lo ngại về tác động đến các công ty chip và cloud computing. Tuy nhiên, đây chỉ là tin tức và không phải là tín hiệu mua/bán tự động.',
      suggestedActionTemplates: [
        'Không vội đưa ra quyết định dựa trên tin tức ngắn hạn',
        'Đánh giá lại các yếu tố cơ bản của doanh nghiệp',
        'Theo dõi thêm diễn biến trong vài ngày tới',
      ],
    },
    // April 2025 tariff-pause relief rally
    {
      id: eventId('2025-04-10', 2),
      date: '2025-04-10',
      type: 'news',
      sourceType: 'simulated',
      title: 'Tin tức về thuế quan tích cực',
      headline: 'Đàm phán thương mại mang lại lạc quan ngắn hạn',
      affectedSymbols: ['SPY', 'AAPL', 'MSFT'],
      affectedSectors: ['Technology', 'Industrials'],
      explanation: 'Tin tức về khả năng hoãn hoặc giảm thuế quan làm thị trường phục hồi mạnh. Tuy nhiên, vẫn còn nhiều bất định và tin tức này không đảm bảo xu hướng tăng dài hạn.',
      suggestedActionTemplates: [
        'Không nên mua vào chỉ vì tin tức tích cực ngắn hạn',
        'Cân nhắc chốt lời một phần nếu có lãi',
        'Đánh giá lại chiến lược dài hạn',
      ],
    },
  ],
  resilience: [
    // Same DeepSeek news
    {
      id: eventId('2025-01-28', 1),
      date: '2025-01-28',
      type: 'news',
      sourceType: 'historical',
      title: 'DeepSeek khiến thị trường chao đảo',
      headline: 'Mô hình AI mới từ Trung Quốc làm dấy lên lo ngại về chi phí phát triển AI',
      affectedSymbols: ['NVDA', 'AMD', 'TSLA'],
      affectedSectors: ['Technology'],
      explanation: 'Tin tức về DeepSeek gây ra biến động mạnh. Với thị trường đang yếu, tin xấu bị phóng đại. Nhà đầu tư cần bình tĩnh đánh giá tình hình.',
      suggestedActionTemplates: [
        'Không bán hoảng loạn vì tin tức ngắn hạn',
        'Kiểm tra xem yếu tố cơ bản có thay đổi không',
        'Cân nhắc tăng tỷ trọng nếu có cơ hội',
      ],
    },
    // April 2025 tariff news
    {
      id: eventId('2025-04-10', 2),
      date: '2025-04-10',
      type: 'news',
      sourceType: 'simulated',
      title: 'Tin tức thuế quan tạo đà phục hồi',
      headline: 'Thị trường phục hồi nhờ đàm phán thương mại',
      affectedSymbols: ['JPM', 'CAT', 'BA'],
      affectedSectors: ['Financials', 'Industrials'],
      explanation: 'Tin tức tích cực về thuế quan giúp thị trường phục hồi nhưng vẫn còn nhiều rủi ro. Nhà đầu tư thận trọng nên đánh giá kỹ trước khi hành động.',
      suggestedActionTemplates: [
        'Theo dõi thêm trước khi hành động',
        'Cân nhắc tăng dần tỷ trọng cổ phiếu chất lượng',
        'Giữ một phần tiền mặt làm dự phòng',
      ],
    },
  ],
};

// ── All events combined ──

export function getEventsForReplay(seed: ReplaySeed): MarketEvent[] {
  const priceEvents = PRICE_VOLATILITY_EVENTS[seed];
  const newsEvents = NEWS_EVENTS[seed];

  // Sort by date
  const all = [...priceEvents, ...newsEvents];
  all.sort((a, b) => a.date.localeCompare(b.date));

  return all;
}

// Get events by date
export function getEventsByDate(seed: ReplaySeed, date: string): MarketEvent[] {
  return getEventsForReplay(seed).filter(e => e.date === date);
}

// Get events affecting a symbol
export function getEventsBySymbol(seed: ReplaySeed, symbol: string): MarketEvent[] {
  return getEventsForReplay(seed).filter(e => e.affectedSymbols.includes(symbol));
}

// Get checkpoint events (events that trigger decisions)
export function getCheckpointEvents(seed: ReplaySeed): MarketEvent[] {
  return getEventsForReplay(seed).filter(e => e.type === 'price' || e.type === 'news');
}

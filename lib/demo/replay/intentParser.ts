// ── Deterministic Intent Parser for Market Replay ──
// Local Vietnamese command parser — no external LLM required

import type { RiskProfile } from './types';

export interface TickerReplacement {
  from: string;
  to: string;
}

export interface ParsedIntent {
  type:
    | 'change_capital'
    | 'change_risk'
    | 'exclude_ticker'
    | 'prefer_sector'
    | 'replace_ticker'
    | 'sell_partial'
    | 'disagree'
    | 'continue'
    | 'pause'
    | 'skip'
    | 'reset'
    | 'restart'
    | 'accept_portfolio'
    | 'reject_portfolio'
    | 'modify_portfolio'
    | 'custom'
    | 'unknown';
  value?: string | number | TickerReplacement;
  rawMessage: string;
  confidence: number; // 0-1
}

// Capital amount patterns
const CAPITAL_PATTERNS: Array<{ regex: RegExp; value: number }> = [
  { regex: /25\s*triệu|25m|25000000/i, value: 25000000 },
  { regex: /50\s*triệu|50m|50000000/i, value: 50000000 },
  { regex: /100\s*triệu|100m|100000000/i, value: 100000000 },
  { regex: /250\s*triệu|250m|250000000/i, value: 250000000 },
  { regex: /(\d+)\s*m/i, value: -1 }, // placeholder for dynamic
];

// Risk change patterns
const RISK_UP_PATTERNS = [
  /tăng\s*rủi\s*ro|rủi\s*ro\s*cao\s*hơn|muốn\s*rủi\s*ro/i,
  /growth|aggressive|tăng\s*trưởng/i,
  /chấp\s*nhận\s*biến\s*động/i,
];

const RISK_DOWN_PATTERNS = [
  /giảm\s*rủi\s*ro|rủi\s*ro\s*thấp|an\s*toàn\s*hơn/i,
  /conservative|bảo\s*toàn/i,
  /thận\s*trọng/i,
];

// Sector preferences
const SECTOR_PATTERNS: Array<{ regex: RegExp; sector: string }> = [
  { regex: /công\s*nghệ|tech|it/i, sector: 'Technology' },
  { regex: /y\s*tế|sức\s*khỏe|health/i, sector: 'Healthcare' },
  { regex: /tài\s*chính|ngân\s*hàng|bank|finance/i, sector: 'Financials' },
  { regex: /năng\s*lượng|energy/i, sector: 'Energy' },
  { regex: /tiêu\s*dùng|consumer/i, sector: 'Consumer' },
  { regex: /công\s*nghiệp|industrial/i, sector: 'Industrials' },
  { regex: /truyền\s*thông|media|communication/i, sector: 'Communication' },
];

// Control commands
const CONTROL_PATTERNS = {
  continue: [/chạy\s*tiếp|tiep\s*tuc|tiếp\s*tục|run|continue|play/i],
  pause: [/tạm\s*dừng|dừng\s*lại|pause|stop/i],
  skip: [/bỏ\s*qua|skip|next/i],
  reset: [/reset|làm\s*lại|restart/i],
  restart: [/restart|bắt\s*đầu\s*lại/i],
};

// Accept/reject patterns
const ACCEPT_PATTERNS = [
  /đồng\s*ý|đồng\s*ý\s*với|accept|ok|okay|được|rõ|vâng/i,
  /bắt\s*đầu|start|begin/i,
  /xác\s*nhận|confirm/i,
];

const REJECT_PATTERNS = [
  /không\s*đồng\s*ý|từ\s*chối|reject|refuse|không/i,
  /thay\s*đổi|change|modify/i,
  /bán\s*bớt/i,
];

// Ticker exclude patterns
const EXCLUDE_PATTERNS = [
  /không\s*mua\s*([A-Z]{1,5})/i,
  /tránh\s*cổ\s*phiếu\s*([A-Z]{1,5})/i,
  /bỏ\s*([A-Z]{1,5})/i,
  /không\s*([A-Z]{1,5})/i,
];

// Ticker replace patterns
const REPLACE_PATTERNS = [
  /thay\s*([A-Z]{1,5})\s*bằng\s*([A-Z]{1,5})/i,
  /đổi\s*([A-Z]{1,5})\s*thành\s*([A-Z]{1,5})/i,
  /thay\s*thế\s*([A-Z]{1,5})\s*=\s*([A-Z]{1,5})/i,
];

// Parse user message and return structured intent
export function parseUserIntent(message: string): ParsedIntent {
  const msg = message.trim().toLowerCase();
  const raw = message.trim();

  // Check capital changes
  for (const { regex, value } of CAPITAL_PATTERNS) {
    if (regex.test(msg)) {
      // Handle "đổi vốn thành X triệu" pattern
      const fullMatch = msg.match(/(\d+)\s*(triệu|m|000000)/i);
      if (fullMatch && value === -1) {
        const num = parseInt(fullMatch[1]);
        return {
          type: 'change_capital',
          value: num * 1000000,
          rawMessage: raw,
          confidence: 0.95,
        };
      }
      if (value > 0) {
        return {
          type: 'change_capital',
          value,
          rawMessage: raw,
          confidence: 0.95,
        };
      }
    }
  }

  // Check risk increases
  for (const pattern of RISK_UP_PATTERNS) {
    if (pattern.test(msg)) {
      return {
        type: 'change_risk',
        value: 'growth',
        rawMessage: raw,
        confidence: 0.9,
      };
    }
  }

  // Check risk decreases
  for (const pattern of RISK_DOWN_PATTERNS) {
    if (pattern.test(msg)) {
      return {
        type: 'change_risk',
        value: 'conservative',
        rawMessage: raw,
        confidence: 0.9,
      };
    }
  }

  // Check sector preferences
  for (const { regex, sector } of SECTOR_PATTERNS) {
    if (regex.test(msg)) {
      if (msg.includes('ưu tiên') || msg.includes('thích') || msg.includes('muốn')) {
        return {
          type: 'prefer_sector',
          value: sector,
          rawMessage: raw,
          confidence: 0.85,
        };
      }
    }
  }

  // Check ticker exclusions
  for (const pattern of EXCLUDE_PATTERNS) {
    const match = msg.match(pattern);
    if (match && match[1]) {
      return {
        type: 'exclude_ticker',
        value: match[1].toUpperCase(),
        rawMessage: raw,
        confidence: 0.9,
      };
    }
  }

  // Check ticker replacements
  for (const pattern of REPLACE_PATTERNS) {
    const match = msg.match(pattern);
    if (match && match[1] && match[2]) {
      return {
        type: 'replace_ticker',
        value: { from: match[1].toUpperCase(), to: match[2].toUpperCase() },
        rawMessage: raw,
        confidence: 0.95,
      };
    }
  }

  // Check control commands
  for (const cmd of CONTROL_PATTERNS.continue) {
    if (cmd.test(msg)) {
      return { type: 'continue', rawMessage: raw, confidence: 0.95 };
    }
  }
  for (const cmd of CONTROL_PATTERNS.pause) {
    if (cmd.test(msg)) {
      return { type: 'pause', rawMessage: raw, confidence: 0.95 };
    }
  }
  for (const cmd of CONTROL_PATTERNS.skip) {
    if (cmd.test(msg)) {
      return { type: 'skip', rawMessage: raw, confidence: 0.95 };
    }
  }
  for (const cmd of CONTROL_PATTERNS.reset) {
    if (cmd.test(msg)) {
      return { type: 'reset', rawMessage: raw, confidence: 0.95 };
    }
  }
  for (const cmd of CONTROL_PATTERNS.restart) {
    if (cmd.test(msg)) {
      return { type: 'restart', rawMessage: raw, confidence: 0.95 };
    }
  }

  // Check accept/reject
  for (const pattern of ACCEPT_PATTERNS) {
    if (pattern.test(msg)) {
      return { type: 'accept_portfolio', rawMessage: raw, confidence: 0.85 };
    }
  }
  for (const pattern of REJECT_PATTERNS) {
    if (pattern.test(msg)) {
      return { type: 'reject_portfolio', rawMessage: raw, confidence: 0.85 };
    }
  }

  // Check for sell partial command
  if (/bán\s*bớt|bán\s*một\s*phần/i.test(msg)) {
    return { type: 'sell_partial', rawMessage: raw, confidence: 0.8 };
  }

  // Check for disagree
  if (/không\s*đồng\s*ý|không\s*được|tôi\s*không/i.test(msg)) {
    return { type: 'disagree', rawMessage: raw, confidence: 0.8 };
  }

  // Check for modify portfolio
  if (/thay\s*đổi\s*danh\s*mục|chỉnh\s*sửa|sửa\s*đổi/i.test(msg)) {
    return { type: 'modify_portfolio', rawMessage: raw, confidence: 0.8 };
  }

  // If no pattern matched, return as custom
  if (msg.length > 0) {
    return {
      type: 'custom',
      value: raw,
      rawMessage: raw,
      confidence: 0.5, // Lower confidence since it needs AI interpretation
    };
  }

  return { type: 'unknown', rawMessage: raw, confidence: 0 };
}

// Generate response message for parsed intent
export function generateIntentResponse(intent: ParsedIntent): string {
  switch (intent.type) {
    case 'change_capital':
      return `Đã ghi nhận: thay đổi vốn thành ${(Number(intent.value) / 1000000).toFixed(0)} triệu VNĐ.`;

    case 'change_risk':
      const riskLabel = intent.value === 'growth' ? 'tăng trưởng' : 'thận trọng';
      return `Đã ghi nhận: hồ sơ rủi ro → ${riskLabel}.`;

    case 'exclude_ticker':
      return `Đã ghi nhận: loại trừ ${intent.value} khỏi danh mục đề xuất.`;

    case 'prefer_sector':
      return `Đã ghi nhận: ưu tiên ngành ${intent.value}.`;

    case 'replace_ticker': {
      const replacement = intent.value as TickerReplacement;
      return `Đã ghi nhận: thay thế ${replacement.from} bằng ${replacement.to}.`;
    }

    case 'sell_partial':
      return 'Đã ghi nhận: muốn bán bớt một phần vị thế.';

    case 'disagree':
      return 'Đã ghi nhận. Bạn không đồng ý với khuyến nghị hiện tại.';

    case 'continue':
      return 'Tiếp tục mô phỏng...';

    case 'pause':
      return 'Đã tạm dừng mô phỏng.';

    case 'skip':
      return 'Bỏ qua quyết định hiện tại.';

    case 'reset':
      return 'Đang đặt lại mô phỏng...';

    case 'restart':
      return 'Khởi động lại mô phỏng...';

    case 'accept_portfolio':
      return 'Đã xác nhận chấp nhận danh mục đề xuất.';

    case 'reject_portfolio':
      return 'Đã từ chối danh mục hiện tại. Bạn muốn thay đổi điều gì?';

    case 'modify_portfolio':
      return 'Bạn muốn thay đổi gì trong danh mục?';

    case 'custom':
      return `Tôi đã nhận được: "${intent.value}". Để tôi phân tích...`;

    default:
      return 'Xin lỗi, tôi không hiểu ý của bạn. Bạn có thể nhắc lại được không?';
  }
}

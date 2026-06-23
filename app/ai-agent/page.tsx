"use client";
import { useState, useEffect, useCallback } from "react";
import { getMockAIResponse, SUGGESTED_PROMPTS, getMockDecisionFeedback, getMockAgentResponse } from "@/lib/ai/mock-agent";
import type {
  AIMessage,
  SimulationDecision,
  DecisionType,
  DecisionStatus,
  DecisionFeedback,
  DecisionRevision,
  DecisionHistoryEntry,
  DecisionChip,
} from "@/lib/ai/types";
import { useDemo } from "@/lib/demo";
import { getStockBySymbol, STOCKS } from "@/lib/market/mock-data";
import { pushToast } from "@/components/ui/toast";
import type { AgentResponse } from "@/lib/ai/agent/types";
import {
  Star,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  SkipForward,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  MessageSquarePlus,
} from "lucide-react";

// ── Draft Order ──

type DraftAction = "Buy" | "Sell" | "Hold" | "Watch";

interface DraftOrder {
  id: string;
  action: DraftAction;
  ticker: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  reason: string;
}

// Parse a free-text message into a DraftOrder if it contains a clear intent.
// Returns null if the message is a question or too vague.
function parseDraftOrder(
  msg: string,
  cashBalance: number,
  holdings: Record<string, { symbol: string; name: string; quantity: number; avgPrice: number }>,
  getPrice: (s: string) => number
): DraftOrder | null {
  const lower = msg.toLowerCase();

  const isBuy = /^(mua|buy)\b/i.test(lower);
  const isSell = /^bán|sell\b/i.test(lower);
  const isHold = /\bgiữ?\b|\bhold\b/i.test(lower);
  const isWatch = /\btheo\s*dõi|\bwatch\b|\bquan\s*sát\b/i.test(lower);
  const isReduceRisk = /giảm\s*rủi\s*ro|rủi\s*ro\s*thấp|an\s*toàn|thận\s*trọng/i.test(lower);

  // Extract ticker from known symbols
  const upper = msg.toUpperCase();
  const tickers = STOCKS.filter(
    (s) => upper.includes(s.symbol) || upper.includes(s.name.toUpperCase())
  );

  if (!isBuy && !isSell && !isHold && !isWatch) return null;

  if (isHold || isWatch || isReduceRisk) {
    if (isReduceRisk) {
      const firstTicker = tickers[0]?.symbol;
      if (!firstTicker) return null;
      const stock = getStockBySymbol(firstTicker);
      const price = getPrice(firstTicker) || stock?.price || 100;
      return {
        id: `draft_${Date.now()}`,
        action: "Hold",
        ticker: firstTicker,
        name: stock?.name ?? firstTicker,
        quantity: 0,
        price,
        total: 0,
        reason: "Giảm rủi ro: giữ nguyên vị thế, không mua thêm. Ưu tiên bảo toàn vốn.",
      };
    }
    if (tickers.length === 0) return null;
    const ticker = tickers[0].symbol;
    const stock = getStockBySymbol(ticker);
    const price = getPrice(ticker) || stock?.price || 100;
    return {
      id: `draft_${Date.now()}`,
      action: isHold ? "Hold" : "Watch",
      ticker,
      name: stock?.name ?? ticker,
      quantity: 0,
      price,
      total: 0,
      reason: isHold
        ? "Giữ nguyên vị thế — không có hành động cần thiết."
        : "Chuyển sang chế độ theo dõi — không mua vào lúc này.",
    };
  }

  if (tickers.length === 0) return null;
  const ticker = tickers[0].symbol;
  const stock = getStockBySymbol(ticker);
  const price = getPrice(ticker) || stock?.price || 100;
  const holding = holdings[ticker];

  if (isSell) {
    if (!holding || holding.quantity === 0) return null;
    const qty = Math.min(holding.quantity, Math.max(1, Math.floor(holding.quantity / 2)));
    const total = qty * price;
    return {
      id: `draft_${Date.now()}`,
      action: "Sell",
      ticker,
      name: holding.name,
      quantity: qty,
      price,
      total,
      reason: `Bán một phần vị thế ${ticker}: ${qty} cổ phiếu. Thu về ~$${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
    };
  }

  if (isBuy) {
    const budget = cashBalance * 0.10;
    const qty = Math.max(1, Math.floor(budget / price));
    const total = qty * price;
    if (total > cashBalance) return null;
    return {
      id: `draft_${Date.now()}`,
      action: "Buy",
      ticker,
      name: stock?.name ?? ticker,
      quantity: qty,
      price,
      total,
      reason: `Mua ${qty} cổ phiếu ${ticker} @ $${price.toFixed(2)} — ~10% cash. Tổng: $${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
    };
  }

  return null;
}

// ── Survey configuration ──

const SURVEY_QUESTIONS = [
  {
    key: "goal",
    text: "Chào mừng bạn đến với chương trình Khảo sát Phân bổ Đầu tư chuyên sâu từ AI! Câu hỏi 1: Mục tiêu đầu tư chính của bạn là gì?",
    chips: [
      { label: "Tăng trưởng tài sản nhanh", value: "growth" },
      { label: "Thu nhập dòng tiền ổn định (Cổ tức)", value: "income" },
      { label: "Bảo toàn vốn tối đa", value: "preservation" },
    ],
  },
  {
    key: "risk",
    text: "Câu hỏi 2: Khả năng chịu đựng biến động rủi ro thị trường của bạn ở mức nào?",
    chips: [
      { label: "Cao (Chấp nhận sụt giảm để đổi lại tăng trưởng lớn)", value: "high" },
      { label: "Trung bình (Muốn cân bằng rủi ro và tăng trưởng)", value: "medium" },
      { label: "Thấp (Yêu cầu an toàn cao nhất, không thích biến động)", value: "low" },
    ],
  },
  {
    key: "horizon",
    text: "Câu hỏi 3: Thời gian dự kiến bạn muốn duy trì khoản đầu tư này là bao lâu?",
    chips: [
      { label: "Ngắn hạn (Dưới 1 năm)", value: "short" },
      { label: "Trung hạn (1 đến 3 năm)", value: "medium" },
      { label: "Dài hạn (Trên 3 năm)", value: "long" },
    ],
  },
  {
    key: "capital",
    text: "Câu hỏi 4: Số vốn dự kiến bạn muốn phân bổ đầu tư là bao nhiêu?",
    chips: [
      { label: "Dưới $10,000 USD", value: "small" },
      { label: "$10,000 - $50,000 USD", value: "moderate" },
      { label: "Trên $50,000 USD", value: "large" },
    ],
  },
  {
    key: "sector",
    text: "Câu hỏi 5: Bạn quan tâm hoặc mong muốn đầu tư vào nhóm ngành nào nhất?",
    chips: [
      { label: "Công nghệ thông tin & Trí tuệ nhân tạo (AI)", value: "tech" },
      { label: "Năng lượng xanh & Xe điện (EV)", value: "ev" },
      { label: "Tài chính, Ngân hàng & ETF đa dạng", value: "finance" },
      { label: "Phân bổ hỗn hợp cân bằng tất cả", value: "mixed" },
    ],
  },
];

function getSurveyRecommendation(answers: Record<string, string>) {
  const risk = answers.risk;
  const sector = answers.sector;

  let symbol = "SPY";
  let title = "Quỹ chỉ số S&P 500 ETF (SPY)";
  let content = "Phù hợp cho chiến lược phân bổ đa dạng, bảo toàn vốn và tăng trưởng ổn định.";
  let data: Record<string, string> = { "Tỷ lệ đề xuất": "100% SPY" };

  if (sector === "tech") {
    if (risk === "high") {
      symbol = "NVDA";
      title = "Cổ phiếu NVIDIA Corp (NVDA)";
      content = "Dành cho hồ sơ chịu rủi ro cao. NVIDIA dẫn đầu ngành chip bán dẫn AI với tăng trưởng vượt bậc, thích hợp cho đầu tư trung/dài hạn.";
      data = { "Phân bổ khuyên dùng": "40% Vốn", "Kỳ vọng": "Tăng trưởng mạnh", "Khuyến nghị": "MUA" };
    } else if (risk === "medium") {
      symbol = "MSFT";
      title = "Cổ phiếu Microsoft Corp (MSFT)";
      content = "Tập đoàn công nghệ hàng đầu tích hợp AI sâu rộng. Tăng trưởng ổn định với vị thế tài chính cực kỳ lành mạnh.";
      data = { "Phân bổ khuyên dùng": "30% Vốn", "Kỳ vọng": "Tăng trưởng ổn định", "Khuyến nghị": "MUA" };
    } else {
      symbol = "AAPL";
      title = "Cổ phiếu Apple Inc (AAPL)";
      content = "Thương hiệu tiêu dùng công nghệ bền vững, biên lợi nhuận cao và dòng tiền dồi dào. Phù hợp cho hồ sơ an toàn.";
      data = { "Phân bổ khuyên dùng": "25% Vốn", "Kỳ vọng": "Bền vững", "Khuyến nghị": "MUA" };
    }
  } else if (sector === "ev") {
    symbol = "TSLA";
    title = "Cổ phiếu Tesla Inc (TSLA)";
    content = "Dẫn đầu cuộc cách mạng xe điện và lưu trữ năng lượng. Mặc dù biến động giá cao, TSLA là lựa chọn tăng trưởng hàng đầu.";
    data = { "Phân bổ khuyên dùng": "35% Vốn", "Kỳ vọng": "Bứt phá dài hạn", "Khuyến nghị": "MUA" };
  } else if (sector === "finance") {
    if (risk === "low") {
      symbol = "SPY";
      title = "Quỹ chỉ số S&P 500 ETF (SPY)";
      content = "Phân bổ rủi ro thấp nhất bằng cách sở hữu 500 tập đoàn lớn nhất nước Mỹ. Sinh lời bền vững.";
      data = { "Phân bổ khuyên dùng": "50% Vốn", "Kỳ vọng": "Tích sản dài hạn", "Khuyến nghị": "MUA" };
    } else {
      symbol = "JPM";
      title = "Cổ phiếu JPMorgan Chase & Co (JPM)";
      content = "Tập đoàn ngân hàng lớn nhất nước Mỹ, hưởng lợi thế từ quy mô lớn và hoạt động tư vấn sáp nhập.";
      data = { "Phân bổ khuyên dùng": "30% Vốn", "Kỳ vọng": "Cổ tức & Tăng trưởng", "Khuyến nghị": "MUA" };
    }
  } else {
    if (risk === "high") {
      symbol = "QQQ";
      title = "Quỹ chỉ số Nasdaq 100 ETF (QQQ)";
      content = "Danh mục tập trung 100 công ty phi tài chính lớn nhất sàn Nasdaq. Tăng trưởng vượt trội nhưng biến động mạnh.";
      data = { "Phân bổ khuyên dùng": "45% Vốn", "Kỳ vọng": "Tăng trưởng cao", "Khuyến nghị": "MUA" };
    } else {
      symbol = "SPY";
      title = "Quỹ chỉ số S&P 500 ETF (SPY)";
      content = "Đề xuất tối ưu nhất cho danh mục hỗn hợp giúp đa dạng hóa rủi ro tối đa và sinh lời bền vững.";
      data = { "Phân bổ khuyên dùng": "60% Vốn", "Kỳ vọng": "An toàn & Tăng trưởng", "Khuyến nghị": "MUA" };
    }
  }

  return { symbol, title, content, data };
}

type DecisionTemplate = Omit<SimulationDecision, "id" | "status" | "resolvedAt">;

function buildDecisionTemplates(answers: Record<string, string>): DecisionTemplate[] {
  const risk = answers.risk ?? "medium";
  const sector = answers.sector ?? "mixed";
  const primarySymbol = getSurveyRecommendation(answers).symbol;

  return [
    {
      type: "volatility_spike" as DecisionType,
      title: "Biến động thị trường tăng mạnh",
      description: "Chỉ số VIX tăng 25% trong phiên qua. Thị trường đang chịu áp lực bán mạnh. Cần quyết định hành động cho danh mục hiện tại.",
      aiAdvice: "VIX tăng mạnh thường là cảnh báo ngắn hạn. Nếu bạn có vị thế dài hạn, đây có thể là cơ hội mua thêm với giá tốt hơn. Tuy nhiên, hãy cân nhắc giảm tỷ trọng nếu bạn có vị thế ngắn hạn.",
      chips: [
        { label: "Mua thêm khi giảm", value: "buy_more" },
        { label: "Giữ nguyên danh mục", value: "hold" },
        { label: "Bán một phần chốt lời", value: "sell_partial" },
      ],
    },
    {
      type: "portfolio_drawdown" as DecisionType,
      title: "Danh mục giảm sâu 8%",
      description: "Danh mục hiện tại của bạn đã giảm 8% từ đỉnh gần nhất. Đây là ngưỡng cảnh báo cần xem xét lại chiến lược.",
      aiAdvice: "Mức giảm 8% nằm trong phạm vi bình thường với cổ phiếu rủi ro cao. Không nên hoảng loạn bán. Thay vào đó, hãy xem xét có cần cơ cấu lại tỷ trọng hay không.",
      chips: [
        { label: "Cơ cấu lại danh mục", value: "rebalance_now" },
        { label: "Chờ thị trường hồi phục", value: "wait" },
        { label: "Cắt lỗ giảm tỷ trọng", value: "cut_loss" },
      ],
    },
    {
      type: "take_profit" as DecisionType,
      title: "Cơ hội chốt lời 15%",
      description: `${primarySymbol} đã tăng 15% trong 2 tuần qua và đang tiến gần vùng kháng cự kỹ thuật quan trọng. Đây có thể là thời điểm tốt để chốt lời một phần.`,
      aiAdvice: `Với ${primarySymbol} đã tăng mạnh, khuyến nghị chốt lời 30-50% vị thế để bảo toàn lợi nhuận. Giữ lại phần còn lại nếu bạn tin vào xu hướng dài hạn.`,
      chips: [
        { label: "Chốt lời 30%", value: "take_profit_30" },
        { label: "Chốt lời 50%", value: "take_profit_50" },
        { label: "Giữ toàn bộ vị thế", value: "keep_all" },
      ],
    },
    {
      type: "rebalance" as DecisionType,
      title: "Cần cân bằng lại danh mục",
      description: "Tỷ trọng cổ phiếu công nghệ trong danh mục đã vượt ngưỡng mục tiêu 10% do tăng trưởng mạnh. Cần cân bằng lại để duy trì phân bổ hợp lý.",
      aiAdvice: "Quá tải một ngành tăng mạnh dẫn đến rủi ro tập trung. Khuyến nghị bán một phần cổ phiếu công nghệ để đưa tỷ trọng về mức mục tiêu và tái đầu tư vào các ngành đang bị underweight.",
      chips: [
        { label: "Cân bằng ngay", value: "rebalance_yes" },
        { label: "Bỏ qua lần này", value: "rebalance_skip" },
        { label: "Tự động cân bằng", value: "rebalance_auto" },
      ],
    },
    {
      type: "risk_breach" as DecisionType,
      title: "Cảnh báo giới hạn rủi ro",
      description: risk === "high"
        ? "Biến động danh mục đã vượt ngưỡng 20% VaR. Khuyến nghị hạn chế thêm vị thế mới và xem xét giảm tỷ trọng."
        : "Mức sụt giảm danh mục tiệm cận ngưỡng rủi ro tối đa của bạn. Cần hành động để bảo toàn vốn.",
      aiAdvice: risk === "high"
        ? "Ngưỡng VaR 20% đã bị phá vỡ. Dù hồ sơ rủi ro của bạn cho phép biến động cao, vẫn nên giảm đòn bẩy hoặc tăng tỷ trọng tiền mặt tạm thời."
        : "Danh mục đang tiệm cận ngưỡng rủi ro tối đa. Khuyến nghị giảm 20-30% tổng tỷ trọng cổ phiếu và tăng tiền mặt để giảm rủi ro.",
      chips: [
        { label: "Giảm tỷ trọng cổ phiếu", value: "reduce_risk" },
        { label: "Chuyển sang tài sản an toàn", value: "safe_haven" },
        { label: "Bỏ qua cảnh báo", value: "ignore" },
      ],
    },
    {
      type: "new_opportunity" as DecisionType,
      title: "Cơ hội cổ phiếu mới xuất hiện",
      description: sector === "tech"
        ? "Một cổ phiếu công nghệ mới với tiềm năng tăng trưởng cao vừa IPO và đang ở mức giá hấp dẫn. Đây là cơ hội để đa dạng hóa danh mục."
        : "Một cổ phiếu thuộc ngành ưa thích của bạn đang giao dịch dưới giá trị hợp lý với P/E hấp dẫn và dòng tiền mạnh.",
      aiAdvice: sector === "tech"
        ? "Cổ phiếu công nghệ mới nổi có tiềm năng nhưng cũng rủi ro cao. Khuyến nghị chỉ phân bổ 5-10% vốn nếu bạn muốn tham gia, đủ để theo dõi nhưng không ảnh hưởng lớn đến danh mục."
        : "Cổ phiếu đang trading dưới fair value. Đây là cơ hội tốt để mua dần với chiến lược trung bình giá. Tỷ trọng khuyến nghị: 10-15%.",
      chips: [
        { label: "Mua với tỷ trọng nhỏ", value: "buy_small" },
        { label: "Theo dõi thêm", value: "watch" },
        { label: "Bỏ qua cơ hội", value: "pass" },
      ],
    },
  ];
}

function chipValueToStatus(value: string): DecisionStatus {
  if (value === "hold" || value === "wait" || value === "keep_all" || value === "rebalance_skip" || value === "ignore" || value === "pass" || value === "watch") {
    return "skipped";
  }
  if (value === "cut_loss" || value === "safe_haven") {
    return "rejected";
  }
  return "accepted";
}

// ── Page component ──

export default function AIAgentPage() {
  const { toggleWatchlist, isInWatchlist, executeBuy, executeSell, getPrice, state } = useDemo();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  const [executedBuySymbols, setExecutedBuySymbols] = useState<string[]>([]);

  const [simDecisions, setSimDecisions] = useState<SimulationDecision[]>([]);
  const [completedDecisions, setCompletedDecisions] = useState<SimulationDecision[]>([]);
  const [currentDecisionIndex, setCurrentDecisionIndex] = useState(-1);
  const [showCompleted, setShowCompleted] = useState(false);

  const [feedbackMap, setFeedbackMap] = useState<Record<string, DecisionFeedback[]>>({});
  const [revisionMap, setRevisionMap] = useState<Record<string, DecisionRevision[]>>({});
  const [inlineFeedbackLoading, setInlineFeedbackLoading] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<SimulationDecision | null>(null);
  const [pendingChipValue, setPendingChipValue] = useState<string | null>(null);

  // ── Draft order state ──
  const [draftOrder, setDraftOrder] = useState<DraftOrder | null>(null);

  const HISTORY_KEY = "pisi_decision_history";
  const FEEDBACK_KEY = "pisi_decision_feedback";
  const REVISION_KEY = "pisi_decision_revisions";

  const saveFeedbackToStorage = useCallback(
    (id: string, feedback: DecisionFeedback[]) => {
      try {
        const existing = JSON.parse(sessionStorage.getItem(FEEDBACK_KEY) ?? "{}") as Record<string, DecisionFeedback[]>;
        existing[id] = feedback;
        sessionStorage.setItem(FEEDBACK_KEY, JSON.stringify(existing));
      } catch { /* storage unavailable */ }
    },
    []
  );

  const saveRevisionToStorage = useCallback(
    (id: string, revisions: DecisionRevision[]) => {
      try {
        const existing = JSON.parse(sessionStorage.getItem(REVISION_KEY) ?? "{}") as Record<string, DecisionRevision[]>;
        existing[id] = revisions;
        sessionStorage.setItem(REVISION_KEY, JSON.stringify(existing));
      } catch { /* storage unavailable */ }
    },
    []
  );

  useEffect(() => {
    try {
      const storedFeedback = JSON.parse(sessionStorage.getItem(FEEDBACK_KEY) ?? "{}") as Record<string, DecisionFeedback[]>;
      if (Object.keys(storedFeedback).length > 0) setFeedbackMap(storedFeedback);
      const storedRevisions = JSON.parse(sessionStorage.getItem(REVISION_KEY) ?? "{}") as Record<string, DecisionRevision[]>;
      if (Object.keys(storedRevisions).length > 0) setRevisionMap(storedRevisions);
    } catch { /* storage unavailable */ }
  }, []);

  const currentDecision = currentDecisionIndex >= 0 && currentDecisionIndex < simDecisions.length
    ? simDecisions[currentDecisionIndex]
    : null;

  const hasMoreDecisions = currentDecisionIndex < simDecisions.length - 1;

  // ── Survey handlers ──

  const handleStartSurvey = () => {
    setSurveyStep(1);
    setSurveyAnswers({});
    const firstQ = SURVEY_QUESTIONS[0];
    setMessages([
      {
        id: `s_q_${Date.now()}`,
        role: "assistant",
        content: firstQ.text,
        chips: firstQ.chips,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSelectOption = (value: string, label: string) => {
    const userMsg: AIMessage = {
      id: `s_a_${Date.now()}`,
      role: "user",
      content: label,
      timestamp: new Date().toISOString(),
    };

    const currentQuestion = SURVEY_QUESTIONS[surveyStep - 1];
    const updatedAnswers = { ...surveyAnswers, [currentQuestion.key]: value };
    setSurveyAnswers(updatedAnswers);

    setMessages((prev) => [...prev, userMsg]);

    if (surveyStep < SURVEY_QUESTIONS.length) {
      const nextStep = surveyStep + 1;
      setSurveyStep(nextStep);
      const nextQ = SURVEY_QUESTIONS[nextStep - 1];
      setMessages((prev) => [
        ...prev,
        {
          id: `s_q_${Date.now() + 1}`,
          role: "assistant",
          content: nextQ.text,
          chips: nextQ.chips,
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      const rec = getSurveyRecommendation(updatedAnswers);
      const assistantRecMsg: AIMessage = {
        id: `s_rec_${Date.now()}`,
        role: "assistant",
        content: `Cảm ơn bạn! Dựa trên hồ sơ rủi ro "${updatedAnswers.risk}", khẩu vị đầu tư "${updatedAnswers.goal}" và thời hạn "${updatedAnswers.horizon}", tôi đề xuất:`,
        surveyRecommendation: {
          symbol: rec.symbol,
          title: rec.title,
          content: rec.content,
          data: rec.data,
        },
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantRecMsg]);

      const templates = buildDecisionTemplates(updatedAnswers);
      const decisions: SimulationDecision[] = templates.map((t, i) => ({
        ...t,
        id: `decision_${Date.now()}_${i}`,
        status: "pending",
      }));
      setSimDecisions(decisions);
      setCurrentDecisionIndex(0);
      setSurveyStep(-1);

      const firstDec = decisions[0];
      const decisionIntroMsg: AIMessage = {
        id: `s_sim_${Date.now()}`,
        role: "assistant",
        content: `Bắt đầu mô phỏng đầu tư. Bạn sẽ trải qua 6 quyết định quan trọng. Mỗi quyết định đại diện cho một tình huống thị trường thực tế.\n\n**Quyết định 1 / 6:**\n${firstDec.title}\n${firstDec.description}`,
        chips: firstDec.chips,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, decisionIntroMsg]);
    }
  };

  // ── Inline feedback ──
  const sendDecisionFeedback = async (feedback: string, decision: SimulationDecision) => {
    if (!feedback.trim()) return;

    const userMsg: AIMessage = {
      id: `fb_${Date.now()}`,
      role: "user",
      content: feedback,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setInlineFeedbackLoading(true);

    try {
      const holdings = Object.values(state.holdings).map((h) => {
        const livePrice = getPrice(h.symbol) || h.avgPrice;
        const unrealizedPnL = (livePrice - h.avgPrice) * h.quantity;
        return {
          symbol: h.symbol,
          name: h.name,
          quantity: h.quantity,
          avgPrice: h.avgPrice,
          currentPrice: livePrice,
          unrealizedPnL,
          unrealizedPnLPct: h.avgPrice > 0 ? (unrealizedPnL / (h.avgPrice * h.quantity)) * 100 : 0,
        };
      });
      const totalAccountValue = state.cashBalance + holdings.reduce((s, h) => s + h.currentPrice * h.quantity, 0);

      const agentContext = {
        phase: 'decision_active' as const,
        cashBalance: state.cashBalance,
        holdings,
        totalAccountValue,
        activeDecision: {
          id: decision.id,
          title: decision.title,
          description: decision.description,
          ticker: (decision as SimulationDecision & { ticker?: string }).ticker,
          chips: decision.chips ?? [],
          pendingChipValue: pendingChipValue ?? undefined,
          pendingChipLabel: pendingChipValue
            ? decision.chips?.find((c: DecisionChip) => c.value === pendingChipValue)?.label
            : undefined,
        },
        priorFeedback: feedbackMap[decision.id]?.map((f) => f.content),
        availableTickers: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'V', 'SPY', 'QQQ', 'BRK.B', 'XOM', 'UNH', 'DIS'],
      };

      let agentResponse: AgentResponse;

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: feedback, context: agentContext }),
        });

        if (!res.ok) throw new Error("API error");
        agentResponse = await res.json();
      } catch {
        agentResponse = await getMockAgentResponse(feedback, agentContext);
      }

      if (agentResponse.decisionPatch) {
        const patch = agentResponse.decisionPatch;

        const actionToChipValue: Record<string, string> = {
          Buy: 'buy_more',
          Sell: 'sell_partial',
          Hold: 'hold',
          Watch: 'watch',
          Rebalance: 'rebalance_yes',
        };

        const suggestedChipValue = actionToChipValue[patch.action ?? ''];
        if (suggestedChipValue) {
          setPendingChipValue(suggestedChipValue);
          setPendingConfirm(decision);
        }

        setSimDecisions((prev) =>
          prev.map((d) =>
            d.id === decision.id
              ? {
                  ...d,
                  aiAdvice: patch.rationale
                    ? `${d.aiAdvice}\n\n[AI đã điều chỉnh: ${patch.rationale}]`
                    : d.aiAdvice,
                  feedbackCount: (d.feedbackCount ?? 0) + 1,
                  lastFeedback: feedback.slice(0, 80),
                }
              : d
          )
        );

        if (currentDecision?.id === decision.id) {
          setSimDecisions((prev) => [...prev]);
        }
      }

      const fbEntry: DecisionFeedback = {
        id: `fb_${Date.now()}`,
        decisionId: decision.id,
        content: feedback,
        timestamp: new Date().toISOString(),
      };
      setFeedbackMap((prev) => {
        const updated = { ...prev, [decision.id]: [...(prev[decision.id] ?? []), fbEntry] };
        saveFeedbackToStorage(decision.id, updated[decision.id]);
        return updated;
      });

      const hasRevision = !!agentResponse.decisionPatch;
      const patchMsg = hasRevision
        ? `\n\n🡆 **Quyết định đã điều chỉnh:**\n${agentResponse.decisionPatch?.action ?? ''} — ${agentResponse.decisionPatch?.rationale ?? ''}`
        : "";

      const aiMsg: AIMessage = {
        id: `fb_ai_${Date.now()}`,
        role: "assistant",
        content: agentResponse.message + patchMsg,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (agentResponse.decisionPatch) {
        pushToast({
          type: "info",
          title: "Quyết định đã cập nhật",
          message: `${agentResponse.decisionPatch.action ?? ''} ${agentResponse.decisionPatch.ticker ?? ''}`,
        });
      }
    } finally {
      setInlineFeedbackLoading(false);
    }
  };

  // ── Chip handlers ──
  const handleDecisionChoice = (value: string) => {
    if (!currentDecision) return;
    const chip = currentDecision.chips?.find((c: DecisionChip) => c.value === value);
    if (!chip) return;

    setPendingChipValue(value);
    setPendingConfirm(currentDecision);

    const userMsg: AIMessage = {
      id: `d_sel_${Date.now()}`,
      role: "user",
      content: `Tôi chọn: ${chip.label}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const status = chipValueToStatus(value);
    const statusLabel = status === "accepted" ? "Chấp nhận" : status === "rejected" ? "Từ chối" : "Bỏ qua";

    const confirmMsg: AIMessage = {
      id: `d_confirm_${Date.now()}`,
      role: "assistant",
      content: `Bạn đã chọn **"${chip.label}"** (${statusLabel}).\n\nBạn có thể gửi phản hồi bổ sung bên dưới trước khi xác nhận, hoặc nhấn **"Xác nhận"** ngay để lưu quyết định.`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, confirmMsg]);
  };

  const handleConfirmDecision = () => {
    if (!pendingConfirm || !pendingChipValue) return;

    const chip = pendingConfirm.chips?.find((c: DecisionChip) => c.value === pendingChipValue);
    if (!chip) return;

    const status = chipValueToStatus(pendingChipValue);
    const now = new Date().toISOString();

    const entry: DecisionHistoryEntry = {
      id: `hist_${pendingConfirm.id}`,
      decisionId: pendingConfirm.id,
      type: pendingConfirm.type,
      title: pendingConfirm.title,
      description: pendingConfirm.description,
      selectedChipValue: pendingChipValue,
      selectedChipLabel: chip.label,
      status,
      resolvedAt: now,
      feedback: feedbackMap[pendingConfirm.id] ?? [],
      revisions: revisionMap[pendingConfirm.id] ?? [],
      aiAdviceSnapshot: pendingConfirm.aiAdvice,
    };

    try {
      const existing = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? "[]") as DecisionHistoryEntry[];
      const updated = existing.filter((e) => e.decisionId !== pendingConfirm.id);
      updated.push(entry);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch { /* storage unavailable */ }

    const resolved: SimulationDecision = {
      ...pendingConfirm,
      status,
      resolvedAt: now,
      pendingChipValue: undefined,
    };

    setCompletedDecisions((prev) => [...prev, resolved]);
    setSimDecisions((prev) =>
      prev.map((d) => (d.id === pendingConfirm.id ? resolved : d))
    );

    const feedbackContent = status === "accepted"
      ? `Quyết định đã được xác nhận: "${chip.label}". ${pendingConfirm.aiAdvice}`
      : status === "rejected"
      ? `Quyết định đã được từ chối: "${chip.label}". ${pendingConfirm.aiAdvice}`
      : `Đã bỏ qua: "${chip.label}". ${pendingConfirm.aiAdvice}`;

    const completionMsg: AIMessage = {
      id: `d_done_${Date.now()}`,
      role: "assistant",
      content: feedbackContent,
      timestamp: now,
    };
    setMessages((prev) => [...prev, completionMsg]);

    setPendingConfirm(null);
    setPendingChipValue(null);

    setTimeout(() => advanceToNextDecision(pendingConfirm.id), 600);
  };

  const handleCancelConfirmation = () => {
    setPendingConfirm(null);
    setPendingChipValue(null);
    const cancelMsg: AIMessage = {
      id: `d_cancel_${Date.now()}`,
      role: "assistant",
      content: "Đã hủy lựa chọn. Bạn có thể chọn lại hoặc gửi phản hồi bổ sung.",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, cancelMsg]);
  };

  // ── Draft order confirm / cancel ──
  const handleDraftConfirm = () => {
    if (!draftOrder) return;
    const { action, ticker, name, quantity, price } = draftOrder;

    if (action === "Buy") {
      const success = executeBuy(ticker, name, quantity, price);
      if (!success) {
        pushToast({ type: "alert", title: "Lệnh thất bại", message: "Số dư không đủ hoặc lệnh không hợp lệ." });
      } else {
        pushToast({ type: "success", title: `Mua ${ticker} thành công`, message: `${quantity} CP @ $${price.toFixed(2)}` });
      }
    } else if (action === "Sell") {
      const success = executeSell(ticker, name, quantity, price);
      if (!success) {
        pushToast({ type: "alert", title: "Lệnh thất bại", message: "Không đủ cổ phiếu để bán." });
      } else {
        pushToast({ type: "success", title: `Bán ${ticker} thành công`, message: `${quantity} CP @ $${price.toFixed(2)}` });
      }
    } else if (action === "Watch") {
      toggleWatchlist(ticker);
      pushToast({ type: "info", title: `Đã thêm ${ticker} vào watchlist`, message: `Theo dõi ${ticker}` });
    } else {
      pushToast({ type: "info", title: "Đã ghi nhận", message: `Giữ nguyên vị thế ${ticker}.` });
    }

    const aiMsg: AIMessage = {
      id: `draft_confirm_${Date.now()}`,
      role: "assistant",
      content: draftOrder.reason + (action === "Watch" ? ` Đã thêm **${ticker}** vào danh sách theo dõi.` : action === "Hold" ? "" : ` Lệnh đã được thực hiện.`),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setDraftOrder(null);
  };

  const handleDraftCancel = () => {
    const cancelMsg: AIMessage = {
      id: `draft_cancel_${Date.now()}`,
      role: "assistant",
      content: draftOrder ? `Đã hủy lệnh ${draftOrder.action} ${draftOrder.ticker}.` : "Đã hủy lệnh.",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, cancelMsg]);
    setDraftOrder(null);
  };

  // ── Helper: advance to next decision ──
  const advanceToNextDecision = (completedId: string) => {
    setPendingConfirm(null);
    setPendingChipValue(null);

    const nextIdx = currentDecisionIndex + 1;
    if (nextIdx < simDecisions.length) {
      const nextDec = simDecisions[nextIdx];
      const introMsg: AIMessage = {
        id: `d_intro_${Date.now()}`,
        role: "assistant",
        content: `**Quyết định ${nextIdx + 1} / ${simDecisions.length}:**\n${nextDec.title}\n${nextDec.description}`,
        chips: nextDec.chips,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, introMsg]);
      setCurrentDecisionIndex(nextIdx);
    } else {
      const endMsg: AIMessage = {
        id: `d_end_${Date.now()}`,
        role: "assistant",
        content: "Bạn đã hoàn thành tất cả 6 quyết định mô phỏng. Cảm ơn bạn đã tham gia! Bây giờ bạn có thể đặt câu hỏi bất kỳ về thị trường, phân tích cổ phiếu, hoặc tiếp tục giao dịch demo.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, endMsg]);
      setCurrentDecisionIndex(-1);
    }
  };

  const handleSkipToNext = () => {
    if (!hasMoreDecisions) return;

    const skippedDec = currentDecision!;
    const skippedId = skippedDec.id;

    const resolved: SimulationDecision = {
      ...skippedDec,
      status: "skipped",
      resolvedAt: new Date().toISOString(),
    };

    setCompletedDecisions((prev) => [...prev, resolved]);
    setSimDecisions((prev) =>
      prev.map((d) => (d.id === skippedId ? resolved : d))
    );

    setPendingConfirm(null);
    setPendingChipValue(null);

    const msg: AIMessage = {
      id: `d_skip_${Date.now()}`,
      role: "assistant",
      content: `Đã bỏ qua "${skippedDec.title}".`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);

    setTimeout(() => advanceToNextDecision(skippedId), 600);
  };

  // ── Buy / watchlist ──
  const handleBuyStock = (symbol: string, qty = 10) => {
    const stock = getStockBySymbol(symbol);
    const price = getPrice(symbol);
    if (!stock || !price) {
      pushToast({ type: "alert", title: "Lệnh thất bại", message: "Không tìm thấy giá cho mã này." });
      return;
    }
    const success = executeBuy(symbol, stock.name, qty, price);
    if (!success) {
      pushToast({ type: "alert", title: "Lệnh thất bại", message: "Số dư không đủ hoặc lệnh không hợp lệ." });
      return;
    }
    setExecutedBuySymbols((prev) => prev.includes(symbol) ? prev : [...prev, symbol]);
    pushToast({
      type: "success",
      title: "Mua thành công",
      message: `Đã đặt lệnh mua ${qty} CP ${symbol} @ $${price.toFixed(2)}`,
    });
  };

  const handleSellStock = (symbol: string, qty: number) => {
    const stock = getStockBySymbol(symbol);
    const price = getPrice(symbol);
    if (!stock || !price) {
      pushToast({ type: "alert", title: "Lệnh thất bại", message: "Không tìm thấy giá cho mã này." });
      return;
    }
    const success = executeSell(symbol, stock.name, qty, price);
    if (!success) {
      pushToast({ type: "alert", title: "Lệnh thất bại", message: "Không đủ cổ phiếu để bán." });
      return;
    }
    pushToast({
      type: "success",
      title: "Bán thành công",
      message: `Đã đặt lệnh bán ${qty} CP ${symbol} @ $${price.toFixed(2)}`,
    });
  };

  // ── Chat: freely alongside active decision ──
  // Draft orders are parsed synchronously; LLM is only called for questions.
  const sendMessage = async (msg: string) => {
    if (!msg.trim()) return;
    if (loading) return; // prevent double-submit

    const userMsg: AIMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // ── Synchronous: parse intent first, no loading state ──
    let draft: DraftOrder | null = null;
    try {
      draft = parseDraftOrder(msg, state.cashBalance, state.holdings, getPrice);
    } catch (e) {
      console.error("[parseDraftOrder] error:", e);
    }

    if (draft) {
      setDraftOrder(draft);
      const aiMsg: AIMessage = {
        id: `draft_created_${Date.now()}`,
        role: "assistant",
        content: draft.reason + "\n\nXem lệnh dự thảo bên dưới và nhấn **Xác nhận** để thực hiện, hoặc **Hủy** để bỏ qua.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      return; // synchronous path — NO setLoading(true) called
    }

    // ── Async: LLM path — set loading only here ──
    setInput("");
    setLoading(true);

    try {
      const holdings = Object.values(state.holdings).map((h) => {
        const livePrice = getPrice(h.symbol) || h.avgPrice;
        const unrealizedPnL = (livePrice - h.avgPrice) * h.quantity;
        return {
          symbol: h.symbol,
          name: h.name,
          quantity: h.quantity,
          avgPrice: h.avgPrice,
          currentPrice: livePrice,
          unrealizedPnL,
          unrealizedPnLPct: h.avgPrice > 0 ? (unrealizedPnL / (h.avgPrice * h.quantity)) * 100 : 0,
        };
      });
      const totalAccountValue = state.cashBalance + holdings.reduce((s, h) => s + h.currentPrice * h.quantity, 0);

      const agentContext = {
        phase: (currentDecision ? 'decision_active' : 'replay_playing') as 'decision_active' | 'replay_playing',
        cashBalance: state.cashBalance,
        holdings,
        totalAccountValue,
        activeDecision: currentDecision ? {
          id: currentDecision.id,
          title: currentDecision.title,
          description: currentDecision.description,
          chips: currentDecision.chips ?? [],
          pendingChipValue: pendingChipValue ?? undefined,
          pendingChipLabel: pendingChipValue
            ? currentDecision.chips?.find((c: DecisionChip) => c.value === pendingChipValue)?.label
            : undefined,
        } : undefined,
        availableTickers: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'V', 'SPY', 'QQQ', 'BRK.B', 'XOM', 'UNH', 'DIS'],
      };

      let agentResponse: AgentResponse | null = null;
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, context: agentContext }),
        });
        if (res.ok) agentResponse = await res.json();
      } catch (e) {
        console.error("[sendMessage] LLM fetch error:", e);
      }

      if (agentResponse?.requestedAction && agentResponse?.requestedTicker) {
        const ticker = agentResponse.requestedTicker;
        const stock = getStockBySymbol(ticker);
        const price = stock ? (getPrice(ticker) || stock.price) : 0;

        if ((agentResponse.requestedAction === 'Buy' || agentResponse.requestedAction === 'Sell') && stock && price > 0) {
          const holding = state.holdings[ticker];
          let qty = agentResponse.requestedQuantity ?? 10;
          if (agentResponse.requestedAction === 'Sell') {
            if (!holding || holding.quantity === 0) {
              const errMsg: AIMessage = {
                id: `action_ai_${Date.now()}`,
                role: "assistant",
                content: `Bạn không có vị thế ${ticker} để bán.`,
                timestamp: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, errMsg]);
              setLoading(false);
              return;
            }
            qty = Math.min(qty, holding.quantity);
          }
          const total = qty * price;
          const draft2: DraftOrder = {
            id: `draft_${Date.now()}`,
            action: agentResponse.requestedAction as DraftAction,
            ticker,
            name: stock.name,
            quantity: qty,
            price,
            total,
            reason: agentResponse.message,
          };
          setDraftOrder(draft2);
          const aiMsg: AIMessage = {
            id: `draft_ai_${Date.now()}`,
            role: "assistant",
            content: `${agentResponse.message}\n\nXem lệnh dự thảo bên dưới và nhấn **Xác nhận** để thực hiện, hoặc **Hủy** để bỏ qua.`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setLoading(false);
          return;
        } else if (agentResponse.requestedAction === 'Watch') {
          toggleWatchlist(ticker);
          const patchMsg: AIMessage = {
            id: `action_ai_${Date.now()}`,
            role: "assistant",
            content: `Đã thêm **${ticker}** vào danh sách theo dõi. ${agentResponse.message}`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, patchMsg]);
          setLoading(false);
          return;
        } else if (agentResponse.requestedAction === 'Hold') {
          const patchMsg: AIMessage = {
            id: `action_ai_${Date.now()}`,
            role: "assistant",
            content: agentResponse.message,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, patchMsg]);
          setLoading(false);
          return;
        }
      }

      // No structured action — try mock fallback before giving up
      if (!agentResponse) {
        const fallbackDraft = parseDraftOrder(msg, state.cashBalance, state.holdings, getPrice);
        if (fallbackDraft) {
          setDraftOrder(fallbackDraft);
          const aiMsg: AIMessage = {
            id: `fallback_draft_${Date.now()}`,
            role: "assistant",
            content: fallbackDraft.reason + "\n\nXem lệnh dự thảo bên dưới và nhấn **Xác nhận** để thực hiện, hoặc **Hủy** để bỏ qua.",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setLoading(false);
          return;
        }
      }

      // Plain text response
      const aiMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: agentResponse?.message ?? "Không nhận được phản hồi từ AI.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error("[sendMessage] unexpected error:", e);
      const aiMsg: AIMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: "Đã xảy ra lỗi. Vui lòng thử lại.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  // ── Prompt buttons ──
  const displayPrompts = [
    "⚡ Bắt đầu tư vấn đầu tư (Khảo sát 5 câu)",
    ...SUGGESTED_PROMPTS.slice(0, 3),
  ];

  const inputLocked = surveyStep > 0;
  const inputPlaceholder = inputLocked
    ? "Vui lòng chọn một lựa chọn ở trên..."
    : currentDecision
    ? "Nhắn tin cho AI hoặc chọn quyết định bên trên..."
    : "Hỏi về thị trường, cổ phiếu, tin tức...";

  // ── Status badge ──
  const StatusBadge = ({ status }: { status: DecisionStatus }) => {
    if (status === "accepted") return <span className="badge bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">Chấp nhận</span>;
    if (status === "rejected") return <span className="badge bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[10px]">Từ chối</span>;
    return <span className="badge bg-muted text-muted-foreground text-[10px]">Bỏ qua</span>;
  };

  // ── Completed decisions accordion ──
  const CompletedSection = () => {
    if (completedDecisions.length === 0) return null;
    return (
      <div className="mt-3 border border-border/60 rounded-xl overflow-hidden bg-muted/20">
        <button
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          onClick={() => setShowCompleted((v) => !v)}
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completedDecisions.length} quyết định đã hoàn thành
          </span>
          {showCompleted ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showCompleted && (
          <div className="border-t border-border/60 divide-y divide-border/40">
            {completedDecisions.map((d) => (
              <div key={d.id} className="px-4 py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{d.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{d.description}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Inline feedback panel ──
  const InlineFeedbackPanel = ({ decision }: { decision: SimulationDecision }) => {
    const [feedbackText, setFeedbackText] = useState("");

    const handleSend = async () => {
      if (!feedbackText.trim()) return;
      const text = feedbackText;
      setFeedbackText("");
      await sendDecisionFeedback(text, decision);
    };

    const FEEDBACK_EXAMPLES = [
      "Tôi có thể cần tiền trong tháng tới",
      "Giảm rủi ro",
      "Không mua thêm cổ phiếu công nghệ",
      "Chờ giá tốt hơn",
    ];

    return (
      <div className="mt-3 pt-3 border-t border-purple-500/15">
        <div className="flex items-center gap-1.5 mb-2">
          <MessageSquarePlus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="text-[11px] font-semibold text-purple-500">Phản hồi cho quyết định này</span>
          {feedbackMap[decision.id]?.length ? (
            <span className="text-[10px] text-muted-foreground">({feedbackMap[decision.id].length} phản hồi)</span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1 py-2 px-3 text-xs"
            placeholder="Tell FinPilot what should change…"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            disabled={inlineFeedbackLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className="btn bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 flex items-center justify-center disabled:opacity-50 cursor-pointer"
            onClick={handleSend}
            disabled={inlineFeedbackLoading || !feedbackText.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {FEEDBACK_EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="text-[10px] px-2 py-1 rounded-full bg-muted hover:bg-purple-500/10 text-muted-foreground hover:text-purple-500 border border-border transition-colors cursor-pointer"
              onClick={() => setFeedbackText(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Confirmation panel (chip selection) ──
  const ConfirmationPanel = ({ decision, chipValue }: { decision: SimulationDecision; chipValue: string }) => {
    const chip = decision.chips?.find((c: DecisionChip) => c.value === chipValue);
    if (!chip) return null;

    const status = chipValueToStatus(chipValue);
    const statusColor = status === "accepted" ? "emerald" : status === "rejected" ? "red" : "gray";
    const statusLabel = status === "accepted" ? "Chấp nhận" : status === "rejected" ? "Từ chối" : "Bỏ qua";

    return (
      <div className="mt-3 pt-3 border-t border-purple-500/20">
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center gap-1.5 text-xs font-semibold text-${statusColor}-500`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã chọn: {chip.label}
          </div>
          <span className={`badge text-[10px] bg-${statusColor}-500/10 text-${statusColor}-600 border-${statusColor}-500/20`}>
            {statusLabel}
          </span>
          {revisionMap[decision.id]?.length ? (
            <span className="text-[10px] text-muted-foreground italic">
              (đã điều chỉnh {revisionMap[decision.id].length} lần)
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 btn bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm cursor-pointer"
            onClick={handleConfirmDecision}
          >
            <CheckCircle2 className="w-4 h-4" />
            Xác nhận
          </button>
          <button
            className="btn border border-border hover:bg-muted/50 py-2.5 rounded-lg flex items-center justify-center px-4 text-sm cursor-pointer"
            onClick={handleCancelConfirmation}
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            Hủy
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Gửi phản hồi bổ sung bên dưới để điều chỉnh trước khi xác nhận.
        </p>
      </div>
    );
  };

  // ── Draft order card (visible draft decision) ──
  const DraftOrderCard = ({ draft }: { draft: DraftOrder }) => {
    const isBuy = draft.action === "Buy";
    const isSell = draft.action === "Sell";
    const isHold = draft.action === "Hold";
    const actionColor = isBuy ? "emerald" : isSell ? "red" : isHold ? "amber" : "blue";
    const actionLabel = isBuy ? "MUA" : isSell ? "BÁN" : isHold ? "GIỮ" : "THEO DÕI";

    return (
      <div className="mb-4 card border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Lệnh dự thảo</span>
          <span className={`badge text-[10px] bg-${actionColor}-500/15 text-${actionColor}-600 dark:text-${actionColor}-400 border-${actionColor}-500/30`}>
            {actionLabel}
          </span>
        </div>

        <div className="bg-card rounded-xl p-4 space-y-3">
          {/* Ticker and action */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground text-lg">{draft.ticker}</p>
              <p className="text-xs text-muted-foreground">{draft.name}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold text-lg text-${actionColor}-500`}>{actionLabel}</p>
              <p className="text-xs text-muted-foreground">@ ${draft.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-2 bg-muted/40 rounded-lg p-3 text-xs">
            <div>
              <p className="text-muted-foreground">Số lượng</p>
              <p className="font-semibold text-foreground">{draft.quantity > 0 ? `${draft.quantity} CP` : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Giá</p>
              <p className="font-semibold text-foreground">${draft.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tổng</p>
              <p className="font-semibold text-foreground">
                {draft.total > 0 ? `$${draft.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
              </p>
            </div>
          </div>

          {/* Reason */}
          <p className="text-xs text-muted-foreground leading-relaxed">{draft.reason}</p>

          {/* Confirm / Cancel */}
          <div className="flex gap-2 pt-1">
            <button
              className={`flex-1 btn font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm text-white cursor-pointer ${
                isBuy
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : isSell
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-amber-500 hover:bg-amber-600"
              }`}
              onClick={handleDraftConfirm}
            >
              <CheckCircle2 className="w-4 h-4" />
              Xác nhận
            </button>
            <button
              className="btn border border-border hover:bg-muted/50 py-2.5 rounded-lg flex items-center justify-center px-4 text-sm cursor-pointer"
              onClick={handleDraftCancel}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Hủy
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Active decision bar ──
  const ActiveDecisionBar = () => {
    if (!currentDecision) return null;
    const isPendingForThis = pendingConfirm?.id === currentDecision.id && pendingChipValue !== null;

    return (
      <div className="mb-4 card border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
            Quyết định {currentDecisionIndex + 1} / {simDecisions.length}
          </span>
          <div className="flex items-center gap-2">
            {isPendingForThis ? (
              <span className="flex items-center gap-1 text-[10px] text-amber-500">
                <Clock className="w-3 h-3" />
                Chờ xác nhận
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-purple-500">
                <Clock className="w-3 h-3" />
                Đang chờ phản hồi
              </span>
            )}
            {hasMoreDecisions && (
              <button
                onClick={handleSkipToNext}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-muted/50"
                title="Bỏ qua quyết định này và chuyển sang tiếp theo"
              >
                <SkipForward className="w-3 h-3" />
                Bỏ qua
              </button>
            )}
          </div>
        </div>
        <h3 className="font-bold text-foreground text-sm mb-1">{currentDecision.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{currentDecision.description}</p>

        {currentDecision.chips && (
          <div className="flex flex-wrap gap-2 mt-3">
            {currentDecision.chips.map((chip) => {
              const isSelected = pendingChipValue === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => handleDecisionChoice(chip.value)}
                  className={`px-3.5 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-500/20"
                      : "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:scale-105 active:scale-95"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        )}

        {isPendingForThis && pendingConfirm && (
          <ConfirmationPanel decision={pendingConfirm} chipValue={pendingChipValue!} />
        )}

        <InlineFeedbackPanel decision={currentDecision} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex-1 flex flex-col min-w-0" style={{ minHeight: "calc(100vh - 12rem)" }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Agent</h1>
              <p className="text-xs text-muted-foreground">Trợ lý tài chính thông minh</p>
            </div>
          </div>

          {/* Active decision bar */}
          <ActiveDecisionBar />

          {/* Draft order card */}
          {draftOrder && <DraftOrderCard draft={draftOrder} />}

          {/* Completed decisions accordion */}
          <CompletedSection />

          {/* Chat / messages area */}
          <div
            className="flex-1 overflow-y-auto space-y-4 mb-4 bg-card/35 rounded-2xl border border-border p-4 md:p-6"
            style={{ maxHeight: "calc(100vh - 22rem)" }}
          >
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500/15 to-indigo-500/15 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-ai-purple)" strokeWidth="2">
                    <path d="M12 8V4H8" />
                    <rect width="16" height="12" x="4" y="8" rx="2" />
                    <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground">Hỏi tôi bất kỳ điều gì về thị trường</h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">Phân tích cổ phiếu, so sánh mã, tóm tắt tin tức, tạo watchlist AI</p>
                <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto">
                  {displayPrompts.map((p) => (
                    <button
                      key={p}
                      className={`badge text-xs cursor-pointer hover:-translate-y-0.5 transition-all ${
                        p.startsWith("⚡")
                          ? "bg-purple-500 hover:bg-purple-600 text-white font-bold px-4 py-2 border-purple-400"
                          : "badge-ai hover:opacity-85"
                      }`}
                      onClick={() => sendMessage(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              return (
                <div key={m.id} className={`${m.role === "user" ? "flex justify-end" : "flex justify-start"}`}>
                  <div className={`max-w-[85%] ${m.role === "user" ? "bg-indigo-500 text-white rounded-2xl rounded-tr-md px-4 py-3" : ""}`}>
                    <p className="text-sm whitespace-pre-line leading-relaxed">{m.content}</p>

                    {m.chips && (
                      <div className="flex flex-wrap gap-2 mt-3 justify-start">
                        {m.chips.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => handleSelectOption(chip.value, chip.label)}
                            className="px-3.5 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-xs font-semibold text-purple-600 dark:text-purple-400 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {m.surveyRecommendation && (
                      <div className="card bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-500/20 rounded-2xl p-5 mt-4 space-y-4 max-w-lg shadow-xl shadow-purple-500/5 text-foreground">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <div>
                            <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wider block">Đề xuất tối ưu từ AI</span>
                            <h3 className="font-bold text-foreground text-lg font-sans mt-0.5">{m.surveyRecommendation.title}</h3>
                          </div>
                          <span className="badge badge-ai text-[10px] font-bold uppercase shrink-0">Khuyên Dùng</span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">{m.surveyRecommendation.content}</p>

                        <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-lg border border-border/50 font-mono text-xs">
                          {Object.entries(m.surveyRecommendation.data).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-muted-foreground block text-[10px] uppercase font-sans">{k}</span>
                              <span className="font-bold text-foreground text-xs mt-0.5 block">{v}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => handleBuyStock(m.surveyRecommendation!.symbol)}
                            disabled={executedBuySymbols.includes(m.surveyRecommendation.symbol)}
                            className={`flex-1 btn font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-white ${
                              executedBuySymbols.includes(m.surveyRecommendation.symbol)
                                ? "bg-muted-foreground/30 cursor-not-allowed text-muted-foreground"
                                : "bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/10 cursor-pointer"
                            }`}
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            {executedBuySymbols.includes(m.surveyRecommendation.symbol)
                              ? "Đã đặt lệnh mua"
                              : `Vào lệnh Mua 10 CP ${m.surveyRecommendation.symbol}`}
                          </button>

                          <button
                            onClick={() => toggleWatchlist(m.surveyRecommendation!.symbol)}
                            className={`btn border text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all px-4 hover:bg-secondary cursor-pointer ${
                              isInWatchlist(m.surveyRecommendation.symbol)
                                ? "text-amber-500 border-amber-500/40 bg-amber-500/5"
                                : "text-foreground"
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isInWatchlist(m.surveyRecommendation.symbol) ? "fill-amber-500 text-amber-500" : ""}`} />
                            {isInWatchlist(m.surveyRecommendation.symbol) ? "Đã lưu" : "Watchlist"}
                          </button>
                        </div>
                      </div>
                    )}

                    {m.cards && m.cards.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {m.cards.map((card, cIdx) => (
                          <div key={cIdx} className="card bg-card border-border p-3 rounded-xl text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-foreground">{card.title}</span>
                              {card.sentiment && (
                                <span className={`text-[10px] font-bold ${
                                  card.sentiment === "bullish"
                                    ? "text-emerald-500"
                                    : card.sentiment === "bearish"
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                }`}>
                                  {card.sentiment === "bullish" ? "↑ Tích cực" : card.sentiment === "bearish" ? "↓ Tiêu cực" : "— Trung lập"}
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground">{card.content}</p>
                            {card.data && Object.keys(card.data).length > 0 && (
                              <div className="mt-2 grid grid-cols-2 gap-1.5 bg-muted/40 p-2 rounded-lg">
                                {Object.entries(card.data).map(([k, v]) => (
                                  <div key={k}>
                                    <span className="text-muted-foreground text-[10px]">{k}</span>
                                    <span className="font-semibold text-foreground ml-1">{v}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="skeleton h-28 w-3/4 rounded-2xl" />
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="flex gap-2.5 mt-auto">
            <input
              className="input flex-1 py-3 px-4 text-sm"
              placeholder={inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage(input);
              }}
              id="ai-chat-input"
            />
            <button
              className="btn btn-ai px-6 flex items-center justify-center cursor-pointer"
              onClick={() => sendMessage(input)}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m22 2-7 20-4-9-4z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

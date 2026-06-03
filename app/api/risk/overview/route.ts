import { NextResponse } from "next/server";

/**
 * GET /api/risk/overview
 *
 * Trả về dữ liệu tổng quan quản trị rủi ro + danh sách cảnh báo.
 * Hiện tại dùng mock data. Khi kết nối backend thật, thay bằng fetch từ DB/service.
 */

const MOCK_RISK_DATA = {
  totalCapital: 487234.56,
  pnl: 12845.32,
  pnlPercent: 2.64,
  riskScore: 62,
  currentDrawdown: 4.8,
  maxDrawdown: 15,
  openRiskTotal: 24361.73,
  openRiskPercent: 5.0,
};

const MOCK_ALERTS = [
  {
    id: "a1",
    type: "warning",
    title: "Rủi ro mỗi lệnh đang cao",
    description: "Lệnh NVDA chiếm 8.2% tổng vốn, vượt ngưỡng 5% khuyến nghị.",
  },
  {
    id: "a2",
    type: "danger",
    title: "Drawdown vượt ngưỡng",
    description: "Drawdown hiện tại 4.8% đang tiến gần ngưỡng cảnh báo 5%.",
  },
  {
    id: "a3",
    type: "warning",
    title: "Đòn bẩy cao",
    description: "Tổng đòn bẩy danh mục đang ở mức 2.3x, vượt mức an toàn 2x.",
  },
  {
    id: "a4",
    type: "info",
    title: "Risk/Reward chưa tốt",
    description: "3/5 lệnh đang mở có tỷ lệ R:R dưới 1:2. Nên cân nhắc điều chỉnh SL/TP.",
  },
];

export async function GET() {
  return NextResponse.json({
    metrics: MOCK_RISK_DATA,
    alerts: MOCK_ALERTS,
    updatedAt: new Date().toISOString(),
  });
}

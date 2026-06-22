import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 } // Cache for 1 hour on server side
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch CNN data: ${res.status}`);
    }

    const data = await res.json();
    const score = Math.round(data.fear_and_greed?.score ?? 50);
    const rating = data.fear_and_greed?.rating ?? 'neutral';
    const previousClose = data.fear_and_greed?.previous_close ?? score;
    const change = Math.round((score - previousClose) * 10) / 10;

    // Generate descriptive text in Vietnamese based on the sentiment rating
    let description = '';
    switch (rating.toLowerCase()) {
      case 'extreme fear':
        description = 'Thị trường đang trong trạng thái cực kỳ hoảng loạn. Đây có thể là cơ hội mua tích lũy cho các nhà đầu tư dài hạn, hoặc cần cẩn trọng để bảo vệ danh mục đầu tư.';
        break;
      case 'fear':
        description = 'Thị trường đang có dấu hiệu lo ngại và thận trọng trước các biến động vĩ mô. Nhà đầu tư nên cân nhắc nắm giữ hoặc ưu tiên các nhóm cổ phiếu phòng thủ ổn định.';
        break;
      case 'neutral':
        description = 'Tâm lý thị trường đang ở mức trung lập và tương đối cân bằng. Dòng tiền đang luân chuyển tìm kiếm câu chuyện riêng của từng nhóm ngành.';
        break;
      case 'greed':
        description = 'Tâm lý hưng phấn và kỳ vọng tăng trưởng đang chiếm ưu thế. Thị trường giao dịch sôi động hơn, tuy nhiên cần lưu ý rủi ro khi mua đuổi giá cao.';
        break;
      case 'extreme greed':
        description = 'Thị trường đang ở mức cực kỳ hưng phấn và tham lam (FOMO). Giá nhiều cổ phiếu đã tăng nóng, nhà đầu tư nên thận trọng chuẩn bị cho các nhịp rung lắc kỹ thuật.';
        break;
      default:
        description = 'Tâm lý thị trường ổn định, nhà đầu tư đang theo dõi sát sao các chỉ số kinh tế vĩ mô để đưa ra quyết định phù hợp.';
    }

    return NextResponse.json({
      value: score,
      rating: rating,
      description: description,
      change: change,
      timestamp: data.fear_and_greed?.timestamp,
    });
  } catch (error) {
    console.error('Error fetching real Fear & Greed index:', error);
    // Fallback to safe default index values if external API fails
    return NextResponse.json({
      value: 32,
      rating: 'fear',
      description: 'Thị trường đang có dấu hiệu thận trọng trong bối cảnh bất ổn kinh tế. Các nhà đầu tư nên cân nhắc phân bổ tài sản phòng thủ.',
      change: -8.5,
      fallback: true
    });
  }
}

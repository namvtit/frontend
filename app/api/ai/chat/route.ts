import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getMockAIResponse } from "@/lib/ai/mock-agent";

const SYSTEM_INSTRUCTION = `Bạn là một trợ lý phân tích tài chính và giao dịch chứng khoán AI thông minh.
Luôn trả về JSON hợp lệ:
{"message": "Nội dung phản hồi", "cards": []}

Nguyên tắc:
1. message: Viết bằng tiếng Việt, không dùng Markdown, không emoji, không bullet list. Viết như chat thông thường.
2. Luôn trả về "cards": [] rỗng.
3. Khi người dùng chào hỏi đơn thuần, chỉ cần trả lời: "Chào bạn, mình là trợ lý phân tích tài chính và giao dịch chứng khoán. Mình có thể hỗ trợ bạn tra cứu thông tin cổ phiếu, phân tích kỹ thuật, đọc báo cáo tài chính, hay cập nhật tin tức thị trường. Bạn đang quan tâm đến mã cổ phiếu hay chủ đề nào, cứ cho mình biết nhé."
4. Với các câu hỏi khác, trả lời tự nhiên như chat thông thường.`;

function cleanAndParseJson(text: string) {
  let cleaned = text.trim();
  
  // Strip think tags using unicode code points for 【 and 】
  const t1 = String.fromCharCode(0x3010);
  const t2 = String.fromCharCode(0x3011);
  const thinkStart = t1 + "think" + t2;
  const thinkEnd = t1 + "/think" + t2;
  const thinkPattern = new RegExp(thinkStart + "[\\s\\S]*?" + thinkEnd, "gi");
  cleaned = cleaned.replace(thinkPattern, "");

  // Remove markdown codeblock wrapper if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const apiKey = process.env.TOKENROUTER_API_KEY;

    if (!apiKey) {
      const mockRes = await getMockAIResponse(message);
      return NextResponse.json({
        message: mockRes.message,
        cards: [],
        isMock: true,
      });
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_INSTRUCTION },
    ];

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.content && (msg.role === "user" || msg.role === "assistant")) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: message });

    const client = new OpenAI({
      baseURL: process.env.TOKENROUTER_BASE_URL || "https://api.tokenrouter.com/v1",
      apiKey,
    });

    let aiRawText = "{}";
    try {
      const completion = await client.chat.completions.create({
        model: process.env.TOKENROUTER_MODEL || "MiniMax-M3",
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });
      aiRawText = completion.choices[0]?.message?.content ?? "{}";
    } catch (providerError) {
      console.error("TokenRouter call failed, falling back to mock:", providerError);
      const mockRes = await getMockAIResponse(message);
      return NextResponse.json({
        message: mockRes.message,
        cards: [],
        isMock: true,
      });
    }

    let parsedResponse;
    try {
      parsedResponse = cleanAndParseJson(aiRawText);
    } catch (e) {
      console.error("Failed to parse TokenRouter response as JSON:", aiRawText, e);
      parsedResponse = {
        message: aiRawText,
        cards: [],
      };
    }

    return NextResponse.json({
      message: parsedResponse.message || "Không nhận được nội dung từ AI.",
      cards: [],
      isMock: false,
    });
  } catch (error: any) {
    console.error("Error in AI Chat API route:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi kết nối với máy chủ AI." },
      { status: 500 }
    );
  }
}

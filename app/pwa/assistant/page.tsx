import type { Metadata } from "next";
import { PwaAssistant } from "@/components/pwa/assistant/PwaAssistant";

export const metadata: Metadata = {
  title: "FinPilot AI Assistant",
  description: "FinPilot AI assistant presentation screen.",
};

export default function PwaAssistantPage() {
  return <PwaAssistant />;
}

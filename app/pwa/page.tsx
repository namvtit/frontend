import type { Metadata } from "next";
import { PwaHome } from "@/components/pwa/PwaHome";

export const metadata: Metadata = {
  title: "FinPilot Mobile",
  description: "FinPilot mobile market intelligence demo.",
};

export default function PwaPage() {
  return <PwaHome />;
}

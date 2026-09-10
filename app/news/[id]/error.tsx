"use client";
import Link from "next/link";

export default function Error({ unstable_retry }: { unstable_retry: () => void }) {
  return <div className="mx-auto max-w-3xl px-4 py-12 space-y-4"><p role="alert" className="text-muted-foreground">Không thể tải bài viết. Vui lòng thử lại.</p><button onClick={() => unstable_retry()} className="btn btn-primary">Thử lại</button><Link href="/news" className="block text-primary hover:underline">← Tin tức</Link></div>;
}

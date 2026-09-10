import Link from "next/link";

export default function NotFound() {
  return <div className="text-center py-20"><h1 className="text-2xl font-bold mb-2">Không tìm thấy tin tức</h1><p className="text-muted-foreground">Bài viết có thể đã hết hạn trong nguồn tin.</p><Link href="/news" className="btn btn-primary mt-4">Xem tất cả tin tức</Link></div>;
}

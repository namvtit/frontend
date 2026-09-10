"use client";
import { useState } from "react";

export default function ArticleImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  // Direct image only: avoid turning Next's image optimizer into a publisher proxy.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="w-full max-h-96 object-cover rounded-xl border border-border" />;
}

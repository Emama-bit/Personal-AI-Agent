"use client";

import { useEffect, useState } from "react";

export default function RatingStars({ proxyId }: { proxyId: string }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // 加载已有评分
  useEffect(() => {
    fetch(`/api/proxy/${proxyId}/rate`)
      .then((r) => r.json())
      .then((data) => {
        setAvgRating(data.avgRating || 0);
        setRatingCount(data.ratingCount || 0);
      })
      .catch(() => {});
  }, [proxyId]);

  async function submit() {
    if (!selected || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/proxy/${proxyId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars: selected, comment }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setAvgRating(data.avgRating);
        setRatingCount(data.ratingCount);
      }
    } catch {
      alert("提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 bg-white border border-border rounded-xl">
      {/* 已有评分概览 */}
      {ratingCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${
                  star <= Math.round(avgRating)
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-sm text-muted">
            {avgRating} / 5（{ratingCount} 人评价）
          </span>
        </div>
      )}

      {/* 评分表单 */}
      {submitted ? (
        <p className="text-sm text-green-600">感谢你的评价！</p>
      ) : (
        <>
          <p className="text-sm font-medium mb-2">给这个替身打个分</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`text-2xl transition-colors ${
                  star <= (hovered || selected)
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setSelected(star)}
              >
                ★
              </button>
            ))}
          </div>

          {selected > 0 && (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="留下你的评价（可选）"
                rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-2 resize-y"
              />
              <button
                onClick={submit}
                disabled={submitting}
                className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {submitting ? "提交中..." : "提交评价"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

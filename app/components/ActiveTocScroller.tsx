"use client";

import { useEffect, useRef } from "react";

type ActiveTocScrollerProps = {
  currentHref?: string;
};

export function ActiveTocScroller({ currentHref }: ActiveTocScrollerProps) {
  const sentinelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = sentinelRef.current?.closest<HTMLElement>(".reading-sidebar");
    if (!container) return;

    let animationFrame = 0;

    const centerCurrentItem = () => {
      const currentItem = container.querySelector<HTMLElement>('[aria-current="page"]');
      if (!currentItem || container.clientHeight === 0) return;

      const containerRect = container.getBoundingClientRect();
      const currentRect = currentItem.getBoundingClientRect();
      const centeredTop = container.scrollTop
        + currentRect.top
        - containerRect.top
        - (container.clientHeight - currentRect.height) / 2;
      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);

      container.scrollTo({
        top: Math.min(maxScrollTop, Math.max(0, centeredTop)),
        behavior: "auto",
      });
    };

    const scheduleCentering = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(centerCurrentItem);
    };

    scheduleCentering();

    const mobileDetails = container.closest(".mobile-reading-sidebar")?.querySelector("details");
    const handleToggle = () => {
      if (mobileDetails?.open) scheduleCentering();
    };
    mobileDetails?.addEventListener("toggle", handleToggle);

    return () => {
      cancelAnimationFrame(animationFrame);
      mobileDetails?.removeEventListener("toggle", handleToggle);
    };
  }, [currentHref]);

  return <span ref={sentinelRef} className="toc-auto-center-sentinel" aria-hidden="true" />;
}

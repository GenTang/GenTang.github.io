"use client";

import { useLayoutEffect, useRef } from "react";

const storageKey = "deconstructing-llm-open-chapters";

function chapterDetails(element: HTMLElement | null) {
  const tableOfContents = element?.closest<HTMLElement>(".book-toc");
  return tableOfContents
    ? Array.from(tableOfContents.querySelectorAll<HTMLDetailsElement>(".toc-chapter"))
    : [];
}

function rememberOpenChapters(details: HTMLDetailsElement[]) {
  const openChapterIds = details
    .filter((detail) => detail.open)
    .map((detail) => detail.dataset.chapterId)
    .filter((chapterId): chapterId is string => Boolean(chapterId));

  sessionStorage.setItem(storageKey, JSON.stringify(openChapterIds));
}

export function BookTocControls({ currentChapterId }: { currentChapterId?: string }) {
  const controlsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const details = chapterDetails(controlsRef.current);
    const storedChapterIds = sessionStorage.getItem(storageKey);

    if (storedChapterIds !== null) {
      try {
        const openChapterIds = new Set<string>(JSON.parse(storedChapterIds));
        if (currentChapterId) openChapterIds.add(currentChapterId);

        details.forEach((detail) => {
          detail.open = Boolean(detail.dataset.chapterId && openChapterIds.has(detail.dataset.chapterId));
        });
        rememberOpenChapters(details);
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    }

    const handleToggle = () => rememberOpenChapters(details);
    details.forEach((detail) => detail.addEventListener("toggle", handleToggle));

    return () => {
      details.forEach((detail) => detail.removeEventListener("toggle", handleToggle));
    };
  }, [currentChapterId]);

  const setAllChapters = (open: boolean) => {
    const details = chapterDetails(controlsRef.current);
    details.forEach((detail) => {
      detail.open = open;
    });
    rememberOpenChapters(details);
  };

  return (
    <div className="book-toc-controls" ref={controlsRef}>
      <button type="button" onClick={() => setAllChapters(true)}>全部展开</button>
      <span aria-hidden="true">·</span>
      <button type="button" onClick={() => setAllChapters(false)}>全部收起</button>
    </div>
  );
}

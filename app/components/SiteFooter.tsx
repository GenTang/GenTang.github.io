export function SiteFooter({ lang }: { lang: "zh" | "en" }) {
  return (
    <footer className="site-footer" id="about">
      <div>
        <strong>小胖笔记</strong>
        <p>{lang === "zh" ? "把复杂的问题想清楚，再慢慢写下来。" : "Think through hard questions, then write them down slowly."}</p>
      </div>
      <div className="footer-meta">
        <span>© 2026 Xiaopang Notes</span>
        <span>{lang === "zh" ? "保持好奇，保持校准。" : "Stay curious. Stay calibrated."}</span>
      </div>
    </footer>
  );
}

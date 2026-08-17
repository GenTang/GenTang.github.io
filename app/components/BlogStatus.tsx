import { sitePath } from "@/app/lib/sitePath";

type BlogStatusContent = {
  sectionLabel: string;
  sectionTitle: string;
  sectionDescription: string;
  date: string;
  title: string;
  topic: string;
  href: string;
  available: boolean;
};

type BlogStatusProps = {
  essay: BlogStatusContent;
  headingLevel?: "h1" | "h2";
};

export function BlogStatus({ essay, headingLevel = "h2" }: BlogStatusProps) {
  const Heading = headingLevel;

  return (
    <section className="content-section essay-section">
      <div className="section-heading">
        <div>
          <span>{essay.sectionLabel}</span>
          {essay.sectionTitle && <Heading>{essay.sectionTitle}</Heading>}
        </div>
        {essay.sectionDescription && <p>{essay.sectionDescription}</p>}
      </div>
      {essay.available ? (
        <a className="essay-row" href={sitePath(essay.href)}>
          <span className="essay-date">{essay.date}</span>
          <span className="essay-title">{essay.title}</span>
          <span className="essay-topic">{essay.topic}</span>
          <span className="essay-arrow">↗</span>
        </a>
      ) : (
        <div className="essay-row is-disabled" aria-label={essay.title}>
          <span className="essay-date">{essay.date}</span>
          <span className="essay-title">{essay.title}</span>
          <span className="essay-topic">{essay.topic}</span>
          <span className="essay-arrow">…</span>
        </div>
      )}
    </section>
  );
}

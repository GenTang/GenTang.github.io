import { sitePath } from "@/app/lib/sitePath";

type BlogPostContent = {
  date: string;
  title: string;
  topic: string;
  href: string;
  available: boolean;
};

type BlogStatusContent = {
  sectionLabel: string;
  sectionTitle: string;
  sectionDescription: string;
  posts: BlogPostContent[];
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
      {essay.posts.map((post) => post.available ? (
        <a className="essay-row" href={sitePath(post.href)} key={post.href}>
          <span className="essay-date">{post.date}</span>
          <span className="essay-title">{post.title}</span>
          <span className="essay-topic">{post.topic}</span>
          <span className="essay-arrow">↗</span>
        </a>
      ) : (
        <div className="essay-row is-disabled" aria-label={post.title} key={post.href}>
          <span className="essay-date">{post.date}</span>
          <span className="essay-title">{post.title}</span>
          <span className="essay-topic">{post.topic}</span>
          <span className="essay-arrow">…</span>
        </div>
      ))}
    </section>
  );
}

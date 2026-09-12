type StaticRedirectProps = {
  target: string;
  title: string;
  message: string;
  linkLabel?: string;
};

export function StaticRedirect({
  target,
  title,
  message,
  linkLabel = "继续访问",
}: StaticRedirectProps) {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <main className="root-language-entry">
        <h1>{title}</h1>
        <p>
          {message}{" "}
          <a href={target}>{linkLabel}</a>
        </p>
      </main>
    </>
  );
}

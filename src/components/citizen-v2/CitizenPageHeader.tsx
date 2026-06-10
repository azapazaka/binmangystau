import type { ReactNode } from "react";

export function CitizenPageHeader({
  title,
  subtitle,
}: {
  title: ReactNode;
  subtitle: string;
}) {
  if (!title && !subtitle) return null;
  return (
    <header className="citizen-v2-page-header">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  );
}

import type { ReactNode } from "react";

import { CitizenPageHeader } from "@/components/citizen-v2/CitizenPageHeader";
import { CitizenSidebar } from "@/components/citizen-v2/CitizenSidebar";
import { CitizenTopbar } from "@/components/citizen-v2/CitizenTopbar";

export function CitizenShell({
  title,
  subtitle,
  children,
  topbarAction,
}: {
  title?: ReactNode;
  subtitle?: string;
  children: ReactNode;
  topbarAction?: ReactNode;
}) {
  return (
    <div className="citizen-v2-scene">
      <div className="citizen-v2-frame">
        <CitizenSidebar />
        <div className="citizen-v2-main">
          <CitizenTopbar action={topbarAction} />
          <div className="citizen-v2-content">
            <CitizenPageHeader title={title ?? ""} subtitle={subtitle ?? ""} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

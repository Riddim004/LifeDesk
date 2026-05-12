import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Panel({ title, subtitle, children, className, actions }: PanelProps) {
  return (
    <section className={cn("rounded-[28px] border border-[color:var(--border-soft)] bg-[color:var(--panel)] p-6 shadow-[var(--panel-shadow)] backdrop-blur-sm", className)}>
      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title ? <h2 className="text-sm font-semibold tracking-[0.2em] text-[color:var(--text-strong)] uppercase">{title}</h2> : null}
            {subtitle ? <p className="mt-2 text-sm text-[color:var(--text-soft)]">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

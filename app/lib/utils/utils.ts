import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AuditActor = {
  id: string;
  displayName: string | null;
  name: string | null;
};

export function actorLabel(actor: AuditActor | null | undefined): string {
  return actor?.name ?? actor?.displayName ?? "Unknown user";
}

export function formatBugId(id: number): string {
  return `BUG-${String(id).padStart(4, "0")}`;
}

export function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

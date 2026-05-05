"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export interface B2BInternalNotesProps {
  offerId: string;
  initialNotes: string | null;
  canEdit: boolean;
}

export function B2BInternalNotes({ offerId, initialNotes, canEdit }: B2BInternalNotesProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialNotes ?? "");
  const lastSaved = useRef(initialNotes ?? "");

  async function save(next: string) {
    if (next === lastSaved.current) return;
    const res = await fetch(`/api/admin/b2b/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internal_notes: next.trim() ? next.trim() : null }),
    });
    if (res.ok) {
      lastSaved.current = next.trim();
      router.refresh();
    }
  }

  if (!canEdit) {
    return (
      <section className="rounded-xl bg-white p-6">
        <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
          Internal notes
        </p>
        <p className="whitespace-pre-wrap font-sans text-sm text-[#555]">
          {initialNotes?.trim() || "—"}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6">
      <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
        Internal notes
      </p>
      <p className="mb-2 font-sans text-xs text-[#888]">Not visible to buyer · saves on blur</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => void save(value)}
        rows={4}
        className="w-full rounded-lg border border-[#D0D0CA] px-3.5 py-2.5 font-sans text-sm text-[#333] focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
      />
    </section>
  );
}

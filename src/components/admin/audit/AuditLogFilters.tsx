"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export const AUDIT_SECTION_OPTIONS = [
  { value: "", label: "All sections" },
  { value: "products", label: "products" },
  { value: "orders", label: "orders" },
  { value: "b2b", label: "b2b" },
  { value: "content", label: "content" },
  { value: "blog", label: "blog" },
  { value: "projects", label: "projects" },
  { value: "certifications", label: "certifications" },
  { value: "swatches", label: "swatches" },
  { value: "users", label: "users" },
  { value: "workflows", label: "workflows" },
  { value: "audit_log", label: "audit_log" },
  { value: "erp_sync", label: "erp_sync" },
  { value: "ai_leads", label: "ai_leads" },
  { value: "settings", label: "settings" },
];

export interface AuditLogFiltersProps {
  search: string;
  source: string;
  section: string;
  startDate: string;
  endDate: string;
  onSearchChange: (v: string) => void;
  onSourceChange: (v: string) => void;
  onSectionChange: (v: string) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onApply: () => void;
}

const SOURCE_OPTS = [
  { value: "", label: "All sources" },
  { value: "dashboard", label: "dashboard" },
  { value: "erp", label: "erp" },
  { value: "ai", label: "ai" },
  { value: "system", label: "system" },
];

export function AuditLogFilters({
  search,
  source,
  section,
  startDate,
  endDate,
  onSearchChange,
  onSourceChange,
  onSectionChange,
  onStartDateChange,
  onEndDateChange,
  onApply,
}: AuditLogFiltersProps) {
  return (
    <div className="rounded-xl border border-[#E8E8E4] bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Search (user email or action)"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          label="Source"
          options={SOURCE_OPTS}
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
        />
        <Select
          label="Section"
          options={AUDIT_SECTION_OPTIONS}
          value={section}
          onChange={(e) => onSectionChange(e.target.value)}
        />
        <Input label="From date" type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
        <Input label="To date" type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={onApply}
          className="rounded-lg bg-[#1a1a2e] px-4 py-2 font-sans text-[13px] font-medium text-white transition-colors hover:bg-[#2D2D4E]"
        >
          Apply filters
        </button>
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/Badge";

export interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div
      className={`w-full border-b border-[#E0DED4] ${className}`.trim()}
      role="tablist"
    >
      <div className="flex flex-wrap gap-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={[
                "inline-flex items-center px-4 py-2.5 font-sans text-[13px] font-medium transition-colors duration-150 ease-in-out motion-reduce:transition-none",
                "border-b-2 -mb-px bg-transparent",
                isActive
                  ? "border-[#E8A020] text-[#1a1a2e]"
                  : "border-transparent text-[#666666] hover:text-[#1a1a2e]",
              ].join(" ")}
            >
              {tab.label}
              {typeof tab.count === "number" ? (
                <Badge variant="navy" size="sm" className="ml-1.5 min-w-5 px-2">
                  {tab.count}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

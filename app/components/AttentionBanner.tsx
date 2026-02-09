"use client";

import { useState } from "react";

interface AttentionBannerProps {
  analysis: any;
  expectedBehavior?: string;
  timeWindow?: string;
}

export default function AttentionBanner({
  analysis,
  expectedBehavior,
  timeWindow,
}: AttentionBannerProps) {
  if (!analysis) return null;

  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);

  const rootCause =
    analysis.causality_analysis?.probable_root_cause ||
    "Analysis in progress...";
  const priorities = analysis.attention_priority || [];
  const summary = analysis.summary || "";
  const misleadingEvidence = analysis.causality_analysis?.misleading_evidence;

  const hasCriticalAnomalies = analysis.anomalies?.some(
    (a: any) => a.severity === "critical",
  );
  const severity = hasCriticalAnomalies ? "critical" : "warning";

  return (
    <div className="space-y-3">
      {/* Alert Strip */}
      <div
        className={`border rounded-lg overflow-hidden ${
          severity === "critical"
            ? "border-red-500/50 bg-red-500/10"
            : "border-yellow-500/50 bg-yellow-500/10"
        }`}
      >
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                  severity === "critical"
                    ? "bg-red-500/20 border-red-500"
                    : "bg-yellow-500/20 border-yellow-500"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${severity === "critical" ? "text-red-500" : "text-yellow-500"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2
                  className={`text-lg font-mono font-bold tracking-tight ${
                    severity === "critical" ? "text-red-400" : "text-yellow-400"
                  }`}
                >
                  ROOT CAUSE
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                    severity === "critical"
                      ? "bg-red-500/20 text-red-400 border border-red-500"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                  }`}
                >
                  {severity}
                </span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed font-mono">
                {rootCause}
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic font-mono">
                AI-generated • May contain errors
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: Action Items */}
        <div className="lg:col-span-2 border border-border rounded-lg bg-card overflow-hidden">
          <div className="bg-muted/50 px-6 py-3 border-b border-border">
            <h3 className="text-sm font-mono font-semibold uppercase tracking-wider">
              Investigation Priorities
            </h3>
          </div>

          <div className="divide-y divide-border">
            {priorities.slice(0, 3).map((item: any, index: number) => {
              const isSelected = selectedPriority === index;
              const colors = [
                { dot: "bg-red-500", hover: "hover:bg-red-500/5" },
                { dot: "bg-yellow-500", hover: "hover:bg-yellow-500/5" },
                { dot: "bg-blue-500", hover: "hover:bg-blue-500/5" },
              ];

              return (
                <div key={index}>
                  <button
                    onClick={() =>
                      setSelectedPriority(isSelected ? null : index)
                    }
                    className={`w-full px-6 py-4 flex items-center gap-4 transition-colors ${colors[index].hover} ${
                      isSelected ? "bg-muted/50" : ""
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 ${colors[index].dot} rounded-full flex items-center justify-center text-background text-sm font-mono font-bold`}
                    >
                      {item.priority || index + 1}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-mono text-foreground leading-tight">
                        {item.focus_area}
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isSelected && (
                    <div className="px-6 py-4 bg-muted/30 border-t border-border">
                      <p className="text-sm font-mono text-foreground/80 leading-relaxed">
                        {item.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Context Panels */}
        <div className="space-y-3">
          {/* Context Info */}
          {(timeWindow || expectedBehavior) && (
            <div className="border border-border rounded-lg bg-card px-4 py-3 space-y-3">
              {timeWindow && (
                <div className="pb-3 border-b border-border">
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-1">
                    Time Window
                  </div>
                  <div className="text-sm font-mono text-foreground">
                    {timeWindow}
                  </div>
                </div>
              )}
              {expectedBehavior && (
                <div>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-1">
                    Expected
                  </div>
                  <div className="text-sm font-mono text-foreground">
                    {expectedBehavior}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Red Herring */}
          {misleadingEvidence && (
            <div className="border border-yellow-500/50 rounded-lg bg-yellow-500/10 overflow-hidden">
              <div className="px-4 py-3 bg-yellow-500/20 border-b border-yellow-500/50">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wide text-yellow-400 flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Red Herring
                </h4>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-mono text-yellow-200/90 leading-relaxed">
                  {misleadingEvidence}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

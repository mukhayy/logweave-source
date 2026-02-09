interface EventDetailsProps {
  event: any;
  onClose: () => void;
}

export default function EventDetails({ event, onClose }: EventDetailsProps) {
  if (!event) return null;

  const getSeverity = (event: any): string => {
    if (event.confidence === "low" || event.ambiguity_note) return "warning";
    if (
      event.event?.toLowerCase().includes("error") ||
      event.event?.toLowerCase().includes("failed")
    )
      return "error";
    if (
      event.event?.toLowerCase().includes("warn") ||
      event.event?.toLowerCase().includes("slow")
    )
      return "warning";
    return "info";
  };

  const severity = getSeverity(event);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-card border-l border-border z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-mono font-semibold">Event Details</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Service Badge */}
          <div>
            <span className="inline-block px-3 py-1 text-xs font-mono bg-muted text-foreground rounded border border-border">
              {event.service}
            </span>
          </div>

          {/* Timestamp */}
          <div>
            <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-1">
              Timestamp
            </h4>
            <p className="text-sm font-mono text-foreground">
              {event.timestamp}
            </p>
          </div>

          {/* Event Description */}
          <div>
            <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-1">
              Event
            </h4>
            <p className="text-sm font-mono text-foreground leading-relaxed">
              {event.event}
            </p>
          </div>

          {/* Confidence Level */}
          <div>
            <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-1">
              Confidence
            </h4>
            <span
              className={`inline-block px-2 py-1 text-xs font-mono rounded border ${
                event.confidence === "high"
                  ? "bg-green-500/20 text-green-400 border-green-500"
                  : event.confidence === "medium"
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500"
                    : "bg-red-500/20 text-red-400 border-red-500"
              }`}
            >
              {event.confidence?.toUpperCase()}
            </span>
          </div>

          {/* Ambiguity Note */}
          {event.ambiguity_note && (
            <div className="border border-yellow-500/50 bg-yellow-500/10 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 text-yellow-500 flex-shrink-0"
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
                <div>
                  <h4 className="text-xs font-mono font-semibold text-yellow-400 uppercase tracking-wide mb-1">
                    Ambiguous Ordering
                  </h4>
                  <p className="text-xs font-mono text-yellow-200/90 leading-relaxed">
                    {event.ambiguity_note}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Insight */}
          <div className="border border-blue-500/50 bg-blue-500/10 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="h-5 w-5 text-blue-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <div>
                <h4 className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wide mb-1">
                  AI Insight
                </h4>
                <p className="text-xs font-mono text-blue-200/90 leading-relaxed">
                  {event.confidence === "low" || event.ambiguity_note
                    ? "This event's timing is uncertain due to logging delays or clock differences."
                    : severity === "error"
                      ? "This error may be a symptom of an upstream issue. Check timeline for root causes."
                      : "This event appears to have executed normally based on the logs."}
                </p>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <details className="text-xs">
            <summary className="cursor-pointer font-mono text-muted-foreground hover:text-foreground">
              Raw Event Data
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
              {JSON.stringify(event, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </>
  );
}

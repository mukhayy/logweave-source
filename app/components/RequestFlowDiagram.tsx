"use client";

interface RequestFlowDiagramProps {
  analysis: any;
  parsedLogs?: any[];
}

interface FlowNode {
  service: string;
  spanId: string;
  parentSpanId?: string;
  events: any[];
  startTime: number;
  endTime: number;
  duration: number;
  hasError: boolean;
  hasWarning: boolean;
}

export default function RequestFlowDiagram({
  analysis,
  parsedLogs,
}: RequestFlowDiagramProps) {
  if (!analysis || !analysis.timeline) return null;

  const timeline = analysis.timeline || [];

  // Extract trace info - use parsedLogs if available
  const extractTraceInfo = (event: any) => {
    // First try to find in parsedLogs by matching timestamp and service
    if (parsedLogs) {
      const matching = parsedLogs.find(
        (log: any) =>
          log.service === event.service &&
          log.timestamp?.includes(event.timestamp?.substring(11, 23)),
      );

      if (matching && matching.trace_id) {
        return {
          traceId: matching.trace_id,
          spanId: matching.span_id,
          parentSpanId: matching.parent_span_id,
        };
      }
    }

    // Fallback to parsing from event text
    return {
      traceId: event.event?.match(/trace_id=(\S+)/)?.[1],
      spanId: event.event?.match(/span_id=(\S+)/)?.[1],
      parentSpanId: event.event?.match(/parent_span_id=(\S+)/)?.[1],
    };
  };

  // Check if logs have trace IDs
  const hasTraceIds = parsedLogs
    ? parsedLogs.some((log: any) => log.trace_id || log.span_id)
    : timeline.some((e: any) => {
        const info = extractTraceInfo(e);
        return info.traceId || info.spanId;
      });

  if (!hasTraceIds) {
    return (
      <div className="border border-border rounded-lg bg-card p-6">
        <h2 className="text-base font-mono font-semibold mb-4">Request Flow</h2>
        <div className="text-center py-12">
          <div className="text-muted-foreground text-sm font-mono mb-2">
            No trace IDs detected in logs
          </div>
          <div className="text-muted-foreground text-xs font-mono">
            Logs need trace_id, span_id, and parent_span_id fields to visualize
            request flow
          </div>
        </div>
      </div>
    );
  }

  // Parse time
  const parseTime = (timestamp: string): number => {
    const match = timestamp.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
    if (!match) return 0;
    const [, hours, minutes, seconds, ms] = match;
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(seconds) +
      parseInt(ms) / 1000
    );
  };

  // Build nodes from events
  const spanMap = new Map<string, FlowNode>();

  timeline.forEach((event: any) => {
    const info = extractTraceInfo(event);
    if (!info.spanId) return;

    if (!spanMap.has(info.spanId)) {
      spanMap.set(info.spanId, {
        service: event.service,
        spanId: info.spanId,
        parentSpanId: info.parentSpanId,
        events: [],
        startTime: Infinity,
        endTime: 0,
        duration: 0,
        hasError: false,
        hasWarning: false,
      });
    }

    const node = spanMap.get(info.spanId)!;
    node.events.push(event);

    const time = parseTime(event.timestamp);
    node.startTime = Math.min(node.startTime, time);
    node.endTime = Math.max(node.endTime, time);

    // Mark as error/warning based on Gemini's anomaly detection
    const isInAnomalies = analysis.anomalies?.some(
      (anomaly: any) =>
        anomaly.service === event.service && anomaly.severity === "critical",
    );

    const isInWarnings = analysis.anomalies?.some(
      (anomaly: any) =>
        anomaly.service === event.service && anomaly.severity === "warning",
    );

    if (isInAnomalies || event.event.toLowerCase().includes("error"))
      node.hasError = true;
    if (isInWarnings || event.event.toLowerCase().includes("warn"))
      node.hasWarning = true;
  });

  // Calculate durations
  spanMap.forEach((node) => {
    node.duration = Math.round((node.endTime - node.startTime) * 1000); // to ms
  });

  // Build tree structure
  const rootNodes: FlowNode[] = [];
  const childrenMap = new Map<string, FlowNode[]>();

  spanMap.forEach((node) => {
    if (!node.parentSpanId) {
      rootNodes.push(node);
    } else {
      if (!childrenMap.has(node.parentSpanId)) {
        childrenMap.set(node.parentSpanId, []);
      }
      childrenMap.get(node.parentSpanId)!.push(node);
    }
  });

  // Render tree recursively
  const renderNode = (node: FlowNode, depth: number = 0): JSX.Element => {
    const children = childrenMap.get(node.spanId) || [];
    const indent = depth * 40;

    return (
      <div key={node.spanId} className="mb-2">
        <div
          className="flex items-center gap-3"
          style={{ paddingLeft: `${indent}px` }}
        >
          {/* Connection line */}
          {depth > 0 && <div className="w-8 h-px bg-border"></div>}

          {/* Node card */}
          <div
            className={`flex-1 border rounded px-4 py-3 ${
              node.hasError
                ? "border-red-500/50 bg-red-500/10"
                : node.hasWarning
                  ? "border-yellow-500/50 bg-yellow-500/10"
                  : "border-border bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Service badge */}
                <div
                  className={`px-2 py-1 rounded text-xs font-mono font-semibold ${
                    node.hasError
                      ? "bg-red-500 text-white"
                      : node.hasWarning
                        ? "bg-yellow-500 text-white"
                        : "bg-blue-500 text-white"
                  }`}
                >
                  {node.service}
                </div>

                {/* Event count */}
                <span className="text-xs font-mono text-muted-foreground">
                  {node.events.length} event
                  {node.events.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Duration */}
              <div className="text-xs font-mono">
                <span
                  className={`font-semibold ${
                    node.duration > 1000
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {node.duration}ms
                </span>
              </div>
            </div>

            {/* Key events */}
            <div className="mt-2 space-y-1">
              {node.events.slice(0, 2).map((event: any, idx: number) => (
                <div
                  key={idx}
                  className="text-xs font-mono text-foreground/70 truncate"
                >
                  •{" "}
                  {event.event
                    .replace(/trace_id=\S+/g, "")
                    .replace(/span_id=\S+/g, "")
                    .replace(/parent_span_id=\S+/g, "")
                    .trim()}
                </div>
              ))}
              {node.events.length > 2 && (
                <div className="text-xs font-mono text-muted-foreground">
                  +{node.events.length - 2} more
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Render children */}
        {children.length > 0 && (
          <div className="mt-2">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-mono font-semibold">Request Flow</h2>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Hierarchical view of service interactions
        </p>
      </div>

      <div className="p-6">{rootNodes.map((node) => renderNode(node, 0))}</div>

      {/* Legend */}
      <div className="border-t border-border px-6 py-3 flex items-center gap-6 text-xs font-mono">
        <span className="text-muted-foreground">Status:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span>Error</span>
        </div>
      </div>
    </div>
  );
}

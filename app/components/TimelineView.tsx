"use client";

import { useState } from "react";

interface TimelineViewProps {
  analysis: any;
  onEventClick: (event: any) => void;
}

export default function TimelineView({
  analysis,
  onEventClick,
}: TimelineViewProps) {
  if (!analysis || !analysis.timeline) return null;

  const [zoom, setZoom] = useState(1);
  const [filterSeverity, setFilterSeverity] = useState<string[]>(["all"]);

  const timeline = analysis.timeline || [];

  // Get unique services
  const services = Array.from(
    new Set(timeline.map((e: any) => e.service)),
  ) as string[];

  // Group events by service
  const eventsByService: Record<string, any[]> = {};
  services.forEach((service) => {
    eventsByService[service] = timeline.filter(
      (e: any) => e.service === service,
    );
  });

  // Get severity from event
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

  // Filter events
  const filteredEvents = filterSeverity.includes("all")
    ? timeline
    : timeline.filter((e: any) => {
        const severity = getSeverity(e);
        return filterSeverity.includes(severity);
      });

  // Get color for severity
  const getColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-green-500";
    }
  };

  // Parse timestamp to seconds
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

  // Get global time range (across all services)
  const allTimes = timeline
    .map((e: any) => parseTime(e.timestamp))
    .filter((t: number) => t > 0);
  const globalMinTime = Math.min(...allTimes);
  const globalMaxTime = Math.max(...allTimes);
  const globalDuration = globalMaxTime - globalMinTime;

  // Calculate position percentage within global range
  const getPosition = (timestamp: string) => {
    const time = parseTime(timestamp);
    return ((time - globalMinTime) / globalDuration) * 100;
  };

  // Get service time range
  const getServiceRange = (service: string) => {
    const serviceTimes = eventsByService[service]
      .map((e) => parseTime(e.timestamp))
      .filter((t) => t > 0);

    const minTime = Math.min(...serviceTimes);
    const maxTime = Math.max(...serviceTimes);

    const startPercent = ((minTime - globalMinTime) / globalDuration) * 100;
    const endPercent = ((maxTime - globalMinTime) / globalDuration) * 100;

    return { startPercent, endPercent, minTime, maxTime };
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      {/* Header with filters */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-mono font-semibold">Event Timeline</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="px-2 py-1 text-xs font-mono border border-border rounded hover:bg-muted"
            >
              -
            </button>
            <span className="text-xs font-mono text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="px-2 py-1 text-xs font-mono border border-border rounded hover:bg-muted"
            >
              +
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Severity
          </span>
          {["all", "info", "warning", "error"].map((severity) => (
            <button
              key={severity}
              onClick={() => {
                if (severity === "all") {
                  setFilterSeverity(["all"]);
                } else {
                  const newFilter = filterSeverity.includes(severity)
                    ? filterSeverity.filter((s) => s !== severity)
                    : [...filterSeverity.filter((s) => s !== "all"), severity];

                  setFilterSeverity(
                    newFilter.length === 0 ? ["all"] : newFilter,
                  );
                }
              }}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                filterSeverity.includes(severity)
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline - Service Swimlanes */}
      <div className="p-6">
        {/* Time axis */}
        <div className="mb-6 pl-40">
          <div className="flex justify-between text-xs font-mono text-muted-foreground mb-2">
            <span>{timeline[0]?.timestamp?.substring(11, 23) || "Start"}</span>
            <span>
              {timeline[timeline.length - 1]?.timestamp?.substring(11, 23) ||
                "End"}
            </span>
          </div>
        </div>

        {/* Service lanes */}
        <div className="space-y-6">
          {services.map((service) => {
            const range = getServiceRange(service);
            const serviceEvents = eventsByService[service].filter((e: any) => {
              if (filterSeverity.includes("all")) return true;
              const severity = getSeverity(e);
              return filterSeverity.includes(severity);
            });

            if (serviceEvents.length === 0) return null;

            return (
              <div key={service} className="flex items-center gap-4">
                {/* Service label */}
                <div className="w-36 flex-shrink-0">
                  <div className="text-sm font-mono font-semibold text-foreground">
                    {service}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {serviceEvents.length} events
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 relative h-12">
                  {/* Service-specific timeline bar */}
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 h-[2px] bg-border"
                    style={{
                      left: `${range.startPercent}%`,
                      width: `${range.endPercent - range.startPercent}%`,
                    }}
                  ></div>

                  {/* Events */}
                  {serviceEvents.map((event: any, index: number) => {
                    const severity = getSeverity(event);
                    const color = getColor(severity);
                    const position = getPosition(event.timestamp);

                    return (
                      <div
                        key={index}
                        className="absolute top-1/2 transform -translate-y-1/2 group cursor-pointer"
                        style={{ left: `${position}%` }}
                        onClick={() => onEventClick(event)}
                      >
                        {/* Dot */}
                        <div
                          className={`w-4 h-4 rounded-full ${color} border-2 border-background group-hover:scale-150 transition-transform relative z-10`}
                        >
                          {event.ambiguity_note && (
                            <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs">
                              ⚠️
                            </span>
                          )}
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          <div className="bg-card border border-border rounded px-3 py-2 shadow-lg">
                            <div className="text-xs font-mono text-foreground font-semibold mb-1">
                              {event.timestamp?.substring(11, 23)}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground max-w-xs">
                              {event.event.length > 60
                                ? event.event.substring(0, 60) + "..."
                                : event.event}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-border px-6 py-3 flex items-center gap-6 text-xs font-mono">
        <span className="text-muted-foreground">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Success</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Info</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Error</span>
        </div>
      </div>
    </div>
  );
}

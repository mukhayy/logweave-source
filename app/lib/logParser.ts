// Log Parser - Extracts service information from interleaved log files

export interface ParsedLog {
  raw: string;
  timestamp: string | null;
  service: string;
  level: string | null;
  req_id: string | null;
  trace_id: string | null;
  span_id: string | null;
  parent_span_id: string | null;
  line_number: number;
}

export interface ServicePattern {
  type: "regex" | "json" | "unknown";
  extract: (line: string) => string | null;
}

/**
 * Detect how services are identified in the log file
 */
export function detectServicePattern(sampleLines: string[]): ServicePattern {
  // Pattern 1: service=VALUE
  if (sampleLines.some((line) => /service=[\w-]+/.test(line))) {
    return {
      type: "regex",
      extract: (line) => {
        const match = line.match(/service=([\w-]+)/);
        return match ? match[1] : null;
      },
    };
  }

  // Pattern 2: JSON with service field
  if (sampleLines.some((line) => line.trim().startsWith("{"))) {
    return {
      type: "json",
      extract: (line) => {
        try {
          const obj = JSON.parse(line);
          return obj.service || obj.service_name || obj.app || null;
        } catch {
          return null;
        }
      },
    };
  }

  // Pattern 3: [service-name] at start
  if (sampleLines.some((line) => /^\[[\w-]+\]/.test(line))) {
    return {
      type: "regex",
      extract: (line) => {
        const match = line.match(/^\[([\w-]+)\]/);
        return match ? match[1] : null;
      },
    };
  }

  // Pattern 4: Kubernetes pod name (service-name-deployment-xyz)
  if (
    sampleLines.some(
      (line) =>
        /[\w-]+-deployment-[\w]+/.test(line) || /[\w-]+-pod-[\w]+/.test(line),
    )
  ) {
    return {
      type: "regex",
      extract: (line) => {
        const deploymentMatch = line.match(/([\w-]+)-deployment/);
        if (deploymentMatch) return deploymentMatch[1];

        const podMatch = line.match(/([\w-]+)-pod/);
        if (podMatch) return podMatch[1];

        return null;
      },
    };
  }

  // Can't detect automatically
  return {
    type: "unknown",
    extract: () => "unknown-service",
  };
}

/**
 * Extract timestamp from log line (supports multiple formats)
 */
export function extractTimestamp(line: string): string | null {
  // ISO format: 2024-02-07T14:23:00.891Z or 2024-02-07 14:23:00.891
  const iso = line.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.,]\d{3}/);
  if (iso) return iso[0];

  // Syslog format: Feb 07 14:23:00
  const syslog = line.match(/\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/);
  if (syslog) return syslog[0];

  // Epoch timestamp
  const epoch = line.match(/\b\d{10,13}\b/);
  if (epoch) {
    const timestamp = parseInt(epoch[0]);
    const date = new Date(
      timestamp.toString().length === 10 ? timestamp * 1000 : timestamp,
    );
    return date.toISOString();
  }

  return null;
}

/**
 * Extract log level (INFO, WARN, ERROR, DEBUG, etc.)
 */
export function extractLogLevel(line: string): string | null {
  const match = line.match(/\b(INFO|WARN|ERROR|DEBUG|FATAL|TRACE|CRITICAL)\b/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Extract request/correlation ID
 */
export function extractReqId(line: string): string | null {
  const patterns = [
    /req_id=([a-zA-Z0-9_-]+)/,
    /request_id=([a-zA-Z0-9_-]+)/,
    /correlation_id=([a-zA-Z0-9_-]+)/,
    /trace_id=([a-zA-Z0-9_-]+)/,
    /"request_id":"([^"]+)"/,
    /"correlation_id":"([^"]+)"/,
    /"trace_id":"([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract trace ID
 */
export function extractTraceId(line: string): string | null {
  const match = line.match(/trace_id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Extract span ID
 */
export function extractSpanId(line: string): string | null {
  const match = line.match(/span_id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Extract parent span ID
 */
export function extractParentSpanId(line: string): string | null {
  const match = line.match(/parent_span_id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Parse interleaved log file into structured format
 */
export function parseInterleavedLogs(fileContent: string): {
  logs: ParsedLog[];
  pattern: ServicePattern;
  services: Set<string>;
} {
  const lines = fileContent.split("\n").filter((line) => line.trim());

  // Detect pattern from first 20 lines
  const sampleLines = lines.slice(0, Math.min(20, lines.length));
  const pattern = detectServicePattern(sampleLines);

  const logs: ParsedLog[] = [];
  const services = new Set<string>();

  lines.forEach((line, index) => {
    const timestamp = extractTimestamp(line);
    const service = pattern.extract(line) || "unknown";
    const level = extractLogLevel(line);
    const req_id = extractReqId(line);
    const trace_id = extractTraceId(line);
    const span_id = extractSpanId(line);
    const parent_span_id = extractParentSpanId(line);

    services.add(service);

    logs.push({
      raw: line,
      timestamp,
      service,
      level,
      req_id,
      trace_id,
      span_id,
      parent_span_id,
      line_number: index + 1,
    });
  });

  return { logs, pattern, services };
}

/**
 * Group parsed logs by service
 */
export function groupByService(logs: ParsedLog[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const log of logs) {
    if (!grouped[log.service]) {
      grouped[log.service] = [];
    }
    grouped[log.service].push(log.raw);
  }

  return grouped;
}

/**
 * Filter logs by request ID
 */
export function filterByRequestId(
  logs: ParsedLog[],
  reqId: string,
): ParsedLog[] {
  return logs.filter((log) => log.req_id === reqId);
}

/**
 * Get all unique request IDs
 */
export function getRequestIds(logs: ParsedLog[]): string[] {
  const reqIds = new Set<string>();
  logs.forEach((log) => {
    if (log.req_id) reqIds.add(log.req_id);
  });
  return Array.from(reqIds);
}

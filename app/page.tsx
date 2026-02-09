"use client";

import { useState } from "react";
import AttentionBanner from "./components/AttentionBanner";
import TimelineView from "./components/TimelineView";
import EventDetails from "./components/EventDetails";
import { useEffect } from "react";
import RequestFlowDiagram from "./components/RequestFlowDiagram";

export default function Home() {
  const [logContent, setLogContent] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Sync time inputs when timeWindow changes
  useEffect(() => {
    if (timeWindow) {
      const [start, end] = timeWindow.split(" - ");
      setStartTime(start || "");
      setEndTime(end || "");
    }
  }, [timeWindow]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setSelectedEvent(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logContent,
          architecture:
            "API Gateway → Payment Service → Stripe API, Inventory Service → Database",
          userContext: "Checkout failed around 2:23 PM",
          expectedBehavior: expectedBehavior || undefined,
          timeWindow: timeWindow || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSampleLogs = () => {
    const sampleLogs = `2024-02-07 09:15:22.103 service=api-gateway level=INFO trace_id=trace_8x9k2 span_id=span-001 method=POST path=/v1/orders user_id=usr_449201 Incoming order request
    2024-02-07 09:15:22.108 service=api-gateway level=INFO trace_id=trace_8x9k2 span_id=span-001 Routing request to order-service
    2024-02-07 09:15:22.115 service=order-service level=INFO trace_id=trace_8x9k2 span_id=span-002 parent_span_id=span-001 Order creation started items=3 total_amount=299.97
    2024-02-07 09:15:22.118 service=order-service level=INFO trace_id=trace_8x9k2 span_id=span-002 Validating inventory availability
    2024-02-07 09:15:22.122 service=inventory-service level=INFO trace_id=trace_8x9k2 span_id=span-003 parent_span_id=span-002 Stock check requested product_ids=SKU123,SKU456,SKU789
    2024-02-07 09:15:22.125 service=inventory-service level=DEBUG trace_id=trace_8x9k2 span_id=span-003 Acquiring database connection from pool current_active=48 pool_max=50
    2024-02-07 09:15:22.890 service=inventory-service level=WARN trace_id=trace_8x9k2 span_id=span-003 Database connection acquisition slow duration=765ms pool_status=exhausted
    2024-02-07 09:15:23.455 service=inventory-service level=INFO trace_id=trace_8x9k2 span_id=span-003 Stock check completed all_available=true query_time=1330ms
    2024-02-07 09:15:23.461 service=order-service level=INFO trace_id=trace_8x9k2 span_id=span-002 Inventory validated, initiating payment
    2024-02-07 09:15:23.468 service=payment-service level=INFO trace_id=trace_8x9k2 span_id=span-004 parent_span_id=span-002 Processing payment amount=299.97 method=credit_card last4=4532
    2024-02-07 09:15:23.472 service=payment-service level=INFO trace_id=trace_8x9k2 span_id=span-004 Calling payment gateway provider=stripe
    2024-02-07 09:15:24.891 service=payment-service level=INFO trace_id=trace_8x9k2 span_id=span-004 Payment authorized transaction_id=ch_3Nq8KL gateway_time=1419ms
    2024-02-07 09:15:24.897 service=order-service level=INFO trace_id=trace_8x9k2 span_id=span-002 Payment successful, creating order record
    2024-02-07 09:15:24.903 service=order-service level=DEBUG trace_id=trace_8x9k2 span_id=span-002 Acquiring database connection from pool current_active=50 pool_max=50
    2024-02-07 09:15:27.405 service=order-service level=ERROR trace_id=trace_8x9k2 span_id=span-002 Database connection timeout duration=2502ms error=connection_pool_exhausted
    2024-02-07 09:15:27.411 service=order-service level=ERROR trace_id=trace_8x9k2 span_id=span-002 Order creation failed status=payment_authorized_but_order_not_created
    2024-02-07 09:15:27.509 service=api-gateway level=ERROR trace_id=trace_8x9k2 span_id=span-001 Upstream service error status=500 response_time=5401ms`;

    setLogContent(sampleLogs);
    setExpectedBehavior(
      "Order should be created successfully with payment charged",
    );
    setTimeWindow("09:15:22 - 09:15:28");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              LogWeave
            </h1>
            <p className="text-sm text-muted-foreground">
              Because debugging distributed systems shouldn't take hours.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {!result && (
              <button
                onClick={loadSampleLogs}
                className="px-4 py-2 text-sm font-mono text-muted-foreground hover:text-foreground border border-border rounded hover:bg-muted transition-colors"
              >
                Load Demo
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="px-3 py-2 text-sm font-mono border border-border rounded hover:bg-muted transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Input Section */}
        {!result && (
          <div className="border border-border rounded-lg bg-card p-6 mb-6">
            <h2 className="text-base font-mono font-semibold mb-4">
              Upload Logs
            </h2>

            <textarea
              className="w-full h-48 p-3 border border-border rounded bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Paste your interleaved logs here (service=name format)..."
              value={logContent}
              onChange={(e) => setLogContent(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-1">
                  Expected Behavior{" "}
                  <span className="text-muted-foreground/50">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="e.g., Payment should succeed"
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-muted-foreground mb-1">
                  Time Window{" "}
                  <span className="text-muted-foreground/50">(Optional)</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="time"
                    step="1"
                    value={startTime}
                    className="flex-1 px-3 py-2 border border-border rounded bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setTimeWindow(
                        e.target.value ? `${e.target.value} - ${endTime}` : "",
                      );
                    }}
                  />
                  <span className="text-muted-foreground">→</span>
                  <input
                    type="time"
                    step="1"
                    value={endTime}
                    className="flex-1 px-3 py-2 border border-border rounded bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setTimeWindow(
                        startTime ? `${startTime} - ${e.target.value}` : "",
                      );
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !logContent}
              className="mt-4 w-full bg-foreground text-background font-mono font-semibold py-3 px-6 rounded disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {analyzing ? "Analyzing..." : "Analyze Logs"}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border border-red-500/50 bg-red-500/10 rounded-lg p-4 mb-6">
            <p className="text-sm font-mono text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Metadata Bar */}
            <div className="border border-border rounded-lg bg-card px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total Logs:</span>
                  <span className="text-foreground font-semibold">
                    {result?.metadata?.total_logs}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Services found:</span>
                  <div className="flex gap-1">
                    {result?.metadata?.services.map(
                      (service: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-muted text-foreground text-xs rounded border border-border"
                        >
                          {service}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attention Banner */}
            <AttentionBanner
              analysis={result.analysis}
              expectedBehavior={expectedBehavior}
              timeWindow={timeWindow}
            />

            {/* Timeline */}
            <TimelineView
              analysis={result.analysis}
              onEventClick={setSelectedEvent}
            />

            {/* Request Flow Diagram */}
            <RequestFlowDiagram
              analysis={result.analysis}
              parsedLogs={result.parsedLogs}
            />

            {/* Event Details */}
            {selectedEvent && (
              <EventDetails
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
              />
            )}

            {/* New Analysis Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  setResult(null);
                  setLogContent("");
                  setExpectedBehavior("");
                  setTimeWindow("");
                  setError(null);
                }}
                className="px-6 py-2 text-sm font-mono border border-border rounded hover:bg-muted transition-colors"
              >
                Analyze New Logs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

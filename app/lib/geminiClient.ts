// Gemini API Client - Analyzes logs using Gemini 3

export interface GeminiAnalysisRequest {
  groupedLogs: Record<string, string[]>;
  architecture?: string;
  userContext?: string;
  expectedBehavior?: string;
  timeWindow?: string;
}

export interface TimelineEvent {
  timestamp: string;
  service: string;
  event: string;
  confidence: "high" | "medium" | "low";
  ambiguity_note?: string;
}

export interface Anomaly {
  severity: "critical" | "warning" | "info";
  service: string;
  issue: string;
  evidence: string;
}

export interface ClockIssue {
  service: string;
  issue: string;
  correction: string;
}

export interface CausalityAnalysis {
  probable_root_cause: string;
  causal_chain: string;
  misleading_evidence?: string;
}

export interface AttentionPriority {
  priority: number;
  focus_area: string;
  reasoning: string;
}

export interface GeminiAnalysisResponse {
  timeline: TimelineEvent[];
  anomalies: Anomaly[];
  clock_issues: ClockIssue[];
  causality_analysis: CausalityAnalysis;
  attention_priority: AttentionPriority[];
  summary: string;
}

import { GoogleGenerativeAI } from "@google/generative-ai";
/**
 * Build the prompt for Gemini analysis
 */
function buildAnalysisPrompt(request: GeminiAnalysisRequest): string {
  const {
    groupedLogs,
    architecture,
    userContext,
    expectedBehavior,
    timeWindow,
  } = request;

  // Build the logs section
  let logsSection = "";
  for (const [service, logs] of Object.entries(groupedLogs)) {
    logsSection += `\n=== ${service} ===\n`;
    logsSection += logs.join("\n");
    logsSection += "\n";
  }

  const prompt = `You are an expert distributed systems debugger analyzing logs from a failed transaction.

 **CONTEXT:**
 ${architecture || "Microservices architecture with multiple services communicating via APIs and shared database"}

 ${userContext ? `**USER CONTEXT:**\n${userContext}\n` : ""}

 ${expectedBehavior ? `**EXPECTED BEHAVIOR:**\n${expectedBehavior}\nThis did NOT happen - figure out why.\n` : ""}

 ${timeWindow ? `**TIME WINDOW OF INTEREST:**\n${timeWindow}\nFocus your analysis on events within this timeframe.\n` : ""}

 **YOUR TASK:**
 Analyze these logs and provide:

 1. **TIMELINE RECONSTRUCTION**: Create a chronological sequence of events
 2. **AMBIGUITY DETECTION**: Identify where event ordering is uncertain (events within milliseconds, potential logging delays, timestamps that contradict logical flow)
 3. **ANOMALY DETECTION**: Flag errors, slow operations, unusual patterns
 4. **CLOCK SKEW DETECTION**: Identify timezone or clock differences between services
 5. **CAUSALITY REASONING**: Explain what caused what, trace dependency chains across services
 6. **ROOT CAUSE ANALYSIS**: What ACTUALLY went wrong? (distinguish root cause from symptoms)
 7. **ATTENTION DIRECTION**: What should an engineer investigate FIRST?

 **CRITICAL ANALYSIS PRINCIPLES:**
 - **TIME BUDGET ANALYSIS**: Slow operations that consume available time often cause downstream timeouts. A 2800ms database query in a 3500ms timeout window is likely the root cause, NOT the timeout that follows.
 - **Causality Order**: What happened FIRST in logical time (not log timestamp)? Early slow operations cascade into later failures.
 - **Symptoms vs Root Cause**: An error message is often a symptom. Look for what CAUSED the error. Example: "Stripe timeout" is a symptom if there's insufficient time left after a slow database query.
 - **Clock Skew**: If timestamps from one service are hours off, use LOGICAL ordering (API calls must happen after requests arrive) not timestamp ordering.

 **SPECIAL ATTENTION:**
 - Look for events within <10ms that may be out of logical order
 - If timestamps contradict logical flow (e.g., "API call" logged before "validation passed"), explain the probable actual sequence
 - Trace how issues in one service cascade to others
 - Question surface-level explanations - symptoms often hide root causes
 - **PRIORITIZE SLOW OPERATIONS**: A slow query/call that consumes time budget is usually more important than the timeout that results from it

 **LOGS:**
 ${logsSection}

 **OUTPUT FORMAT:**
 Provide a JSON response with this exact structure:
 {
   "timeline": [
     {
       "timestamp": "normalized timestamp (use one timezone)",
       "service": "service name",
       "event": "what happened",
       "confidence": "high|medium|low",
       "ambiguity_note": "explanation if ordering uncertain (optional)"
     }
   ],
   "anomalies": [
     {
       "service": "service name",
       "issue": "description",
       "severity": "critical|warning|info",
       "timestamp": "when it occurred"
     }
   ],
   "clock_issues": [
     {
       "service": "service name",
       "issue": "description of clock skew or timezone mismatch",
       "evidence": "specific log timestamps that prove this"
     }
   ],
   "causality_analysis": {
     "probable_root_cause": "concise statement of what actually broke first",
     "misleading_evidence": "what errors LOOK like the problem but are actually symptoms",
     "dependency_chain": "how the failure cascaded through services"
   },
   "attention_priority": [
     {
       "priority": 1,
       "focus_area": "specific thing to investigate",
       "reasoning": "why this should be investigated first - explain the causal link"
     }
   ],
   "summary": "2-3 sentence executive summary for an engineer who needs to fix this"
 }

 **IMPORTANT:** Return ONLY valid JSON. No markdown, no code blocks, no preamble.`;

  return prompt;
}

/**
 * Call Gemini API to analyze logs
 * Note: In hackathon, you'll use the actual Gemini API endpoint
 * For now, this is the structure
 */
export async function analyzeLogsWithGemini(
  request: GeminiAnalysisRequest,
  apiKey?: string,
): Promise<GeminiAnalysisResponse> {
  if (!apiKey) {
    throw new Error("Gemini API key is required");
  }

  const prompt = buildAnalysisPrompt(request);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    let jsonText = textResponse;
    jsonText = jsonText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const analysis: GeminiAnalysisResponse = JSON.parse(jsonText);
    return analysis;
  } catch (error: any) {
    console.error("Error analyzing logs with Gemini:", error);
    throw error;
  }
}

/**
 * Validate analysis response structure
 */
export function validateAnalysisResponse(
  response: any,
): response is GeminiAnalysisResponse {
  return (
    response &&
    Array.isArray(response.timeline) &&
    Array.isArray(response.anomalies) &&
    Array.isArray(response.clock_issues) &&
    response.causality_analysis &&
    Array.isArray(response.attention_priority) &&
    typeof response.summary === "string"
  );
}

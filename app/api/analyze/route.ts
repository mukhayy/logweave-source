import { NextRequest, NextResponse } from "next/server";
import {
  parseInterleavedLogs,
  groupByService,
  filterByRequestId,
} from "@/app/lib/logParser";
import {
  analyzeLogsWithGemini,
  validateAnalysisResponse,
} from "@/app/lib/geminiClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { logContent, requestId, architecture, userContext, apiKey } = body;

    // Validate input
    if (!logContent || typeof logContent !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid logContent" },
        { status: 400 },
      );
    }

    console.log("📝 Parsing logs...");

    // Step 1: Parse the interleaved log file
    const { logs, pattern, services } = parseInterleavedLogs(logContent);

    console.log(`✅ Parsed ${logs.length} log lines`);
    console.log(`🔍 Detected pattern: ${pattern.type}`);
    console.log(
      `🏢 Found ${services.size} services: ${Array.from(services).join(", ")}`,
    );

    // Step 2: Filter by request ID if provided
    let logsToAnalyze = logs;
    if (requestId) {
      logsToAnalyze = filterByRequestId(logs, requestId);
      console.log(
        `🎯 Filtered to ${logsToAnalyze.length} logs for request_id=${requestId}`,
      );

      if (logsToAnalyze.length === 0) {
        return NextResponse.json(
          { error: `No logs found for request_id=${requestId}` },
          { status: 404 },
        );
      }
    }

    // Step 3: Group logs by service
    const groupedLogs = groupByService(logsToAnalyze);

    console.log("📦 Grouped logs by service");

    // Step 4: Call Gemini API for analysis
    console.log("🤖 Calling Gemini API for analysis...");

    const analysis = await analyzeLogsWithGemini(
      {
        groupedLogs,
        architecture,
        userContext,
      },
      process.env.GEMINI_API_KEY,
    );

    console.log("✅ Analysis complete");

    // Step 5: Validate response
    if (!validateAnalysisResponse(analysis)) {
      console.error("⚠️ Invalid analysis response structure");
      return NextResponse.json(
        { error: "Invalid analysis response from AI" },
        { status: 500 },
      );
    }

    // Step 6: Return results
    return NextResponse.json({
      success: true,
      metadata: {
        total_logs: logs.length,
        analyzed_logs: logsToAnalyze.length,
        services: Array.from(services),
        pattern_type: pattern.type,
        request_id: requestId || null,
      },
      parsedLogs: logsToAnalyze,
      analysis,
    });
  } catch (error: any) {
    console.error("❌ Error in analysis:", error);

    return NextResponse.json(
      {
        error: "Analysis failed",
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

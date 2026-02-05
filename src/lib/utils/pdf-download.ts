import type { AnalysisResult } from "@/lib/types/analysis";

export async function downloadPdfReport(
  results: AnalysisResult[],
  filename: string
): Promise<void> {
  const res = await fetch("/api/reports/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results }),
  });
  if (!res.ok) {
    let message = "Export failed";
    try {
      const data = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
      message = data.detail ? `${data.error ?? message}: ${data.detail}` : (data.error ?? message);
    } catch {
      const text = await res.text().catch(() => "");
      if (text) message = text;
    }
    throw new Error(`${message} (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

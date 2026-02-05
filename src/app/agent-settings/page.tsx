"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Link2, Zap, Info, Check, Shield, Code } from "lucide-react";
import {
  getAgentSettings,
  setAgentSettings,
  AGENT_SETTINGS_DEFAULTS,
  type AgentSettings,
  type EnvMode,
} from "@/lib/agent-settings";

const WEBHOOK_PAYLOAD_PREVIEW = {
  action: "investigate_file_anomaly",
  details: 'File "critical_waste.csv" analysis detected: High numerical values detected - potential consumption spikes, Energy consumption data detected for analysis',
  severity: "high",
  timestamp: new Date().toISOString(),
  source: "TerraInsight File Analysis",
  recommendations: [
    "Review high-value entries for efficiency opportunities",
    "Verify meter readings and align with baseline",
  ],
};

export default function IntegrationHubPage() {
  const [settings, setSettings] = useState<AgentSettings>(AGENT_SETTINGS_DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [envApi, setEnvApi] = useState<{ n8nWebhookTestFromEnv: boolean; isProduction?: boolean } | null>(null);

  const isProduction = envApi?.isProduction === true;

  useEffect(() => {
    setSettings(getAgentSettings());
    fetch("/api/agent-settings/env")
      .then((res) => res.json())
      .then((data) => setEnvApi({ n8nWebhookTestFromEnv: Boolean(data.n8nWebhookTestFromEnv), isProduction: data.isProduction === true }))
      .catch(() => setEnvApi({ n8nWebhookTestFromEnv: false, isProduction: false }));
  }, []);

  useEffect(() => {
    if (isProduction) {
      const next = { ...getAgentSettings(), envMode: "prod" as EnvMode };
      setAgentSettings(next);
      setSettings(next);
    }
  }, [isProduction]);

  const handleSave = useCallback(() => {
    setAgentSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const handleModeChange = useCallback((mode: EnvMode) => {
    if (isProduction) return;
    setSettings((prev) => {
      const next = { ...prev, envMode: mode };
      setAgentSettings(next);
      return next;
    });
  }, [isProduction]);

  const handleWorkflowToggle = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, isWorkflowEnabled: !prev.isWorkflowEnabled };
      setAgentSettings(next);
      return next;
    });
  }, []);

  const envModeLabel = settings.envMode === "test" ? "Development/Sandbox" : "Live/Production";

  return (
    <div className="eco-grid-bg min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal-100">
              Integration Hub
            </h1>
            <p className="mt-1 text-charcoal-500">
              {isProduction
                ? "Workflow status and n8n integration monitoring"
                : "Configure n8n workflow integration (Development/Sandbox vs Live/Production)"}
            </p>
          </div>

          {isProduction && (
            <>
              <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-sm text-charcoal-200">
                  <strong>Note:</strong> This MVP uses a secure tunnel to a local n8n instance. Automated workflows are triggered server-side using protected environment variables.
                </p>
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-400">
                  <Shield className="h-4 w-4" />
                  Connection Status: Cloud-to-Local Tunnel Active (via ngrok)
                </span>
                <span className="inline-flex items-center rounded-full bg-charcoal-700 px-3 py-1.5 text-sm font-medium text-charcoal-300">
                  Live/Production
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-600/30 px-3 py-1.5 text-sm font-medium text-emerald-300">
                  Status: Live Mode Active
                </span>
              </div>
            </>
          )}

          <div className={isProduction ? "grid gap-6 md:grid-cols-2" : "space-y-6"}>
            {isProduction && (
              <Card className="border-charcoal-800 bg-charcoal-900/50 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-emerald-accent" />
                    Webhook Payload Preview
                  </CardTitle>
                  <CardDescription>
                    Example payload sent to n8n when file analysis detects anomalies (server-side; no secrets exposed).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-lg border border-charcoal-700 bg-charcoal-950 p-4 text-xs text-charcoal-300 font-mono">
                    {JSON.stringify(WEBHOOK_PAYLOAD_PREVIEW, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            <Card className="border-charcoal-800 bg-charcoal-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-accent" />
                  Workflow Integration
                </CardTitle>
                <CardDescription>
                  {isProduction
                    ? "Live/Production mode is active. Webhook URL is configured via server environment."
                    : "Development/Sandbox uses the test webhook; Live/Production uses the server .env setting (prod URL is never exposed in the UI)."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isProduction && (
                  <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-charcoal-300">
                      <Link2 className="h-4 w-4 text-emerald-accent shrink-0" />
                      Test Webhook URL (dev convenience)
                    </div>
                    {envApi?.n8nWebhookTestFromEnv === true ? (
                      <div className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-400">
                        Using System Environment Variable
                      </div>
                    ) : (
                      <>
                        <input
                          type="url"
                          value={settings.n8nWebhookTest}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              n8nWebhookTest: e.target.value,
                            }))
                          }
                          placeholder="http://localhost:5678/webhook-test/eco-action"
                          className="w-full rounded-lg border border-charcoal-700 bg-charcoal-900 px-4 py-2 text-sm text-charcoal-100 placeholder:text-charcoal-500 focus:border-emerald-accent focus:outline-none"
                        />
                        <p className="text-xs text-charcoal-500 flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          Optional. Used only when N8N_WEBHOOK_TEST is not set on the server (e.g. local dev).
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-charcoal-300">
                    Environment mode
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant={settings.envMode === "test" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModeChange("test")}
                      disabled={isProduction}
                      className={
                        settings.envMode === "test"
                          ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                          : ""
                      }
                    >
                      Development/Sandbox
                    </Button>
                    <Button
                      type="button"
                      variant={settings.envMode === "prod" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModeChange("prod")}
                      disabled={isProduction}
                      className={
                        settings.envMode === "prod"
                          ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                          : ""
                      }
                    >
                      Live/Production
                    </Button>
                    {settings.envMode === "prod" && !isProduction && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400">
                        ⚠️ Live Webhook Active
                      </span>
                    )}
                  </div>
                  {!isProduction && (
                    <>
                      <p className="text-xs text-charcoal-500 flex items-start gap-1.5" title="Development/Sandbox uses test webhook; Live/Production uses server .env setting (do NOT expose prod URL in UI).">
                        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        Development/Sandbox uses the test webhook; Live/Production uses the server .env setting (prod URL is never shown in the UI).
                      </p>
                      <p className="text-xs text-amber-400/90 flex items-start gap-1.5">
                        For instant feedback: In n8n, set the Webhook node Response Mode to &quot;Immediately&quot; so it responds right away instead of waiting for the workflow to finish.
                      </p>
                    </>
                  )}
                  {isProduction && (
                    <p className="text-xs text-charcoal-500 flex items-start gap-1.5">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      Environment is locked to Live/Production on this deployment.
                    </p>
                  )}
                </div>

                {!isProduction && (
                  <Button
                    onClick={handleSave}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {saved ? (
                      <>
                        <Check className="h-4 w-4" />
                        Saved
                      </>
                    ) : (
                      "Save configuration"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-charcoal-800 bg-charcoal-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-accent" />
                  Enable Workflow Triggers
                </CardTitle>
                <CardDescription>
                  When file analysis detects anomalies, the server can trigger the n8n webhook for the selected environment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-charcoal-400">
                  Current mode:{" "}
                  <span className="font-medium text-charcoal-200">
                    {envModeLabel}
                  </span>
                </p>
                <Button
                  type="button"
                  onClick={handleWorkflowToggle}
                  variant={settings.isWorkflowEnabled ? "default" : "outline"}
                  size="sm"
                  className={
                    settings.isWorkflowEnabled
                      ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                      : ""
                  }
                >
                  {settings.isWorkflowEnabled
                    ? `Workflow enabled (${envModeLabel})`
                    : "Enable workflow triggers"}
                </Button>
                <p className="text-xs text-charcoal-500 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Toggle is used when uploading files for analysis.
                </p>
              </CardContent>
            </Card>
          </div>

          {!isProduction && (
            <div className="mt-6">
              <Card className="border-charcoal-800 bg-charcoal-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-emerald-accent" />
                    Webhook Payload Preview
                  </CardTitle>
                  <CardDescription>
                    Example payload sent to n8n when file analysis detects anomalies.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-lg border border-charcoal-700 bg-charcoal-950 p-4 text-xs text-charcoal-300 font-mono">
                    {JSON.stringify(WEBHOOK_PAYLOAD_PREVIEW, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

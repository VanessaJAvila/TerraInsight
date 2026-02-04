"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Link2, Zap, Info, Check, AlertCircle } from "lucide-react";
import {
  getAgentSettings,
  setAgentSettings,
  getEffectiveWebhookUrl,
  validateWebhookUrl,
  type AgentSettings,
  type EnvironmentMode,
} from "@/lib/agent-settings";

export default function AgentSettingsPage() {
  const [settings, setSettings] = useState<AgentSettings>(getAgentSettings);
  const [saved, setSaved] = useState(false);
  const [testUrlError, setTestUrlError] = useState<string | null>(null);
  const [prodUrlError, setProdUrlError] = useState<string | null>(null);

  const loadFromStorage = useCallback(() => {
    setSettings(getAgentSettings());
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const effectiveUrl = getEffectiveWebhookUrl();

  const handleSave = useCallback(() => {
    const testValidation = validateWebhookUrl(settings.webhookUrlTest, "test");
    const prodValidation = settings.webhookUrlProduction
      ? validateWebhookUrl(settings.webhookUrlProduction, "production")
      : { valid: true };
    setTestUrlError(testValidation.valid ? null : testValidation.message ?? "Invalid URL");
    setProdUrlError(prodValidation.valid ? null : prodValidation.message ?? "Invalid URL");
    if (!testValidation.valid) return;
    if (settings.webhookUrlProduction && !prodValidation.valid) return;

    setAgentSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const handleModeChange = useCallback((mode: EnvironmentMode) => {
    setSettings((prev) => {
      const next = { ...prev, environmentMode: mode };
      setAgentSettings(next);
      return next;
    });
  }, []);

  const handleWorkflowToggle = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, workflowEnabled: !prev.workflowEnabled };
      setAgentSettings(next);
      return next;
    });
  }, []);

  return (
    <div className="eco-grid-bg min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal-100">
              Agent Settings
            </h1>
            <p className="mt-1 text-charcoal-500">
              Configure your AI Eco-Agent and n8n workflow integration
            </p>
          </div>

          <div className="space-y-6">
            <Card className="border-charcoal-800 bg-charcoal-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-emerald-accent" />
                  Workflow Integration
                </CardTitle>
                <CardDescription>
                  n8n webhook URLs and environment mode. Test uses a local or test
                  webhook; Production uses your live workflow URL.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-charcoal-300">
                    <Link2 className="h-4 w-4 text-emerald-accent shrink-0" />
                    Test Webhook URL
                  </div>
                  <input
                    type="url"
                    value={settings.webhookUrlTest}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        webhookUrlTest: e.target.value,
                      }));
                      setTestUrlError(null);
                    }}
                    placeholder="http://localhost:5680/webhook-test/eco-action"
                    className="w-full rounded-lg border border-charcoal-700 bg-charcoal-900 px-4 py-2 text-sm text-charcoal-100 placeholder:text-charcoal-500 focus:border-emerald-accent focus:outline-none"
                  />
                  {testUrlError && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-400">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {testUrlError}
                    </p>
                  )}
                  <p className="text-xs text-charcoal-500 flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Use for local n8n or staging. Typically localhost or a URL
                    containing &quot;webhook-test&quot; or &quot;test&quot;.
                  </p>
                </div>

                <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-charcoal-300">
                    <Link2 className="h-4 w-4 text-emerald-accent shrink-0" />
                    Production Webhook URL
                  </div>
                  <input
                    type="url"
                    value={settings.webhookUrlProduction}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        webhookUrlProduction: e.target.value,
                      }));
                      setProdUrlError(null);
                    }}
                    placeholder="https://your-n8n.com/webhook/eco-action"
                    className="w-full rounded-lg border border-charcoal-700 bg-charcoal-900 px-4 py-2 text-sm text-charcoal-100 placeholder:text-charcoal-500 focus:border-emerald-accent focus:outline-none"
                  />
                  {prodUrlError && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-400">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {prodUrlError}
                    </p>
                  )}
                  <p className="text-xs text-charcoal-500 flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Use for live automations. Prefer HTTPS. Leave empty to fall
                    back to the test URL when in Production mode.
                  </p>
                </div>

                <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-charcoal-300">
                    Environment mode
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={settings.environmentMode === "test" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModeChange("test")}
                      className={
                        settings.environmentMode === "test"
                          ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                          : ""
                      }
                    >
                      Test
                    </Button>
                    <Button
                      type="button"
                      variant={settings.environmentMode === "production" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModeChange("production")}
                      className={
                        settings.environmentMode === "production"
                          ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                          : ""
                      }
                    >
                      Production
                    </Button>
                  </div>
                  <p className="text-xs text-charcoal-500">
                    Current URL in use:{" "}
                    <code className="rounded bg-charcoal-800 px-1.5 py-0.5 text-charcoal-300 break-all">
                      {effectiveUrl || "(none)"}
                    </code>
                  </p>
                </div>

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
              </CardContent>
            </Card>

            <Card className="border-charcoal-800 bg-charcoal-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-accent" />
                  Workflow triggers
                </CardTitle>
                <CardDescription>
                  When the agent or file analysis detects issues, it can call
                  the n8n webhook for the current environment (Test or
                  Production).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-charcoal-400">
                  Enable this to allow the AI Eco-Agent and file analysis to
                  trigger sustainability workflows. Disable to prevent any
                  webhook calls. Mode:{" "}
                  <span className="font-medium text-charcoal-200">
                    {settings.environmentMode === "test" ? "Test" : "Production"}
                  </span>
                </p>
                <Button
                  type="button"
                  onClick={handleWorkflowToggle}
                  variant={settings.workflowEnabled ? "default" : "outline"}
                  size="sm"
                  className={
                    settings.workflowEnabled
                      ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                      : ""
                  }
                >
                  {settings.workflowEnabled
                    ? `Workflow enabled (${settings.environmentMode})`
                    : "Enable workflow triggers"}
                </Button>
                <p className="text-xs text-charcoal-500 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Test mode: triggers the test webhook (e.g. local n8n).
                  Production mode: triggers the production webhook. Switch modes
                  in the card above; no need to edit the URL manually when
                  switching.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

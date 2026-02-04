import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Link2, Zap } from "lucide-react";

export default function AgentSettingsPage() {
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
              Configure your AI Eco-Agent and integrations
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
                  Connect to n8n or other automation tools for sustainability
                  workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-charcoal-300">
                    <Link2 className="h-4 w-4 text-emerald-accent" />
                    n8n Webhook URL
                  </div>
                  <input
                    type="url"
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    className="mt-2 w-full rounded-lg border border-charcoal-700 bg-charcoal-900 px-4 py-2 text-sm text-charcoal-100 placeholder:text-charcoal-500 focus:border-emerald-accent focus:outline-none"
                    suppressHydrationWarning={true}
                  />
                </div>
                <Button variant="outline" size="sm" suppressHydrationWarning={true}>
                  Save Configuration
                </Button>
              </CardContent>
            </Card>

            <Card className="border-charcoal-800 bg-charcoal-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-accent" />
                  suggestSustainabilityAction
                </CardTitle>
                <CardDescription>
                  When the agent suggests actions, they can trigger external
                  green workflows (e.g., n8n automations)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-charcoal-400">
                  Enable this to allow the AI Eco-Agent to simulate triggering
                  sustainability workflows when it identifies opportunities.
                </p>
                <Button className="mt-4" suppressHydrationWarning={true}>Enable Workflow Triggers</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

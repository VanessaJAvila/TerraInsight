import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="eco-grid-bg min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal-100">Reports</h1>
            <p className="mt-1 text-charcoal-500">
              View and manage your ecological impact reports
            </p>
          </div>

          <Card className="border-charcoal-800 bg-charcoal-900/50">
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                Past analyses and generated reports will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="mb-4 h-16 w-16 text-charcoal-600" />
                <p className="text-charcoal-400">No reports yet</p>
                <p className="mt-1 text-sm text-charcoal-500">
                  Upload files from Impact Overview to generate reports
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

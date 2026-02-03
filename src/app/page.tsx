import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <div className="eco-grid-bg min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal-100">
              Impact Overview
            </h1>
            <p className="mt-1 text-charcoal-500">
              Upload reports and analyze your ecological footprint
            </p>
          </div>

          <DashboardClient />
        </div>
      </main>
    </div>
  );
}

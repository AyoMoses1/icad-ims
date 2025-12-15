"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Ship,
  Users,
  FileCheck,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Activity,
  Shield,
  Building2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore, useWorkspaceStore } from "@/store";
import { formatDate } from "@/lib/utils";

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
}

const stats: StatCard[] = [
  {
    title: "Total Vessels",
    value: "712",
    change: "+52 this year",
    trend: "up",
    icon: Ship,
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    title: "Active Seafarers",
    value: "81",
    change: "+52 this year",
    trend: "up",
    icon: Users,
    iconBg: "bg-cyan-50 text-cyan-600",
  },
  {
    title: "Certifications",
    value: "1,564",
    change: "+52 this year",
    trend: "up",
    icon: FileCheck,
    iconBg: "bg-green-50 text-green-600",
  },
  {
    title: "Open Incidents",
    value: "43",
    change: "-12 this year",
    trend: "down",
    icon: AlertTriangle,
    iconBg: "bg-amber-50 text-amber-600",
  },
];

interface RecentActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { workspaces } = useWorkspaceStore();
  const [isLoading, setIsLoading] = useState(true);

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: "1",
      action: "New vessel registration",
      description: "MV Ocean Star",
      timestamp: new Date().toISOString(),
      icon: Ship,
      iconBg: "bg-blue-100 text-blue-600",
    },
    {
      id: "2",
      action: "Certification Renewal",
      description: "SS Maritime Pride",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      icon: FileCheck,
      iconBg: "bg-green-100 text-green-600",
    },
    {
      id: "3",
      action: "Incident reported",
      description: "MV Blue Horizon",
      timestamp: new Date(Date.now() - 240000).toISOString(),
      icon: AlertTriangle,
      iconBg: "bg-amber-100 text-amber-600",
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      {stat.trend === "up" ? (
                        <ArrowUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-red-600" />
                      )}
                      <span
                        className={`text-xs ${
                          stat.trend === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Overview - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 flex items-end justify-between gap-2 px-4">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map(
                  (month, index) => {
                    const heights = [120, 130, 100, 140, 110, 125];
                    const heights2 = [80, 90, 70, 95, 75, 85];
                    return (
                      <div
                        key={month}
                        className="flex flex-col items-center gap-2 flex-1"
                      >
                        <div className="flex gap-1 items-end h-48">
                          <div
                            className="w-6 bg-primary rounded-t"
                            style={{ height: `${heights[index]}px` }}
                          />
                          <div
                            className="w-6 bg-primary/40 rounded-t"
                            style={{ height: `${heights2[index]}px` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {month}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-48 rounded-full mx-auto" />
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative h-48 w-48">
                  {/* Simple donut chart representation */}
                  <svg
                    viewBox="0 0 100 100"
                    className="h-full w-full -rotate-90"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="20"
                      strokeDasharray="188.5 251.3"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="20"
                      strokeDasharray="37.7 251.3"
                      strokeDashoffset="-188.5"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray="25.1 251.3"
                      strokeDashoffset="-226.2"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">
                      Compliant
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="text-xs text-muted-foreground">
                      Pending
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">
                      Non-Compliant
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-3 rounded-lg ${activity.iconBg}`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    2 mins ago
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}






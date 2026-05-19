"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/companies">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage event companies and their details.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/schedule">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage event schedule and sessions.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/supporters">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Supporters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage event sponsors and supporters.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/admin/login");
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
        </div>
        <nav className="mt-6">
          <Link href="/admin" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
            Dashboard
          </Link>
          <Link href="/admin/companies" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
            Companies
          </Link>
          <Link href="/admin/schedule" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
            Schedule
          </Link>
          <Link href="/admin/supporters" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
            Supporters
          </Link>
          <div className="px-6 py-3 mt-auto">
            <Button variant="destructive" onClick={logout} className="w-full">
              Logout
            </Button>
          </div>
        </nav>
      </aside>
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}

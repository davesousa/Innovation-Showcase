"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Globe, Linkedin, MapPin, Calendar } from "lucide-react";
import Link from "next/link";

interface Company {
  company_name: string;
  linkedin_url: string;
  website_url: string;
  location_city: string;
  location_province_state: string;
  location_country: string;
  full_location: string;
  year_founded: string;
  company_description: string;
  mission_statement: string;
  catalyst_program: string;
}

export default function CompanyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      if (!id) return;
      try {
        const docRef = doc(db, "companies", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCompany(docSnap.data() as Company);
        } else {
          console.error("No such company!");
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Company not found</h1>
        <Button onClick={() => router.push("/")}>Go Back Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-medium transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Directory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                    {company.company_name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-4xl font-extrabold text-gray-900">{company.company_name}</h1>
                    <div className="flex items-center text-gray-500 mt-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {company.full_location || `${company.location_city}, ${company.location_country}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  {company.website_url && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={company.website_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-5 h-5" />
                      </a>
                    </Button>
                  )}
                  {company.linkedin_url && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="prose prose-blue max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Company</h2>
                <p className="text-gray-600 leading-relaxed text-lg mb-8">
                  {company.company_description}
                </p>

                {company.mission_statement && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Mission Statement</h2>
                    <p className="text-gray-600 leading-relaxed text-lg italic border-l-4 border-blue-600 pl-6 py-2">
                      "{company.mission_statement}"
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Details Card */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Year Founded</label>
                  <div className="flex items-center mt-1 text-gray-900 font-medium">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    {company.year_founded || "N/A"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</label>
                  <div className="mt-1 text-gray-900 font-medium">
                    {company.location_city}, {company.location_province_state}
                    <div className="text-gray-500 text-sm font-normal">{company.location_country}</div>
                  </div>
                </div>
                {company.catalyst_program && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Catalyst Program</label>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {company.catalyst_program}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-200">
              <h3 className="text-xl font-bold mb-4">Interested in {company.company_name}?</h3>
              <p className="text-blue-100 mb-6 text-sm leading-relaxed">
                Connect with the team or visit their website to learn more about their innovative solutions.
              </p>
              <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold h-12">
                Contact Company
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

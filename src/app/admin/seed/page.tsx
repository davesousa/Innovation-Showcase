"use client";

import { useState } from "react";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const COMPANIES = [
  {
    company_name: "CyberGuard Solutions",
    location_city: "Toronto",
    location_province_state: "ON",
    location_country: "Canada",
    full_location: "Toronto, ON",
    year_founded: "2020",
    company_description: "Leading the way in autonomous threat detection and response for critical infrastructure.",
    mission_statement: "To secure the world's most vital systems against evolving cyber threats.",
    catalyst_program: "Cyber Challenge Program",
    website_url: "https://example.com",
    linkedin_url: "https://linkedin.com",
  },
  {
    company_name: "SafeNet Systems",
    location_city: "Ottawa",
    location_province_state: "ON",
    location_country: "Canada",
    full_location: "Ottawa, ON",
    year_founded: "2018",
    company_description: "Next-generation encryption and secure communication protocols for government agencies.",
    mission_statement: "Privacy and security for everyone, everywhere.",
    catalyst_program: "Cyber Challenge Program",
    website_url: "https://example.com",
    linkedin_url: "https://linkedin.com",
  },
  {
    company_name: "FinSecure Analytics",
    location_city: "New York",
    location_province_state: "NY",
    location_country: "USA",
    full_location: "New York, NY",
    year_founded: "2021",
    company_description: "Fraud detection platform using machine learning to identify suspicious financial transactions in real-time.",
    mission_statement: "Protecting the integrity of global financial markets.",
    catalyst_program: "RBC FinSec Program",
    website_url: "https://example.com",
    linkedin_url: "https://linkedin.com",
  },
  {
    company_name: "MarketAccess AI",
    location_city: "London",
    location_province_state: "UK",
    location_country: "UK",
    full_location: "London, UK",
    year_founded: "2019",
    company_description: "Bridging the gap between law enforcement and innovative technology solutions.",
    mission_statement: "Empowering law enforcement with better data.",
    catalyst_program: "Law Enforcement Market Access Program",
    website_url: "https://example.com",
    linkedin_url: "https://linkedin.com",
  },
];

const EVENTS = [
  {
    title: "Opening Keynote: The Future of Innovation",
    description: "Join our industry leaders as they discuss the upcoming trends and technologies that will shape the next decade.",
    date: "2026-06-15",
    start_time: "09:00",
    end_time: "10:30",
  },
  {
    title: "Cyber Security Panel Discussion",
    description: "Experts from top security firms discuss the current landscape of cyber threats and defensive strategies.",
    date: "2026-06-15",
    start_time: "11:00",
    end_time: "12:30",
  },
  {
    title: "FinTech Innovation Workshop",
    description: "A deep dive into how blockchain and AI are revolutionizing the financial services industry.",
    date: "2026-06-15",
    start_time: "14:00",
    end_time: "15:30",
  },
  {
    title: "Networking Session & Cocktail Hour",
    description: "An opportunity to connect with founders, investors, and fellow attendees in an informal setting.",
    date: "2026-06-15",
    start_time: "16:00",
    end_time: "18:00",
  },
];

const SUPPORTERS = [
  {
    company_name: "Tech Corp",
    logo: "https://via.placeholder.com/150x80?text=Tech+Corp",
  },
  {
    company_name: "Innovation Lab",
    logo: "https://via.placeholder.com/150x80?text=Innovation+Lab",
  },
  {
    company_name: "Future Systems",
    logo: "https://via.placeholder.com/150x80?text=Future+Systems",
  },
  {
    company_name: "Global Partners",
    logo: "https://via.placeholder.com/150x80?text=Global+Partners",
  },
];

export default function AdminSeed() {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      // Seed Companies
      for (const company of COMPANIES) {
        await addDoc(collection(db, "companies"), company);
      }
      
      // Seed Events
      for (const event of EVENTS) {
        await addDoc(collection(db, "schedule"), event);
      }
      
      // Seed Supporters
      for (const supporter of SUPPORTERS) {
        await addDoc(collection(db, "supporters"), supporter);
      }
      
      toast.success("Database seeded successfully!");
    } catch (error) {
      console.error("Error seeding database:", error);
      toast.error("Failed to seed database.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear all data? This cannot be undone.")) return;
    setLoading(true);
    try {
      const collections = ["companies", "schedule", "supporters"];
      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        const deletePromises = querySnapshot.docs.map((docSnap) => deleteDoc(doc(db, colName, docSnap.id)));
        await Promise.all(deletePromises);
      }
      toast.success("All data cleared!");
    } catch (error) {
      console.error("Error clearing database:", error);
      toast.error("Failed to clear database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Database Seeding Utility</CardTitle>
          <CardDescription>
            Use this tool to populate your Firestore database with placeholder data for testing the design.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <Button onClick={handleSeed} disabled={loading} className="w-full">
              {loading ? "Processing..." : "Seed Database with Sample Data"}
            </Button>
            <Button onClick={handleClear} variant="destructive" disabled={loading} className="w-full">
              {loading ? "Processing..." : "Clear All Existing Data"}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4 italic">
            Note: This will add 4 companies, 4 events, and 4 supporters to your collections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

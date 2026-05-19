"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/hooks/useFirestore";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Company {
  id: string;
  company_name: string;
  location_city: string;
  location_country: string;
  full_location: string;
  company_description: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time?: string;
}

interface Supporter {
  id: string;
  company_name: string;
  logo: string;
}

export default function Home() {
  const { data: companies, loading: companiesLoading } = useFirestore<Company>("companies");
  const { data: events, loading: eventsLoading } = useFirestore<Event>("schedule");
  const { data: supporters, loading: supportersLoading } = useFirestore<Supporter>("supporters");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              IS
            </div>
            <span className="text-xl font-bold tracking-tight">Innovation Showcase</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#schedule" className="text-sm font-medium hover:text-blue-600 transition-colors">Schedule</a>
            <a href="#companies" className="text-sm font-medium hover:text-blue-600 transition-colors">Companies</a>
            <a href="#supporters" className="text-sm font-medium hover:text-blue-600 transition-colors">Supporters</a>
            <Link href="/admin">
              <Button variant="outline" size="sm">Admin</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-20 border-b">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Discover the Future of <span className="text-blue-600">Innovation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Welcome to the Innovation Showcase. Explore the most promising companies, 
            connect with industry leaders, and discover the next big thing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-14 px-8 text-lg">
              Explore Companies
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
              View Schedule
            </Button>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Event Schedule</h2>
            <p className="text-gray-600">Join us for these exciting sessions and workshops.</p>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {eventsLoading ? (
              <p className="text-center py-10">Loading schedule...</p>
            ) : events.length === 0 ? (
              <p className="text-center py-10 text-gray-500">No events scheduled yet.</p>
            ) : (
              events
                .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
                .map((event) => (
                  <Card key={event.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      <div className="bg-blue-600 text-white p-6 md:w-48 flex flex-col justify-center items-center text-center">
                        <div className="text-sm font-medium uppercase tracking-wider opacity-80">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-2xl font-bold mt-1">
                          {event.start_time}
                        </div>
                        {event.end_time && (
                          <div className="text-sm opacity-80">to {event.end_time}</div>
                        )}
                      </div>
                      <div className="p-6 flex-1 bg-white">
                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                        <p className="text-gray-600">{event.description}</p>
                      </div>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section id="companies" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">Featured Companies</h2>
              <p className="text-gray-600">Meet the innovators shaping the world of tomorrow.</p>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Search companies..." className="w-64" />
              <Button variant="outline">Filter</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companiesLoading ? (
              <p className="col-span-full text-center py-10">Loading companies...</p>
            ) : companies.length === 0 ? (
              <p className="col-span-full text-center py-10 text-gray-500">No companies found.</p>
            ) : (
              companies.map((company) => (
                <Link href={`/company/${company.id}`} key={company.id}>
                  <Card className="h-full hover:border-blue-400 transition-colors cursor-pointer group">
                    <CardHeader>
                      <div className="w-12 h-12 bg-gray-100 rounded-lg mb-4 group-hover:bg-blue-50 transition-colors flex items-center justify-center text-blue-600 font-bold">
                        {company.company_name.charAt(0)}
                      </div>
                      <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                        {company.company_name}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {company.full_location || `${company.location_city}, ${company.location_country}`}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 line-clamp-3 text-sm leading-relaxed">
                        {company.company_description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Supporters Section */}
      <section id="supporters" className="py-20 bg-gray-50 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest mb-8">Our Supporters</h2>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all">
              {supportersLoading ? (
                <p>Loading supporters...</p>
              ) : supporters.length === 0 ? (
                <p className="text-gray-400">Join us as a supporter</p>
              ) : (
                supporters.map((supporter) => (
                  <div key={supporter.id} className="relative w-32 h-16">
                    <Image
                      src={supporter.logo}
                      alt={supporter.company_name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
              IS
            </div>
            <span className="font-bold">Innovation Showcase</span>
          </div>
          <div className="text-sm text-gray-500">
            © 2026 Innovation Showcase. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">LinkedIn</a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

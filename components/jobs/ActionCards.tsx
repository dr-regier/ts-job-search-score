"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, Search, Target, BarChart3 } from "lucide-react";

export function ActionCards() {
  const cards = [
    {
      title: "Profile Setup",
      description: "Configure your preferences and scoring weights",
      href: "/profile",
      borderColor: "border-l-blue-500",
      icon: Settings,
    },
    {
      title: "Discover Jobs",
      description: "Search and find jobs that match your criteria",
      href: "/",
      borderColor: "border-l-blue-500",
      icon: Search,
    },
    {
      title: "Score Jobs",
      description: "Get AI-powered fit analysis for your saved jobs",
      href: "/",
      borderColor: "border-l-blue-500",
      icon: Target,
    },
    {
      title: "View Dashboard",
      description: "Track applications and monitor progress",
      href: "/jobs",
      borderColor: "border-l-blue-500",
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`
            bg-white border border-gray-200 rounded-lg p-6
            hover:border-gray-300 transition-colors
            border-l-2 ${card.borderColor}
          `}
        >
          <card.icon className="w-5 h-5 text-gray-700 mb-3" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900">
            {card.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {card.description}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href={card.href}>
              Go to {card.title}
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

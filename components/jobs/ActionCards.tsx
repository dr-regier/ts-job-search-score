"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, Search, Target } from "lucide-react";

interface ActionCardsProps {
  onScoreJobsClick?: () => void;
}

export function ActionCards({ onScoreJobsClick }: ActionCardsProps) {
  const cards = [
    {
      title: "Profile Setup",
      description: "Configure your preferences and scoring weights",
      href: "/profile",
      borderColor: "border-l-blue-500",
      icon: Settings,
      type: "link" as const,
    },
    {
      title: "Discover Jobs",
      description: "Search and find jobs that match your criteria",
      href: "/",
      borderColor: "border-l-blue-500",
      icon: Search,
      type: "link" as const,
    },
    {
      title: "Score Jobs",
      description: "Get AI-powered fit analysis for your saved jobs",
      borderColor: "border-l-blue-500",
      icon: Target,
      type: "button" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`
            bg-white border border-gray-200 rounded-lg p-4
            hover:border-gray-300 transition-colors
            border-l-2 ${card.borderColor}
          `}
        >
          <card.icon className="w-4 h-4 text-gray-700 mb-2" />
          <h3 className="text-base font-semibold mb-1 text-gray-900">
            {card.title}
          </h3>
          <p className="text-gray-600 text-xs mb-3">
            {card.description}
          </p>
          {card.type === "button" ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onScoreJobsClick}
            >
              {card.title}
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={card.href || "/"}>
                Go to {card.title}
              </Link>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

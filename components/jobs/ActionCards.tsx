"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, FileText, Target, BarChart3 } from "lucide-react";

export function ActionCards() {
  const cards = [
    {
      emoji: "⚙️",
      title: "Profile Setup",
      description: "Configure your preferences and scoring weights",
      href: "/profile",
      borderColor: "border-l-blue-500",
      buttonColor:
        "bg-blue-500 hover:bg-blue-600 text-white",
      icon: Settings,
    },
    {
      emoji: "📄",
      title: "Discover Jobs",
      description: "Search and find jobs that match your criteria",
      href: "/",
      borderColor: "border-l-green-500",
      buttonColor:
        "bg-green-500 hover:bg-green-600 text-white",
      icon: FileText,
    },
    {
      emoji: "🎯",
      title: "Score Jobs",
      description: "Get AI-powered fit analysis for your saved jobs",
      href: "/",
      borderColor: "border-l-purple-500",
      buttonColor:
        "bg-purple-500 hover:bg-purple-600 text-white",
      icon: Target,
    },
    {
      emoji: "📊",
      title: "View Dashboard",
      description: "Track applications and monitor progress",
      href: "/jobs",
      borderColor: "border-l-yellow-500",
      buttonColor:
        "bg-yellow-500 hover:bg-yellow-600 text-white",
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={`
            bg-white rounded-xl p-6 shadow-lg hover:shadow-xl
            transition-all duration-300 hover:-translate-y-1
            border-l-4 ${card.borderColor}
            group
          `}
          style={{
            animation: `slide-up 0.5s ease-out forwards`,
            animationDelay: `${index * 100}ms`,
            opacity: 0,
          }}
        >
          <div className="mb-4 text-5xl group-hover:scale-110 transition-transform duration-300">
            {card.emoji}
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            {card.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {card.description}
          </p>
          <Button asChild className={`w-full ${card.buttonColor} shadow-md hover:shadow-lg transition-all`}>
            <Link href={card.href}>
              <card.icon className="w-4 h-4 mr-2" />
              Go to {card.title}
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

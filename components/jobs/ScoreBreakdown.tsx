"use client";

import { useEffect, useState } from "react";
import type { Job } from "@/types/job";

interface ScoreBreakdownProps {
  score: number;
  scoreBreakdown?: Job["scoreBreakdown"];
}

export function ScoreBreakdown({ score, scoreBreakdown }: ScoreBreakdownProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-gray-600";
  };

  const getRingColor = (score: number) => {
    if (score >= 85) return "from-green-500 to-emerald-500";
    if (score >= 70) return "from-yellow-500 to-amber-500";
    return "from-gray-500 to-slate-500";
  };

  const categories = scoreBreakdown
    ? [
        {
          label: "Salary Match",
          value: scoreBreakdown.salaryMatch,
          max: 30,
          color: "bg-gradient-to-r from-blue-500 to-blue-600",
        },
        {
          label: "Location Fit",
          value: scoreBreakdown.locationFit,
          max: 20,
          color: "bg-gradient-to-r from-green-500 to-green-600",
        },
        {
          label: "Company Appeal",
          value: scoreBreakdown.companyAppeal,
          max: 25,
          color: "bg-gradient-to-r from-purple-500 to-purple-600",
        },
        {
          label: "Role Match",
          value: scoreBreakdown.roleMatch,
          max: 15,
          color: "bg-gradient-to-r from-yellow-500 to-yellow-600",
        },
        {
          label: "Requirements Fit",
          value: scoreBreakdown.requirementsFit,
          max: 10,
          color: "bg-gradient-to-r from-red-500 to-red-600",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="flex flex-col items-center">
        <div
          className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${getRingColor(
            score
          )} p-1 shadow-lg transition-all duration-500 ${
            animated ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              Overall
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {scoreBreakdown && (
        <div className="space-y-4">
          {categories.map((category, index) => {
            const percentage = (category.value / category.max) * 100;
            return (
              <div
                key={category.label}
                className="space-y-2 transition-all duration-500"
                style={{
                  transitionDelay: `${index * 100}ms`,
                  opacity: animated ? 1 : 0,
                  transform: animated
                    ? "translateY(0)"
                    : "translateY(10px)",
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {category.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {category.value.toFixed(1)}/{category.max}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${category.color} transition-all duration-1000 ease-out rounded-full`}
                    style={{
                      width: animated ? `${percentage}%` : "0%",
                      transitionDelay: `${index * 100 + 200}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

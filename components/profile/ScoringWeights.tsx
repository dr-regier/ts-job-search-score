"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface ScoringWeightsProps {
  weights: {
    salaryMatch: number;
    locationFit: number;
    companyAppeal: number;
    roleMatch: number;
    requirementsFit: number;
  };
  onChange: (weights: ScoringWeightsProps["weights"]) => void;
}

export function ScoringWeights({ weights, onChange }: ScoringWeightsProps) {
  const total =
    weights.salaryMatch +
    weights.locationFit +
    weights.companyAppeal +
    weights.roleMatch +
    weights.requirementsFit;

  const isValid = total === 100;

  const handleWeightChange = (key: keyof typeof weights, value: number[]) => {
    onChange({
      ...weights,
      [key]: value[0],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Scoring Weights</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span
            className={`text-lg font-semibold ${
              isValid ? "text-green-600" : "text-red-600"
            }`}
          >
            {total}%
          </span>
        </div>
      </div>

      {!isValid && (
        <div className="text-sm text-red-600">
          Weights must sum to exactly 100%. Current total: {total}%
        </div>
      )}

      <div className="space-y-4">
        {/* Salary Match */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="salaryMatch">Salary Match</Label>
            <span className="text-sm font-medium">{weights.salaryMatch}%</span>
          </div>
          <Slider
            id="salaryMatch"
            min={0}
            max={100}
            step={5}
            value={[weights.salaryMatch]}
            onValueChange={(value) => handleWeightChange("salaryMatch", value)}
          />
        </div>

        {/* Location Fit */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="locationFit">Location Fit</Label>
            <span className="text-sm font-medium">{weights.locationFit}%</span>
          </div>
          <Slider
            id="locationFit"
            min={0}
            max={100}
            step={5}
            value={[weights.locationFit]}
            onValueChange={(value) => handleWeightChange("locationFit", value)}
          />
        </div>

        {/* Company Appeal */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="companyAppeal">Company Appeal</Label>
            <span className="text-sm font-medium">{weights.companyAppeal}%</span>
          </div>
          <Slider
            id="companyAppeal"
            min={0}
            max={100}
            step={5}
            value={[weights.companyAppeal]}
            onValueChange={(value) => handleWeightChange("companyAppeal", value)}
          />
        </div>

        {/* Role Match */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="roleMatch">Role Match</Label>
            <span className="text-sm font-medium">{weights.roleMatch}%</span>
          </div>
          <Slider
            id="roleMatch"
            min={0}
            max={100}
            step={5}
            value={[weights.roleMatch]}
            onValueChange={(value) => handleWeightChange("roleMatch", value)}
          />
        </div>

        {/* Requirements Fit */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="requirementsFit">Requirements Fit</Label>
            <span className="text-sm font-medium">{weights.requirementsFit}%</span>
          </div>
          <Slider
            id="requirementsFit"
            min={0}
            max={100}
            step={5}
            value={[weights.requirementsFit]}
            onValueChange={(value) => handleWeightChange("requirementsFit", value)}
          />
        </div>
      </div>
    </div>
  );
}

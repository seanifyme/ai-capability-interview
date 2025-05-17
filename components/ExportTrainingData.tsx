"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ExportTrainingData() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Trigger file download by creating a temporary anchor element
      const response = await fetch("/api/export/training-data");
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to export data");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "singularshift-training-data.jsonl";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error exporting training data:", error);
      alert("Failed to export training data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-dark-200">
      <h3 className="text-lg font-semibold">Export Training Data</h3>
      <p className="text-sm text-light-100">
        Export all interview data in JSONL format for training AI models on Replicate.
      </p>
      <Button 
        onClick={handleExport} 
        disabled={isExporting}
        className="btn-primary self-start"
      >
        {isExporting ? "Exporting..." : "Export Training Data"}
      </Button>
    </div>
  );
} 
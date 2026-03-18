// src/hooks/useAzureData.ts
import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001";

interface Summary {
  totalMonthlyCost:  number;  // كل التكاليف
  wasteMonthlyCost:  number;  // الـ waste فقط
  totalYearlyCost:   number;
  totalItems:        number;  // عدد الـ waste items
  totalResources:    number;  // عدد كل الـ resources
  lastScannedAt:     string | null;
  breakdown: { waste_type: string; count: number; cost: number }[];
}

interface WasteItem {
  id:           string;
  name:         string;
  type:         string;
  location:     string;
  status:       string;
  size:         string;
  idle_days:    number;
  monthly_cost: number;
  waste_type:   string;
  severity:     string;
}

export function useAzureData() {
  const [summary,    setSummary]    = useState<Summary | null>(null);
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [summaryRes, wasteRes] = await Promise.all([
          fetch(`${API_URL}/api/summary`),
          fetch(`${API_URL}/api/waste`),
        ]);

        const summaryData = await summaryRes.json();
        const wasteData   = await wasteRes.json();

        setSummary(summaryData);
        setWasteItems(wasteData);
        setError(null);
      } catch (err) {
        setError("تعذّر الاتصال بالـ Backend — تأكد أن السيرفر يعمل");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { summary, wasteItems, loading, error };
}


import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

export const AnalyticsTab = () => {
  const handleDateRangeClick = () => {
    toast({
      title: "Date range",
      description: "Opening date range selector",
    });
  };

  const sectorData = [
    { name: "AI & ML", value: 35 },
    { name: "Fintech", value: 25 },
    { name: "Healthcare", value: 15 },
    { name: "CleanTech", value: 10 },
    { name: "EdTech", value: 15 }
  ];
  
  const stageData = [
    { name: "Pre-seed", value: 30 },
    { name: "Seed", value: 40 },
    { name: "Series A", value: 20 },
    { name: "Series B+", value: 10 }
  ];
  
  const monthlyData = [
    { month: "Jan", matches: 4, investments: 1 },
    { month: "Feb", matches: 6, investments: 0 },
    { month: "Mar", matches: 5, investments: 1 },
    { month: "Apr", matches: 8, investments: 0 },
    { month: "May", matches: 10, investments: 1 },
    { month: "Jun", matches: 7, investments: 2 }
  ];
  
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD"];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Analytics Dashboard</h2>
        <Button variant="outline" size="sm" onClick={handleDateRangeClick}>
          Last 6 Months
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="p-5 border border-border rounded-lg">
          <h3 className="text-sm font-medium mb-4">Monthly Activity</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="matches" name="Matches" fill="#7C6BFF" />
                <Bar dataKey="investments" name="Investments" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 border border-border rounded-lg">
          <h3 className="text-sm font-medium mb-4">Investments by Sector</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value}%`, 'Percentage']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 border border-border rounded-lg">
          <h3 className="text-sm font-medium mb-4">Performance Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { month: "Jan", value: 0 },
                  { month: "Feb", value: 3 },
                  { month: "Mar", value: 5 },
                  { month: "Apr", value: 4 },
                  { month: "May", value: 7 },
                  { month: "Jun", value: 10 }
                ]}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#7C6BFF" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 border border-border rounded-lg">
          <h3 className="text-sm font-medium mb-4">Investments by Stage</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value}%`, 'Percentage']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

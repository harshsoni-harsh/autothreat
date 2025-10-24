"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const COLORS = ["#ef4444", "#f97316", "#facc15", "#60a5fa"];

const vulnerabilityData = [
  { name: "Critical", value: 7 },
  { name: "High", value: 11 },
  { name: "Medium", value: 9 },
  { name: "Low", value: 19 },
];

export default function VulnerabilitiesPage() {
  const chartRef = useRef(null);
  const isInView = useInView(chartRef, { once: true });
  const [user, setUser] = useState(null); // Replace with actual Auth0 user later

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center pt-40 pb-20">
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="text-5xl md:text-6xl font-bold text-slate-900 mb-4"
        >
          Vulnerability Dashboard
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-lg text-slate-600 max-w-2xl"
        >
          Monitor and visualize detected vulnerabilities in your system.  
          Scroll down to explore detailed insights and risk analytics.
        </motion.p>
      </div>

      {/* Parallax Section */}
      <div className="min-h-screen flex flex-col items-center justify-center space-y-10 py-20 bg-gradient-to-br from-slate-100 to-slate-200">
        <motion.div
          ref={chartRef}
          initial={{ opacity: 0, y: 100 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 px-8 max-w-7xl w-full"
        >
          {[
            { title: "Critical", value: 7, color: "text-red-600", bg: "bg-red-100", border: "border-red-600" },
            { title: "High", value: 11, color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-600" },
            { title: "Medium", value: 9, color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-600" },
            { title: "Low", value: 19, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-600" },
          ].map((vuln, i) => (
            <Card key={i} className={`${vuln.bg} border-l-4 ${vuln.border} shadow-md`}>
              <CardHeader>
                <CardTitle>{vuln.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-4xl font-bold ${vuln.color}`}>{vuln.value}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Pie Charts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10 max-w-6xl"
        >
          <Card className="shadow-lg bg-white">
            <CardHeader>
              <CardTitle>Identified Vulnerabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart width={350} height={300}>
                <Pie
                  data={vulnerabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vulnerabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white">
            <CardHeader>
              <CardTitle>Confirmed Vulnerabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart width={350} height={300}>
                <Pie
                  data={vulnerabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vulnerabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer Section */}
      <footer className="text-center py-10 text-slate-500 text-sm">
        © {new Date().getFullYear()} Autothreat | Vulnerability Intelligence Dashboard
      </footer>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Papa from 'papaparse';

interface CsvRow {
  'Phone timestamp': string;
  'HR [bpm]': string;
  'HRV [ms]': string;
}

interface Metrics {
  meanHR: number;
  maxHR: number;
  rmssd: number;
  hrvRange: number;
  meanHRV: number;
  sdnn: number;
  recoveryTime: number;
}

interface DataPoint {
  time: string;
  hr: number;
  hrv: number;
}

const HolterGraph = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    meanHR: 0,
    maxHR: 0,
    rmssd: 0,
    hrvRange: 0,
    meanHRV: 0,
    sdnn: 0,
    recoveryTime: 0
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const parsedData = Papa.parse(text, {
            delimiter: ';',
            header: true,
            skipEmptyLines: true,
          });

          const processedData = (parsedData.data as CsvRow[])
          .map((row) => ({
            time: new Date(row['Phone timestamp']).toLocaleTimeString(),
            hr: parseFloat(row['HR [bpm]']),
            hrv: parseFloat(row['HRV [ms]']?.replace(',', '.') || '0')
          }))
          .filter((row: DataPoint) => !isNaN(row.hr));
        

          setData(processedData);

          const hrValues = processedData.map(d => d.hr).filter(v => !isNaN(v));
          const hrvValues = processedData.map(d => d.hrv).filter(v => !isNaN(v));
          
          const meanHR = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
          const meanHRV = hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length;
          const hrvRange = Math.max(...hrvValues) - Math.min(...hrvValues);

          let rmssd = 0;
          for (let i = 1; i < hrvValues.length; i++) {
            rmssd += Math.pow(hrvValues[i] - hrvValues[i-1], 2);
          }
          rmssd = Math.sqrt(rmssd / (hrvValues.length - 1));

          const sdnn = Math.sqrt(
            hrvValues.reduce((a, b) => a + Math.pow(b - meanHRV, 2), 0) / 
            (hrvValues.length - 1)
          );

          setMetrics({
            meanHR: Number(meanHR.toFixed(1)),
            maxHR: Math.max(...hrValues),
            rmssd: Number(rmssd.toFixed(1)),
            hrvRange: Number(hrvRange.toFixed(1)),
            meanHRV: Number(meanHRV.toFixed(1)),
            sdnn: Number(sdnn.toFixed(1)),
            recoveryTime: 30
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const renderChart = (dataKey: string, label: string, domain: [number, number], color: string) => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="time"
          interval={Math.floor(data.length / 8)}
          angle={-45}
          textAnchor="end"
          height={50}
          tick={{ fontSize: 8 }}
        />
        <YAxis domain={domain} tick={{ fontSize: 8 }} />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="w-full flex flex-col gap-1 p-1 max-w-[794px]">
      <div>
        <input
          type="file"
          accept=".txt,.csv"
          onChange={handleFileUpload}
          className="text-xs file:mr-2 file:py-1 file:px-2
            file:rounded-full file:border-0
            file:text-xs file:font-medium
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="h-40">
          {renderChart('hr', 'BPM', [60, 100], '#6366f1')}
        </div>
        <div className="h-40">
          {renderChart('hrv', 'HRV', [0, 90], '#6366f1')}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-1">
        <Card className="p-1">
          <CardHeader className="p-2">
            <CardTitle className="text-sm">Sympathetic Load</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1 text-xs">
              <div className="w-full bg-gray-100 rounded h-1">
                <div 
                  className={`h-1 rounded ${
                    metrics.meanHR > 85 ? 'bg-red-400' : 
                    metrics.meanHR > 75 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${Math.min((metrics.meanHR / 100) * 100, 100)}%` }}
                />
              </div>
              <div>Mean HR: {metrics.meanHR} bpm</div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-1">
          <CardHeader className="p-2">
            <CardTitle className="text-sm">Parasympathetic</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1 text-xs">
              <div className="w-full bg-gray-100 rounded h-1">
                <div 
                  className={`h-1 rounded ${
                    metrics.rmssd < 10 ? 'bg-red-400' : 
                    metrics.rmssd < 20 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${Math.min((metrics.rmssd / 30) * 100, 100)}%` }}
                />
              </div>
              <div>RMSSD: {metrics.rmssd} ms</div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-1">
          <CardHeader className="p-2">
            <CardTitle className="text-sm">PEM Alert</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1 text-xs">
              <div className="w-full bg-gray-100 rounded h-1">
                <div 
                  className={`h-1 rounded ${
                    metrics.meanHRV < 20 ? 'bg-red-500' : 
                    metrics.meanHRV < 30 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((metrics.meanHRV / 50) * 100, 100)}%` }}
                />
              </div>
              <div className="text-center">
                {metrics.meanHRV < 20 ? "High Risk" : 
                 metrics.meanHRV < 30 ? "Moderate" : "Low Risk"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-1">
          <CardHeader className="p-2">
            <CardTitle className="text-sm">Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="text-xs space-y-1">
              <div>Target: {Math.round(metrics.meanHR * 1.1)}</div>
              <div>Stop: {Math.round(metrics.meanHR * 1.15)}</div>
              <div>Rest: {Math.round(metrics.meanHR * 0.1)}m</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HolterGraph;
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { query } = await request.json();
  
  // Mock AI query interpretation and data generation
  // In real app, this would parse the query and execute against data source
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
  
  const mockData = [
    { month: '2024-01', sales: 125000, orders: 1234 },
    { month: '2024-02', sales: 142000, orders: 1456 },
    { month: '2024-03', sales: 138000, orders: 1398 },
  ];
  
  return NextResponse.json({
    success: true,
    data: mockData,
    query: query,
  });
}

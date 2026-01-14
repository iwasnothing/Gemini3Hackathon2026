import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { message } = await request.json();
  
  // Mock AI response
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const responses = [
    `Based on the dashboard data, I can see that sales have been trending upward. The total sales for Q1 2024 is $405,000.`,
    `The data shows that sales peaked in February 2024 with $142,000 in revenue.`,
    `Looking at the metrics, the average order value is approximately $328.`,
  ];
  
  const response = responses[Math.floor(Math.random() * responses.length)];
  
  return NextResponse.json({
    response,
    timestamp: new Date().toISOString(),
  });
}

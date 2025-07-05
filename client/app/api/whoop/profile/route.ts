import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 400 }
      );
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Define all the WHOOP API endpoints with correct URLs
    const endpoints = {
      profile: 'https://api.prod.whoop.com/developer/v1/user/profile/basic',
      body_measurement: 'https://api.prod.whoop.com/developer/v1/user/measurement/body',
      cycles: 'https://api.prod.whoop.com/developer/v1/cycle?limit=25',
      recovery: 'https://api.prod.whoop.com/developer/v1/recovery?limit=25',
      sleep: 'https://api.prod.whoop.com/developer/v1/activity/sleep?limit=25',
      workout: 'https://api.prod.whoop.com/developer/v1/activity/workout?limit=25'
    };

    // Fetch all data in parallel
    const fetchPromises = Object.entries(endpoints).map(async ([key, url]) => {
      try {
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          return { [key]: { error: `Failed to fetch ${key}: ${response.status} ${errorText}` } };
        }
        
        const data = await response.json();
        return { [key]: data };
      } catch (error) {
        return { [key]: { error: `Error fetching ${key}: ${error}` } };
      }
    });

    // Wait for all requests to complete
    const results = await Promise.all(fetchPromises);
    
    // Combine all results into a single object
    const allData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    
    return NextResponse.json({
      success: true,
      data: allData,
      fetched_at: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
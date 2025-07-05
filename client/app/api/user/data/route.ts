import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 User data API called');
    
    const { walletAddress } = await request.json();
    console.log('📝 Received wallet address:', walletAddress);

    if (!walletAddress) {
      console.log('❌ Missing wallet address');
      return NextResponse.json(
        { error: 'Missing wallet address' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined'
    });

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    console.log('🔗 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    // 1. Get user profile
    console.log('🔍 Step 1: Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    console.log('📊 Profile result:', {
      profileFound: !!profile,
      profileError: profileError?.message,
      profileErrorCode: profileError?.code
    });

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Profile fetch error:', profileError);
      return NextResponse.json(
        { error: `Failed to fetch user profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 2. Get user connections
    console.log('🔍 Step 2: Fetching user connections...');
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('*')
      .eq('reference_id', walletAddress);

    console.log('📊 Connections result:', {
      connectionsFound: connections?.length || 0,
      connectionsError: connectionsError?.message
    });

    if (connectionsError) {
      console.error('❌ Connections fetch error:', connectionsError);
      return NextResponse.json(
        { error: `Failed to fetch user connections: ${connectionsError.message}` },
        { status: 500 }
      );
    }

    // 3. Get sleep metrics for all user connections
    console.log('🔍 Step 3: Fetching sleep metrics...');
    let sleepMetrics = [];
    if (connections && connections.length > 0) {
      const connectionIds = connections.map(conn => conn.id);
      console.log('🔗 Connection IDs:', connectionIds);
      
      const { data: metrics, error: metricsError } = await supabase
        .from('sleep_metrics')
        .select('*')
        .in('user_id', connectionIds)
        .order('created_at', { ascending: false });

      console.log('📊 Sleep metrics result:', {
        metricsFound: metrics?.length || 0,
        metricsError: metricsError?.message
      });

      if (metricsError) {
        console.error('❌ Sleep metrics fetch error:', metricsError);
        return NextResponse.json(
          { error: `Failed to fetch sleep metrics: ${metricsError.message}` },
          { status: 500 }
        );
      }

      sleepMetrics = metrics || [];
    } else {
      console.log('ℹ️ No connections found, skipping sleep metrics');
    }

    const result = {
      success: true,
      data: {
        profile,
        connections,
        sleepMetrics,
        summary: {
          hasProfile: !!profile,
          connectionCount: connections?.length || 0,
          sleepMetricsCount: sleepMetrics.length,
          providers: connections?.map(c => c.provider) || []
        }
      },
      fetched_at: new Date().toISOString()
    };

    console.log('✅ API success, returning data:', {
      hasProfile: result.data.summary.hasProfile,
      connectionCount: result.data.summary.connectionCount,
      sleepMetricsCount: result.data.summary.sleepMetricsCount,
      providers: result.data.summary.providers
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ API Error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 
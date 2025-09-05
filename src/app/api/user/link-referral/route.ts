import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json();
    
    if (!referralCode) {
      return NextResponse.json({ 
        error: 'Referral code is required' 
      }, { status: 400 });
    }
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const supabase = createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();
    
    // 检查用户是否已经被推荐过
    const { data: existingProfile } = await serviceSupabase
      .from('user_profiles')
      .select('referred_by, referral_code')
      .eq('id', user.id)
      .single();
    
    if (existingProfile?.referred_by) {
      return NextResponse.json({ 
        error: 'User already has a referrer',
        success: false
      }, { status: 400 });
    }
    
    // 防止自我推荐
    if (existingProfile?.referral_code === referralCode) {
      return NextResponse.json({ 
        error: 'Cannot refer yourself',
        success: false
      }, { status: 400 });
    }
    
    // 查找推荐人
    const { data: referrer, error: referrerError } = await serviceSupabase
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .eq('referral_code', referralCode)
      .single();
    
    if (referrerError || !referrer) {
      return NextResponse.json({ 
        error: 'Invalid referral code',
        success: false
      }, { status: 404 });
    }
    
    // 开始事务：更新用户推荐关系
    const { error: updateError } = await serviceSupabase
      .from('user_profiles')
      .update({ referred_by: referrer.id })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Failed to update user referral:', updateError);
      return NextResponse.json({ 
        error: 'Failed to establish referral relationship',
        success: false
      }, { status: 500 });
    }
    
    // 创建推荐记录
    const { error: referralError } = await serviceSupabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referee_id: user.id,
        status: 'pending'
      });
    
    if (referralError) {
      console.error('Failed to create referral record:', referralError);
      // 回滚用户更新
      await serviceSupabase
        .from('user_profiles')
        .update({ referred_by: null })
        .eq('id', user.id);
      
      return NextResponse.json({ 
        error: 'Failed to create referral record',
        success: false
      }, { status: 500 });
    }
    
    // 给推荐人奖励积分
    const { error: creditError } = await serviceSupabase
      .from('credit_transactions')
      .insert({
        user_id: referrer.id,
        amount: 10,
        transaction_type: 'referral',
        description: 'Referral signup bonus'
      });
    
    if (creditError) {
      console.error('Failed to award referral credits:', creditError);
    }

    const referrerName = referrer.first_name && referrer.last_name
      ? `${referrer.first_name} ${referrer.last_name}`
      : referrer.first_name
      ? referrer.first_name
      : referrer.email.split('@')[0];

    return NextResponse.json({ 
      success: true,
      message: `Successfully linked to referrer: ${referrerName}`,
      referrer: {
        name: referrerName,
        id: referrer.id
      }
    });
    
  } catch (error) {
    console.error('Link referral error:', error);
    return NextResponse.json({
      error: 'Failed to link referral',
      success: false
    }, { status: 500 });
  }
}
import { supabase } from '@/lib/supabase';

export type UnitType = 'code_generator' | 'security' | 'orchestrator' | 'monitoring' | 'debugging';

export class PersistentUnitService {
  async ensureUnit(userId: string, unitType: UnitType) {
    const { data: existing } = await supabase
      .from('cognitive_units')
      .select('*')
      .eq('user_id', userId)
      .eq('unit_type', unitType)
      .single();

    if (existing) return existing;

    const { data, error } = await supabase
      .from('cognitive_units')
      .insert({ user_id: userId, unit_type: unitType, status: 'active' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async loadState(unitId: string) {
    const { data } = await supabase
      .from('cognitive_unit_state')
      .select('*')
      .eq('unit_id', unitId)
      .order('last_updated_at', { ascending: false })
      .limit(1)
      .single();
    return data?.state || {};
  }

  async saveState(unitId: string, state: Record<string, any>) {
    const { error } = await supabase
      .from('cognitive_unit_state')
      .insert({ unit_id: unitId, state, last_updated_at: new Date().toISOString() });
    if (error) throw error;
  }

  async recordMetrics(unitId: string, metrics: Partial<{ jobs_completed: number; success_rate: number; avg_latency_ms: number; last_job_at: string; custom_metrics: any }>) {
    const { data: existing } = await supabase
      .from('cognitive_unit_metrics')
      .select('*')
      .eq('unit_id', unitId)
      .single();

    if (!existing) {
      const { error } = await supabase.from('cognitive_unit_metrics').insert({ unit_id: unitId, ...metrics });
      if (error) throw error;
      return;
    }
    const { error } = await supabase
      .from('cognitive_unit_metrics')
      .update(metrics)
      .eq('unit_id', unitId);
    if (error) throw error;
  }
}


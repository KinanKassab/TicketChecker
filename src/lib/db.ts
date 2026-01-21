import { createClient } from '@/utils/supabase/server';

export type PaymentMethod = 'SYRIATEL' | 'MTN';
export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED';
export type CommissionStatus = 'PENDING' | 'PAID';

export interface Agent {
  id: string;
  name: string;
  code: string;
  commission_percent: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_token: string;
  amount: number;
  method: PaymentMethod | null;
  phone: string | null;
  reference_code: string;
  status: OrderStatus;
  paid_at: string | null;
  created_at: string;
  agent_id: string | null;
  entered_verification_code?: string | null;
}

export interface Ticket {
  id: string;
  order_id: string;
  attendee_name: string;
  ticket_number: string;
  ticket_token: string;
  qr_token: string;
  checked_in_at: string | null;
  created_at: string;
}

export interface Commission {
  id: string;
  agent_id: string;
  order_id: string;
  commission_amount: number;
  status: CommissionStatus;
  created_at: string;
}

export interface TicketCounter {
  id: number;
  value: number;
}

export interface LinkVisit {
  id: string;
  agent_code: string;
  agent_id: string | null;
  visited_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AgentStats {
  agent: Agent;
  visits: number;
  orders: number;
  paid_orders: number;
  revenue: number;
  conversion_rate: number;
}

// Database helper functions
export async function getSupabase() {
  return await createClient();
}

// Agent functions
export async function getAgentByCode(code: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('code', code)
    .single();
  
  if (error || !data) return null;
  return data as Agent;
}

export async function createAgent(data: {
  name: string;
  code: string;
  commission_percent: number;
}) {
  const supabase = await getSupabase();
  const { data: agent, error } = await supabase
    .from('agents')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return agent as Agent;
}

export async function getAllAgents() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Agent[];
}

export async function getAgentById(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  return data as Agent;
}

export async function updateAgent(
  id: string,
  data: {
    name: string;
    commission_percent: number;
  }
) {
  const supabase = await getSupabase();
  const { data: agent, error } = await supabase
    .from('agents')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return agent as Agent;
}

export async function deleteAgent(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Order functions
export async function getOrderByToken(orderToken: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('orders')
    .select('*, agent:agents(*)')
    .eq('order_token', orderToken)
    .single();
  
  if (error) {
    console.error("Error fetching order by token:", error);
    // If table doesn't exist or other DB error
    if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
      console.error("Database table 'orders' might not exist. Please run the SQL schema.");
    }
    return null;
  }
  
  if (!data) return null;
  return data as Order & { agent?: Agent | null };
}

export async function getOrderByReferenceCode(referenceCode: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('reference_code', referenceCode)
    .single();
  
  if (error || !data) return null;
  return data as Order;
}

export async function createOrder(data: {
  order_token: string;
  amount: number;
  reference_code: string;
  agent_id?: string | null;
}) {
  const supabase = await getSupabase();
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      ...data,
      status: 'PENDING',
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating order:", error);
    // If table doesn't exist
    if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
      throw new Error("Database table 'orders' does not exist. Please run the SQL schema from database_SQL/schema.sql in Supabase SQL Editor.");
    }
    throw error;
  }
  
  if (!order) {
    throw new Error("Failed to create order - no data returned");
  }
  
  return order as Order;
}

export async function updateOrder(
  orderToken: string,
  updates: Partial<{
    method: PaymentMethod;
    phone: string;
    status: OrderStatus;
    paid_at: string | null;
  }>
) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('order_token', orderToken)
    .select()
    .single();
  
  if (error) throw error;
  return data as Order;
}

export async function getAllOrders() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('orders')
    .select('*, agent:agents(*)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as (Order & { agent?: Agent | null })[];
}

// Ticket functions
export async function getTicketByToken(ticketToken: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('tickets')
    .select('*, order:orders(*)')
    .eq('ticket_token', ticketToken)
    .single();
  
  if (error || !data) return null;
  return data as Ticket & { order?: Order | null };
}

export async function getTicketByQrToken(qrToken: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('qr_token', qrToken)
    .single();
  
  if (error || !data) return null;
  return data as Ticket;
}

export async function createTicket(data: {
  order_id: string;
  attendee_name: string;
  ticket_number: string;
  ticket_token: string;
  qr_token: string;
}) {
  const supabase = await getSupabase();
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return ticket as Ticket;
}

export async function updateTicketCheckIn(qrToken: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('tickets')
    .update({ checked_in_at: new Date().toISOString() })
    .eq('qr_token', qrToken)
    .select()
    .single();
  
  if (error) throw error;
  return data as Ticket;
}

export async function getAllTickets() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('tickets')
    .select('*, order:orders(*)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as (Ticket & { order?: Order | null })[];
}

// Commission functions
export async function createCommission(data: {
  agent_id: string;
  order_id: string;
  commission_amount: number;
}) {
  const supabase = await getSupabase();
  const { data: commission, error } = await supabase
    .from('commissions')
    .insert({
      ...data,
      status: 'PENDING',
    })
    .select()
    .single();
  
  if (error) throw error;
  return commission as Commission;
}

export async function getAllCommissions() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('commissions')
    .select('*, agent:agents(*), order:orders(*)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as (Commission & { agent?: Agent | null; order?: Order | null })[];
}

// Ticket counter function
export async function getNextTicketNumber(): Promise<number> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('get_next_ticket_number');
  
  if (error) throw error;
  return data as number;
}

// Link visit tracking functions
export async function createLinkVisit(data: {
  agent_code: string;
  agent_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}) {
  const supabase = await getSupabase();
  const { data: visit, error } = await supabase
    .from('link_visits')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return visit as LinkVisit;
}

export async function getVisitsByAgentCode(agentCode: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('link_visits')
    .select('*')
    .eq('agent_code', agentCode)
    .order('visited_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as LinkVisit[];
}

export async function getAllLinkVisits() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('link_visits')
    .select('*')
    .order('visited_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as LinkVisit[];
}

// Analytics function to get stats per agent
export async function getAgentStats(): Promise<AgentStats[]> {
  const agents = await getAllAgents();
  const orders = await getAllOrders();
  const visits = await getAllLinkVisits();
  
  return agents.map((agent) => {
    const agentVisits = visits.filter((v) => v.agent_code === agent.code);
    const agentOrders = orders.filter((o) => o.agent_id === agent.id);
    const paidOrders = agentOrders.filter((o) => o.status === 'PAID');
    const revenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
    const conversionRate = agentVisits.length > 0 
      ? (paidOrders.length / agentVisits.length) * 100 
      : 0;
    
    return {
      agent,
      visits: agentVisits.length,
      orders: agentOrders.length,
      paid_orders: paidOrders.length,
      revenue,
      conversion_rate: Math.round(conversionRate * 100) / 100,
    };
  });
}

import { supabase } from '../supabase'

export async function fetchAccounts() {
  const { data, error } = await supabase.from('accounts').select('*')
  if (error) throw error
  return Object.fromEntries(data.map(a => [a.id, { ...a }]))
}

export async function updateAccount(id, updates) {
  const { error } = await supabase.from('accounts').update({
    cash: updates.cash,
    deposits: updates.deposits,
    withdrawals: updates.withdrawals,
  }).eq('id', id)
  if (error) throw error
}

export async function fetchHoldings() {
  const { data: holdings, error } = await supabase
    .from('holdings')
    .select('*, tranches(*)')
  if (error) throw error
  return holdings.map(h => ({
    id: h.id,
    accountId: h.account_id,
    ticker: h.ticker,
    name: h.name,
    exchange: h.exchange,
    tranches: (h.tranches || []).map(t => ({
      id: t.id,
      date: t.date,
      shares: t.shares,
      costPrice: t.cost_price,
      dividends: t.dividends || 0,
    }))
  }))
}

export async function addHolding({ id, accountId, ticker, name, exchange }) {
  const { error } = await supabase.from('holdings').insert({
    id, account_id: accountId, ticker, name, exchange,
  })
  if (error) throw error
}

export async function updateHolding(id, { ticker, name, exchange }) {
  const { error } = await supabase.from('holdings').update({ ticker, name, exchange }).eq('id', id)
  if (error) throw error
}

export async function removeHolding(id) {
  const { error } = await supabase.from('holdings').delete().eq('id', id)
  if (error) throw error
}

export async function addTranche({ id, holdingId, date, shares, costPrice, dividends }) {
  const { error } = await supabase.from('tranches').insert({
    id, holding_id: holdingId, date, shares,
    cost_price: costPrice, dividends: dividends || 0,
  })
  if (error) throw error
}

export async function updateTranche(id, { date, shares, costPrice, dividends }) {
  const { error } = await supabase.from('tranches').update({
    date, shares, cost_price: costPrice, dividends,
  }).eq('id', id)
  if (error) throw error
}

export async function deleteTranche(id) {
  const { error } = await supabase.from('tranches').delete().eq('id', id)
  if (error) throw error
}

export async function updateTrancheDividends(trancheId, dividends) {
  const { error } = await supabase.from('tranches').update({ dividends }).eq('id', trancheId)
  if (error) throw error
}

export async function fetchSoldPositions() {
  const { data, error } = await supabase
    .from('sold_positions')
    .select('*')
    .order('sell_date', { ascending: false })
  if (error) throw error
  return data.map(s => ({
    id: s.id,
    accountId: s.account_id,
    ticker: s.ticker,
    name: s.name,
    exchange: s.exchange,
    shares: s.shares,
    avgCost: s.avg_cost,
    sellPrice: s.sell_price,
    sellDate: s.sell_date,
    totalCost: s.total_cost,
    proceeds: s.proceeds,
    gainLoss: s.gain_loss,
    gainLossPct: s.gain_loss_pct,
    dividendsReceived: s.dividends_received || 0,
    createdAt: s.created_at,
  }))
}

export async function addSoldPosition(pos) {
  const { error } = await supabase.from('sold_positions').insert({
    id: pos.id,
    account_id: pos.accountId,
    ticker: pos.ticker,
    name: pos.name,
    exchange: pos.exchange,
    shares: pos.shares,
    avg_cost: pos.avgCost,
    sell_price: pos.sellPrice,
    sell_date: pos.sellDate,
    total_cost: pos.totalCost,
    proceeds: pos.proceeds,
    gain_loss: pos.gainLoss,
    gain_loss_pct: pos.gainLossPct,
    dividends_received: pos.dividendsReceived || 0,
  })
  if (error) throw error
}

export async function deleteSoldPosition(id) {
  const { error } = await supabase.from('sold_positions').delete().eq('id', id)
  if (error) throw error
}

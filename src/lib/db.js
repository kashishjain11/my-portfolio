import { supabase } from '../supabase'

export async function fetchAccounts() {
  const { data, error } = await supabase.from('accounts').select('*')
  if (error) throw error
  return Object.fromEntries(data.map(a => [a.id, { ...a, dividendsReceived: a.dividends_received || 0 }]))
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
  const { data: holdings, error: hErr } = await supabase
    .from('holdings')
    .select('*, tranches(*)')
  if (hErr) throw hErr
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

export async function removeHolding(id) {
  const { error } = await supabase.from('holdings').delete().eq('id', id)
  if (error) throw error
}

export async function addTranche({ id, holdingId, date, shares, costPrice, dividends }) {
  const { error } = await supabase.from('tranches').insert({
    id, holding_id: holdingId, date, shares, cost_price: costPrice, dividends: dividends || 0,
  })
  if (error) throw error
}

export async function updateTrancheDividends(trancheId, dividends) {
  const { error } = await supabase.from('tranches').update({ dividends }).eq('id', trancheId)
  if (error) throw error
}

INSERT INTO accounts (id, cash, deposits, withdrawals) VALUES
  ('rrsp_k', 0, 0, 0),
  ('tfsa_k', 0, 0, 0),
  ('nonreg_k', 0, 0, 0),
  ('rrsp_dj', 0, 0, 0),
  ('tfsa_dj', 0, 0, 0),
  ('nonreg_dj', 0, 0, 0),
  ('joint_k', 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS sold_positions (
  id text PRIMARY KEY,
  account_id text,
  ticker text NOT NULL,
  name text,
  exchange text,
  shares numeric,
  avg_cost numeric,
  sell_price numeric,
  sell_date text,
  total_cost numeric,
  proceeds numeric,
  gain_loss numeric,
  gain_loss_pct numeric,
  dividends_received numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sold_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON sold_positions FOR ALL USING (true);

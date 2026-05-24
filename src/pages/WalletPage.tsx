import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History, Lock, CheckCircle } from 'lucide-react';
import { supabase, type UserProfile, type Transaction, type Gig } from '../lib/supabase';

interface WalletPageProps {
  profile: UserProfile;
}

export function WalletPage({ profile }: WalletPageProps) {
  const [balance, setBalance] = useState(profile.balance || 0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeEscrows, setActiveEscrows] = useState<Gig[]>([]);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState('100');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile.user_id]);

  const loadData = async () => {
    // Load transactions
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txData) setTransactions(txData as Transaction[]);

    // Load active escrows
    const { data: escrowData } = await supabase
      .from('gigs')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('escrow_held', true)
      .eq('escrow_released', false);

    if (escrowData) setActiveEscrows(escrowData as Gig[]);

    // Refresh balance
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('balance')
      .eq('user_id', profile.user_id)
      .single();

    if (profileData) setBalance(profileData.balance);
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) return;

    setLoading(true);

    // Create transaction
    await supabase.from('transactions').insert([{
      user_id: profile.user_id,
      type: 'deposit',
      amount: amount,
      reference_type: 'deposit',
      status: 'completed',
      description: 'Added funds to wallet',
    }]);

    // Update balance
    const newBalance = balance + amount;
    await supabase
      .from('user_profiles')
      .update({ balance: newBalance })
      .eq('user_id', profile.user_id);

    setBalance(newBalance);
    setShowAddFunds(false);
    setAddAmount('100');
    setLoading(false);
    loadData();
  };

  const totalEscrow = activeEscrows.reduce((sum, g) => sum + g.escrow_amount, 0);
  const availableBalance = balance - totalEscrow;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <Wallet className="w-7 h-7 text-cyan-500" />
          Wallet
        </h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Balance</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">${balance.toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Available</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">${availableBalance.toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> In Escrow
            </p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">${totalEscrow.toFixed(2)}</p>
          </div>
        </div>

        {/* Add Funds Button */}
        <button
          onClick={() => setShowAddFunds(true)}
          className="w-full mb-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Funds to Wallet
        </button>

        {/* Active Escrows */}
        {activeEscrows.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Active Escrows
            </h2>
            <div className="space-y-2">
              {activeEscrows.map((gig) => (
                <div key={gig.id} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{gig.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{gig.accepted_by_name || 'Waiting for contractor'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">${gig.escrow_amount.toFixed(2)}</p>
                      <p className="text-xs text-slate-500 capitalize">{gig.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              Transaction History
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {tx.type === 'deposit' && <ArrowDownLeft className="w-5 h-5 text-green-500" />}
                    {tx.type === 'escrow_hold' && <Lock className="w-5 h-5 text-amber-500" />}
                    {tx.type === 'escrow_release' && <ArrowUpRight className="w-5 h-5 text-red-500" />}
                    {tx.type === 'earning' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {tx.type === 'refund' && <ArrowDownLeft className="w-5 h-5 text-blue-500" />}
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                        {tx.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold ${tx.type === 'earning' || tx.type === 'deposit' || tx.type === 'refund' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {tx.type === 'earning' || tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Funds Modal */}
        {showAddFunds && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Funds</h3>

              <div className="space-y-3 mb-4">
                {['50', '100', '200', '500'].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAddAmount(amt)}
                    className={`w-full py-2 rounded-lg border transition-all ${addAmount === amt ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'}`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Or enter custom amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full pl-7 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddFunds(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFunds}
                  disabled={loading}
                  className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Funds'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

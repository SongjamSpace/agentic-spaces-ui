import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProcessFarcasterProfile } from "@/services/db/processFarcaster.service";

interface AirdropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (entries: { address: string; amount: number }[]) => void;
  profiles: ProcessFarcasterProfile[];
  isLoading: boolean;
  isDeploying: boolean;
  isSigning: boolean;
  tokenSymbol: string;
}

export function AirdropModal({
  isOpen,
  onClose,
  onDeploy,
  profiles,
  isLoading,
  isDeploying,
  isSigning,
  tokenSymbol,
}: AirdropModalProps) {
  const [totalAmount, setTotalAmount] = useState<number>(260000000);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());

  // Reset selection when profiles load or modal opens
  useEffect(() => {
    if (isOpen && profiles.length > 0) {
       setSelectedProfiles(new Set(profiles.map(p => p.farcasterId)));
    }
  }, [isOpen, profiles]);

  if (!isOpen) return null;

  const toggleProfileSelection = (farcasterId: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(farcasterId)) {
      newSelected.delete(farcasterId);
    } else {
      newSelected.add(farcasterId);
    }
    setSelectedProfiles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProfiles.size === profiles.length) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(profiles.map(p => p.farcasterId)));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/,/g, ''), 10);
    if (!isNaN(val)) {
        setTotalAmount(val);
    } else if (e.target.value === '') {
        setTotalAmount(0);
    }
  };

  const handleDeployClick = () => {
    if (totalAmount < 260000000) {
        alert("Total airdrop amount must be at least 260,000,000");
        return;
    }

    const entries = profiles
      .filter(p => selectedProfiles.has(p.farcasterId))
      .map(p => ({
        address: p.verifiedAddresses.eth_addresses[0],
        amount: totalAmount / (selectedProfiles.size || 1)
      }));
    
    onDeploy(entries);
  };

  const formattedAmount = totalAmount.toLocaleString();
  const individualAmount = selectedProfiles.size > 0 
    ? (totalAmount / selectedProfiles.size).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🪂</span> Airdrop List
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Distribute tokens to your community
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-800">
             <div className="flex flex-col gap-2">
                 <label className="text-sm font-medium text-slate-300">Total Airdrop Amount</label>
                 <div className="relative">
                     <input 
                        type="text" 
                        value={formattedAmount}
                        onChange={handleAmountChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{tokenSymbol}</span>
                 </div>
                 <div className="flex justify-between text-xs">
                     <span className={`${totalAmount < 260000000 ? 'text-red-400' : 'text-slate-500'}`}>
                        Minimum allocation: 260,000,000
                     </span>
                     <span className="text-cyan-400">
                        {individualAmount} per wallet
                     </span>
                 </div>
             </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p>Loading eligible profiles...</p>
            </div>
          ) : profiles.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-900 z-10 pb-2 border-b border-slate-800 mb-2">
                 <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedProfiles.size === profiles.length && profiles.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500/50 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Farcaster</span>
                 </div>
                <span>Wallet & Allocation</span>
              </div>
              {profiles.map((profile) => {
                const isSelected = selectedProfiles.has(profile.farcasterId);
                return (
                <div 
                  key={profile.farcasterId} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-800/60 border-purple-500/30' 
                      : 'bg-slate-900/40 border-slate-800 opacity-60 hover:opacity-100 hover:bg-slate-800/40'
                  }`}
                  onClick={() => toggleProfileSelection(profile.farcasterId)}
                >
                  <div className="flex items-center gap-3">
                     <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent div click
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500/50 focus:ring-offset-0 pointer-events-none"
                     />
                     <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                       {profile.pfpUrl ? (
                         <img src={profile.pfpUrl} alt={profile.farcasterUsername} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                           {profile.farcasterUsername.slice(0, 2).toUpperCase()}
                         </div>
                       )}
                     </div>
                     <div className="min-w-0">
                       <div className={`font-medium truncate max-w-[120px] ${isSelected ? 'text-white' : 'text-slate-400'}`}>{profile.farcasterName}</div>
                       <div className="text-xs text-slate-500 truncate">@{profile.farcasterUsername}</div>
                     </div>
                  </div>
                  <div className="text-right shrink-0">
                    {isSelected && (
                      <div className="font-mono text-cyan-400 text-sm animate-in fade-in slide-in-from-right-4">
                         {(totalAmount / (selectedProfiles.size || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 font-mono">
                      {profile.verifiedAddresses.eth_addresses[0].slice(0, 6)}...{profile.verifiedAddresses.eth_addresses[0].slice(-4)}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 bg-slate-800/20 rounded-xl border border-slate-800 border-dashed">
              <p>No eligible profiles found in your social graph.</p>
              <p className="text-sm mt-2">Make sure you have processed your social graph and your connections have verified ETH addresses.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
           <div className="flex items-center justify-between mb-4 text-sm">
             <div className="flex flex-col">
                 <span className="text-slate-400">Total Recipients</span>
                 <span className="text-xs text-slate-600">Selected from eligible</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-white font-bold text-lg">{selectedProfiles.size}</span>
               <span className="text-slate-500">/ {profiles.length}</span>
             </div>
           </div>
           <div className="flex gap-3">
             <button 
               onClick={onClose}
               className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
             >
               Cancel
             </button>
             <button
               onClick={handleDeployClick}
               disabled={isDeploying || isSigning || selectedProfiles.size === 0 || totalAmount < 260000000}
               className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
               {isSigning ? 'Signing...' : isDeploying ? 'Deploying...' : 'Deploy'}
               {!isSigning && !isDeploying && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
               )}
             </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

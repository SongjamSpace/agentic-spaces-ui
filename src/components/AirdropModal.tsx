import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProcessFarcasterProfile } from "@/services/db/processFarcaster.service";

interface AirdropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (entries: { address: string; amount: number }[], config?: TokenConfig) => void;
  profiles: ProcessFarcasterProfile[];
  isLoading: boolean;
  isDeploying: boolean;
  isSigning: boolean;
  tokenSymbol: string;
}

interface TokenConfig {
  vaultPercentage?: number;
  vaultDays?: number;
  poolType: 'standard';
  feeType: 'static' | 'dynamic';
  initialMarketCap: number;
  staticClankerFee?: number;
  staticPairedFee?: number;
  dynamicBaseFee?: number;
  dynamicMaxLpFee?: number;
  enableDevBuy: boolean;
  devBuyAmount: number;
  airdropLockupDays: number;
  airdropVestingDays: number;
  enableSniperFees: boolean;
  sniperFeeDuration?: number;
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
  const [activeTab, setActiveTab] = useState<'airdrop' | 'advanced'>('airdrop');
  const [totalAmount, setTotalAmount] = useState<number>(250000000);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());

  // Advanced Options State
  const [config, setConfig] = useState<TokenConfig>({
    vaultPercentage: 10,
    vaultDays: 30,
    poolType: 'standard',
    feeType: 'dynamic',
    initialMarketCap: 10,
    staticClankerFee: 1,
    staticPairedFee: 1,
    dynamicBaseFee: 1,
    dynamicMaxLpFee: 2.2,
    enableDevBuy: false,
    devBuyAmount: 0,
    airdropLockupDays: 1,
    airdropVestingDays: 1,
    enableSniperFees: true,
    sniperFeeDuration: 60,
  });

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




  const handleDeployClick = () => {
    if (totalAmount < 250000000) {
        alert("Total airdrop amount must be at least 250,000,000");
        return;
    }

    const selectedProfilesArray = profiles.filter(p => selectedProfiles.has(p.farcasterId));
    const numRecipients = selectedProfilesArray.length;
    
    // Calculate whole number amount per wallet (floor division)
    const baseAmount = Math.floor(totalAmount / numRecipients);
    
    // Calculate remainder to award to first wallet
    const remainder = totalAmount - (baseAmount * numRecipients);
    
    const entries = selectedProfilesArray.map((p, index) => ({
      address: p.verifiedAddresses.eth_addresses[0],
      amount: index === 0 ? baseAmount + remainder : baseAmount
    }));
    
    onDeploy(entries, config);
  };



  const individualAmount = selectedProfiles.size > 0 
    ? Math.floor(totalAmount / selectedProfiles.size).toLocaleString()
    : "0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🚀</span> Token Deployment
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Configure your token settings and airdrop distribution
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
          
          {/* Tab Navigation */}
          <div className="flex gap-2 bg-slate-800/30 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('airdrop')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'airdrop'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="mr-1.5">🪂</span> Airdrop List
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'advanced'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="mr-1.5">⚙️</span> Advanced
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'airdrop' ? (
          <>
            <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-800">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Total Airdrop Amount</label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                      {totalAmount >= 1000000000 
                        ? `${(totalAmount / 1000000000).toFixed(1)}B` 
                        : `${Math.round(totalAmount / 1000000)}M`}
                    </span>
                    <span className="text-slate-500 font-bold">{tokenSymbol}</span>
                  </div>
                </div>
                
                <div className="relative">
                  <input 
                    type="range" 
                    min={250000000}
                    max={90000000000}
                    step={10000000}
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(34, 211, 238) ${((totalAmount - 250000000) / (90000000000 - 250000000)) * 100}%, rgb(51, 65, 85) ${((totalAmount - 250000000) / (90000000000 - 250000000)) * 100}%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                    <span>250M</span>
                    <span>90B</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-center gap-2 text-sm bg-slate-900/40 rounded-lg py-2.5 px-3 border border-slate-800">
                    <span className="text-slate-400">Per wallet:</span>
                    <span className="text-cyan-400 font-mono font-semibold">
                      {individualAmount}
                    </span>
                  </div>
                  {/* {selectedProfiles.size > 0 && (totalAmount % selectedProfiles.size) > 0 && (
                    <div className="text-xs text-center text-slate-500">
                      First wallet receives +{(totalAmount % selectedProfiles.size).toLocaleString()}
                    </div>
                  )} */}
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
                            {Math.floor(totalAmount / (selectedProfiles.size || 1)).toLocaleString()}
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
          </>
        ) : (
          <>
            {/* Advanced Options Tab */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-6">
                
                {/* Creator Vault Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>🏦</span> Creator Vault
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Vault Percentage (1-90%)</label>
                      <input 
                        type="number"
                        min="1"
                        max="90"
                        value={config.vaultPercentage}
                        onChange={(e) => setConfig({...config, vaultPercentage: parseInt(e.target.value) || 10})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Vault Days (min 7)</label>
                      <input 
                        type="number"
                        min="7"
                        value={config.vaultDays}
                        onChange={(e) => setConfig({...config, vaultDays: parseInt(e.target.value) || 30})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Pool Configuration */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>💧</span> Pool Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Pool Type</label>
                      <input 
                        type="text"
                        value="standard"
                        disabled
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-500 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Fee Type</label>
                      <select 
                        value={config.feeType}
                        onChange={(e) => setConfig({...config, feeType: e.target.value as 'static' | 'dynamic'})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      >
                        <option value="dynamic">Dynamic</option>
                        <option value="static">Static</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Initial Market Cap</label>
                    <input 
                      type="number"
                      min="1"
                      value={config.initialMarketCap}
                      onChange={(e) => setConfig({...config, initialMarketCap: parseFloat(e.target.value) || 10})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Fee Configuration */}
                {config.feeType === 'static' ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>💰</span> Static Fees
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5">Clanker Fee (0-5%)</label>
                        <input 
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={config.staticClankerFee}
                          onChange={(e) => setConfig({...config, staticClankerFee: parseFloat(e.target.value) || 1})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5">Paired Fee (0-5%)</label>
                        <input 
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={config.staticPairedFee}
                          onChange={(e) => setConfig({...config, staticPairedFee: parseFloat(e.target.value) || 1})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>📊</span> Dynamic Fees
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5">Base Fee (min 0.25%)</label>
                        <input 
                          type="number"
                          min="0.25"
                          step="0.05"
                          value={config.dynamicBaseFee}
                          onChange={(e) => setConfig({...config, dynamicBaseFee: parseFloat(e.target.value) || 1})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5">Max LP Fee (max 5%)</label>
                        <input 
                          type="number"
                          max="5"
                          step="0.1"
                          value={config.dynamicMaxLpFee}
                          onChange={(e) => setConfig({...config, dynamicMaxLpFee: parseFloat(e.target.value) || 2.2})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Airdrop Configuration */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>🪂</span> Airdrop Vesting
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Lockup Days</label>
                      <input 
                        type="number"
                        min="1"
                        value={config.airdropLockupDays}
                        onChange={(e) => setConfig({...config, airdropLockupDays: parseInt(e.target.value) || 7})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Vesting Days</label>
                      <input 
                        type="number"
                        min="1"
                        value={config.airdropVestingDays}
                        onChange={(e) => setConfig({...config, airdropVestingDays: parseInt(e.target.value) || 30})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Sniper Fee Protection */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>🛡️</span> Sniper Fee Protection
                  </h4>
                  <div className="flex items-center gap-3 mb-2">
                    <input 
                      type="checkbox"
                      checked={config.enableSniperFees}
                      onChange={(e) => setConfig({...config, enableSniperFees: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500/50"
                    />
                    <label className="text-sm text-slate-300">Enable Sniper Fee Protection</label>
                  </div>
                  {config.enableSniperFees && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Duration (15-120 seconds)</label>
                      <input 
                        type="number"
                        min="15"
                        max="120"
                        value={config.sniperFeeDuration}
                        onChange={(e) => setConfig({...config, sniperFeeDuration: parseInt(e.target.value) || 60})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}

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
               disabled={isDeploying || isSigning || selectedProfiles.size === 0 || totalAmount < 250000000}
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

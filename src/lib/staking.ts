import { ethers } from "ethers";

// Constants
const MIN_STAKED_AMOUNT = ethers.parseUnits("50000", 18); // 100 EVA minimum stake
const OPTIMAL_STAKED_AMOUNT = ethers.parseUnits("500000", 18); // 100 EVA minimum stake
const STACKING_CONTRACT_ADDRESS = "0x4C143539356444ABA748b8523A39D953f24D8d80";

// ERC20 ABI for balance checking
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];

export interface StakingInfo {
  hasMinimumStake: boolean;
  optimalStake: boolean;
  balance: string;
  formattedBalance: string;
  symbol: string;
  name: string;
}

export const getStakingStatus = async (
  walletAddress: string
): Promise<StakingInfo> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Alchemy API key not configured. Please add NEXT_PUBLIC_ALCHEMY_API_KEY to your environment variables."
      );
    }

    const provider = new ethers.AlchemyProvider(8453, apiKey);

    // check if user has a balance of this contract
    const contract = new ethers.Contract(
      STACKING_CONTRACT_ADDRESS,
      ERC20_ABI,
      provider
    );

    const balance = await contract.balanceOf(walletAddress);

    if (balance > 0) {
      return {
        hasMinimumStake: balance >= MIN_STAKED_AMOUNT,
        optimalStake: balance >= OPTIMAL_STAKED_AMOUNT,
        balance: balance.toString(),
        formattedBalance: ethers.formatUnits(balance, 18),
        symbol: "EVA",
        name: "EVA",
      };
    }

    return {
      hasMinimumStake: false,
      optimalStake: false,
      balance: "0",
      formattedBalance: "0",
      symbol: "EVA",
      name: "EVA",
    };
  } catch (error) {
    console.error("Error fetching staking status:", error);
    return {
      hasMinimumStake: false,
      optimalStake: false,
      balance: "0",
      formattedBalance: "0",
      symbol: "EVA",
      name: "EVA",
    };
  }
};

export const isValidEthereumAddress = (address: string): boolean => {
  return ethers.isAddress(address);
};

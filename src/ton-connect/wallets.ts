import {
  isWalletInfoRemote,
  WalletInfoRemote,
  WalletsListManager,
} from '@tonconnect/sdk'

const walletsListManager = new WalletsListManager({
  cacheTTLMs: Number(process.env.WALLETS_LIST_CAHCE_TTL_MS),
})

export async function getWallets(): Promise<WalletInfoRemote[]> {
  const wallets = await walletsListManager.getWallets()
  return wallets.filter(isWalletInfoRemote)
}

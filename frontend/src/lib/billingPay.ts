import { createWalletClient, custom, type Address, type Hex } from 'viem'
import { base, baseSepolia } from 'viem/chains'

const PAY_ABI = [
  {
    type: 'function',
    name: 'pay',
    inputs: [{ name: 'paymentRef', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'payable',
  },
] as const

function chainForId(chainId: number) {
  if (chainId === baseSepolia.id) return baseSepolia
  return base
}

async function walletForChain(chainId: number) {
  const eth = (window as unknown as { ethereum?: Parameters<typeof custom>[0] }).ethereum
  if (!eth) throw new Error('Wallet introuvable (installez MetaMask)')

  const chain = chainForId(chainId)
  const wallet = createWalletClient({
    chain,
    transport: custom(eth),
  })

  const [account] = await wallet.requestAddresses()
  await wallet.switchChain({ id: chain.id }).catch(async () => {
    await wallet.addChain({ chain })
    await wallet.switchChain({ id: chain.id })
  })

  return { wallet, account }
}

export async function payPremiumDeposit(opts: {
  depositAddress: Address
  chainId: number
  priceWei: bigint
}): Promise<Hex> {
  const { wallet, account } = await walletForChain(opts.chainId)
  return wallet.sendTransaction({
    account,
    to: opts.depositAddress,
    value: opts.priceWei,
  })
}

/** Legacy contract pay() — utilisé si deposit_address absent. */
export async function payPremiumOrder(opts: {
  contractAddress: Address
  chainId: number
  paymentRef: Hex
  priceWei: bigint
}): Promise<Hex> {
  const { wallet, account } = await walletForChain(opts.chainId)
  return wallet.writeContract({
    account,
    address: opts.contractAddress,
    abi: PAY_ABI,
    functionName: 'pay',
    args: [opts.paymentRef],
    value: opts.priceWei,
  })
}

export function formatEthFromWei(wei: string | bigint): string {
  const n = typeof wei === 'bigint' ? wei : BigInt(wei)
  const eth = Number(n) / 1e18
  if (eth >= 0.001) return `${eth.toFixed(4)} ETH`
  return `${eth.toFixed(6)} ETH`
}

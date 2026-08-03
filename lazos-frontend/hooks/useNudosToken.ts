import { useContract, useSigner } from 'wagmi'
import NudosTokenAbi from '../../out/NudosToken.sol/NudosToken.json'
import { NUDOS_CONTRACT } from '../src/config/contracts'

export const useNudosToken = () => {
  const { data: signer } = useSigner()

  const contract = useContract({
    address: NUDOS_CONTRACT.address,
    abi: NudosTokenAbi.abi,
    signerOrProvider: signer,
  })

  return contract
}

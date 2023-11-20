import Env from '@ioc:Adonis/Core/Env'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
const { ChainId, Fetcher, WETH, Route, Trade, TokenAmount, TradeType } = require('@uniswap/sdk')
import { BitGo } from 'bitgo'
import bs58check from 'bs58check'
import { ethers } from 'ethers'

export default class BitgosController {
  public async createWallet(ctx: HttpContextContract) {
    const bitgo = new BitGo({ env: 'test' })
    bitgo.authenticateWithAccessToken({ accessToken: Env.get('BITGO_ACCESS_TOKEN') })

    return await bitgo
      .coin('gteth')
      .wallets()
      .generateWallet({
        label: 'Test Wallet 01', // label of the wallet
        passphrase: 'secretpassphrase', // the passphrase of the wallet
        enterprise: Env.get('MY_ENTERPRISE_ID'),
      })
      .then(function (wallet) {
        // print the new wallet
        return wallet
      })
  }

  public async createKey(ctx: HttpContextContract) {
    const bitgo = new BitGo({ env: 'test' })
    bitgo.authenticateWithAccessToken({ accessToken: Env.get('BITGO_ACCESS_TOKEN') })

    const key = bitgo.coin('gteth').keychains().create()

    return key
  }

  public async swap(ctx: HttpContextContract) {
    const url = 'ADD_YOUR_ETHEREUM_NODE_URL'
    const customHttpProvider = new ethers.JsonRpcProvider(url)

    const chainId = ChainId.MAINNET
    const tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

    const dai = await Fetcher.fetchTokenData(chainId, tokenAddress, customHttpProvider)
    const weth = WETH[chainId]
    const pair = await Fetcher.fetchPairData(dai, weth, customHttpProvider)
    const route = new Route([pair], weth)
    const trade = new Trade(
      route,
      new TokenAmount(weth, '100000000000000000'),
      TradeType.EXACT_INPUT
    )
    console.log('Mid Price WETH --> DAI:', route.midPrice.toSignificant(6))
    console.log('Mid Price DAI --> WETH:', route.midPrice.invert().toSignificant(6))
    console.log('-'.repeat(45))
    console.log('Execution Price WETH --> DAI:', trade.executionPrice.toSignificant(6))
    console.log('Mid Price after trade WETH --> DAI:', trade.nextMidPrice.toSignificant(6))
  }

  public async convert(ctx: HttpContextContract) {
    const xprvPrivateEncode = ctx.request.body.arguments.xprvKey
    const decodedData = bs58check.decode(xprvPrivateEncode)
    const privateBuffer = decodedData.slice(4, 36)
    const hexPrivateKey = this.uint8ArrayToHex(privateBuffer)
    return hexPrivateKey
  }

  private uint8ArrayToHex(uint8Array) {
    return Array.from(uint8Array, (byte: any) => byte.toString(16).padStart(2, '0')).join('')
  }
}

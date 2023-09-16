import dotenv from 'dotenv'
dotenv.config()

import { bot } from './bot'
import { getWallets } from './ton-connect/wallets'
import { getConnector } from './ton-connect/connector'
import QRCode from 'qrcode'
import './connect-wallet-menu'

bot.onText(/\/connect/, async (msg) => {
  const chatId = msg.chat.id
  const wallets = await getWallets()

  const connector = getConnector(chatId)

  connector.onStatusChange((wallet) => {
    if (wallet) {
      bot.sendMessage(chatId, `${wallet.device.appName} wallet connected!`)
    }
  })

  const link = connector.connect(wallets)
  const image = await QRCode.toBuffer(link)

  await bot.sendPhoto(chatId, image, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Open Wallet',
            url: `https://ton-connect.github.io/open-tc?connect=${encodeURIComponent(
              link
            )}`,
          },
          {
            text: 'Choose a Wallet',
            callback_data: JSON.stringify({ method: 'chose_wallet' }),
          },
        ],
      ],
    },
  })
})

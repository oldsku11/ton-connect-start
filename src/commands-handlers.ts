import { bot } from './bot'
import { getWallets } from './ton-connect/wallets'
import QRCode from 'qrcode'
import TelegramBot from 'node-telegram-bot-api'
import { getConnector } from './ton-connect/connector'

export async function handleConnectCommand(
  msg: TelegramBot.Message
): Promise<void> {
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
}

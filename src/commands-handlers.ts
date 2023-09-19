import { bot } from './bot'
import { getWallets } from './ton-connect/wallets'
import QRCode from 'qrcode'
import TelegramBot from 'node-telegram-bot-api'
import { getConnector } from './ton-connect/connector'
import { UserRejectsError, isWalletInfoRemote } from '@tonconnect/sdk'

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

export async function handleSendTXCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id

  const connector = getConnector(chatId)

  await connector.restoreConnection()
  if (!connector.connected) {
    await bot.sendMessage(chatId, 'Connect wallet to send transaction')
    return
  }

  const wallets = await connector.getWallets()

  connector
    .sendTransaction({
      validUntil: Math.round(Date.now() / 1000) + 600, // timeout is SECONDS
      messages: [
        {
          amount: '1000000',
          address:
            '0:0000000000000000000000000000000000000000000000000000000000000000',
        },
      ],
    })
    .then(() => {
      bot.sendMessage(chatId, `Transaction sent successfully`)
    })
    .catch((e) => {
      if (e instanceof UserRejectsError) {
        bot.sendMessage(chatId, `You rejected the transaction`)
        return
      }

      bot.sendMessage(chatId, `Unknown error happened`)
    })
    .finally(() => connector.pauseConnection())

  let deeplink = ''
  const walletInfo = wallets.find(
    (wallet) => wallet.name === connector.wallet!.device.appName
  )
  if (walletInfo && isWalletInfoRemote(walletInfo)) {
    deeplink = walletInfo.universalLink
  }

  await bot.sendMessage(
    chatId,
    `Open ${connector.wallet!.device.appName} and confirm transaction`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Open Wallet',
              url: deeplink,
            },
          ],
        ],
      },
    }
  )
}
import { CallbackQuery } from 'node-telegram-bot-api'
import { getWallets } from './ton-connect/wallets'
import { getConnector } from './ton-connect/connector'
import { bot } from './bot'
import QRCode from 'qrcode'
import TelegramBot from 'node-telegram-bot-api'
import fs from 'fs'

export const walletMenuCallbacks = {
  chose_wallet: onChooseWalletClick,
  select_wallet: onWalletClick,
  universal_qr: onOpenUniversalQRClick,
}

bot.on('callback_query', (query) => {
  if (!query.data) {
    return
  }

  let request: { method: string; data: string }

  try {
    request = JSON.parse(query.data)
  } catch {
    return
  }

  if (
    !walletMenuCallbacks[request.method as keyof typeof walletMenuCallbacks]
  ) {
    return
  }

  walletMenuCallbacks[request.method as keyof typeof walletMenuCallbacks](
    query,
    request.data
  )
})

async function onChooseWalletClick(
  query: CallbackQuery,
  _: string
): Promise<void> {
  const wallets = await getWallets()

  await bot.editMessageReplyMarkup(
    {
      inline_keyboard: [
        wallets.map((wallet) => ({
          text: wallet.name,
          callback_data: JSON.stringify({
            method: 'select_wallet',
            data: wallet.name,
          }),
        })),
        [
          {
            text: '« Back',
            callback_data: JSON.stringify({
              method: 'universal_qr',
            }),
          },
        ],
      ],
    },
    {
      message_id: query.message!.message_id,
      chat_id: query.message!.chat.id,
    }
  )
}

async function editQR(
  message: TelegramBot.Message,
  link: string
): Promise<void> {
  const fileName = 'QR-code-' + Math.round(Math.random() * 10000000000)

  await QRCode.toFile(`./${fileName}`, link)

  await bot.editMessageMedia(
    {
      type: 'photo',
      media: `attach://${fileName}`,
    },
    {
      message_id: message?.message_id,
      chat_id: message?.chat.id,
    }
  )

  await new Promise((r) => fs.rm(`./${fileName}`, r))
}

async function onOpenUniversalQRClick(
  query: CallbackQuery,
  _: string
): Promise<void> {
  const chatId = query.message!.chat.id
  const wallets = await getWallets()

  const connector = getConnector(chatId)

  connector.onStatusChange((wallet) => {
    if (wallet) {
      bot.sendMessage(chatId, `${wallet.device.appName} wallet connected!`)
    }
  })

  const link = connector.connect(wallets)

  await editQR(query.message!, link)

  await bot.editMessageReplyMarkup(
    {
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
    {
      message_id: query.message?.message_id,
      chat_id: query.message?.chat.id,
    }
  )
}

async function onWalletClick(
  query: CallbackQuery,
  data: string
): Promise<void> {
  const chatId = query.message!.chat.id
  const connector = getConnector(chatId)

  connector.onStatusChange((wallet) => {
    if (wallet) {
      bot.sendMessage(chatId, `${wallet.device.appName} wallet connected!`)
    }
  })

  const wallets = await getWallets()

  const selectedWallet = wallets.find((wallet) => wallet.name === data)
  if (!selectedWallet) {
    return
  }

  const link = connector.connect({
    bridgeUrl: selectedWallet.bridgeUrl,
    universalLink: selectedWallet.universalLink,
  })

  await editQR(query.message!, link)

  await bot.editMessageReplyMarkup(
    {
      inline_keyboard: [
        [
          {
            text: '« Back',
            callback_data: JSON.stringify({ method: 'chose_wallet' }),
          },
          {
            text: `Open ${data}`,
            url: link,
          },
        ],
      ],
    },
    {
      message_id: query.message?.message_id,
      chat_id: chatId,
    }
  )
}
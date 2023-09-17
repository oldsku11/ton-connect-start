import { CallbackQuery } from 'node-telegram-bot-api'
import { getWallets } from './ton-connect/wallets'
import { bot } from './bot'
import QRCode from 'qrcode'
import TelegramBot from 'node-telegram-bot-api'
import fs from 'fs'

export const walletMenuCallbacks = {
  chose_wallet: onChooseWalletClick,
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

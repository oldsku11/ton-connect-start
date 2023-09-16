import { CallbackQuery } from 'node-telegram-bot-api'
import { getWallets } from './ton-connect/wallets'
import { bot } from './bot'

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

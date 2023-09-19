import dotenv from 'dotenv'
dotenv.config()

import { bot } from './bot'
import './connect-wallet-menu'
import { handleConnectCommand, handleSendTXCommand } from './commands-handlers'
import { walletMenuCallbacks } from './connect-wallet-menu'

const callbacks = {
  ...walletMenuCallbacks,
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

  if (!callbacks[request.method as keyof typeof callbacks]) {
    return
  }

  callbacks[request.method as keyof typeof callbacks](query, request.data)
})

bot.onText(/\/connect/, handleConnectCommand)
bot.onText(/\/send_tx/, handleSendTXCommand)
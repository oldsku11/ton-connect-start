import dotenv from 'dotenv'
dotenv.config()

import { bot, message } from './bot'

bot.on('message', (msg) => {
  const chatId = msg.chat.id

  bot.sendMessage(chatId, message)
})

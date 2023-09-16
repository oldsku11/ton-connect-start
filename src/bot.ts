import TelegramBot from 'node-telegram-bot-api'
import * as process from 'process'

const token = process.env.TELEGRAM_BOT_TOKEN!
const message = process.env.REPLY_MESSAGE!

export const bot = new TelegramBot(token, { polling: true })
export { message }
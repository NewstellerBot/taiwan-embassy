const getDates = require('../util/getDates')
const formatDates = require('../util/formatDates')
const controller = require('../controller')

module.exports = {
  start: (ctx) => ctx.reply('Welcome!\nType /help to see available commands'),
  help: (ctx) =>
    ctx.reply(
      'To be notified about any changes in the appointments, use /subscribe\nTo get the list of available appointments, use /list\nTo unsubscribe, use /unsubscribe'
    ),
  subscribe: async (ctx) => {
    const chat = await ctx.getChat()
    if (!controller.getIds().includes(chat.id)) controller.addId(chat.id)
    ctx.reply('👍')
  },
  unsubscribe: async (ctx) => {
    const chat = await ctx.getChat()
    if (controller.getIds().includes(chat.id)) {
      controller.removeId(chat.id)
    }
    ctx.reply('👍')
  },
  list: async (ctx) => {
    const data = await getDates()
    const formatted = formatDates(data)
    ctx.reply(formatted, { parse_mode: 'MarkdownV2' })
  },
}

const axios = require('axios')
const { Telegraf } = require('telegraf')
const fs = require('fs')
require('dotenv').config()

const express = require('express')
const app = express()

const bot = new Telegraf(process.env.BOT_TOKEN)
const PORT = process.env.PORT || 3000

const getAvailableTimes = async () => {
  try {
    const res = await axios.get(
      'https://api.appointlet.com/bookables/164144/available_times?service=490015'
    )

    const data = res.data.map((d) => {
      const date = new Date(d)
      return {
        date: date
          .toLocaleDateString('pl', { timeZone: 'Europe/Warsaw' })
          .replaceAll('.', '\\.'),
        time: date
          .toLocaleTimeString('pl', { timeZone: 'Europe/Warsaw' })
          .slice(0, 5),
      }
    })
    return data
  } catch (error) {
    throw error
  }
}

const formatAvailableTimes = (data) => {
  const grouped = {}
  data.forEach((entry) => {
    if (!grouped[entry.date]) grouped[entry.date] = []
    grouped[entry.date].push(entry.time)
  })

  let formatted = '*Currently available appointments:*\n\n'

  for (const [date, times] of Object.entries(grouped)) {
    formatted += `*${date}:*\n`
    times.forEach((time) => {
      formatted += `${time}\n`
    })
    formatted += '\n'
  }
  return formatted
}

const controller = () => {}

if (fs.existsSync('./ids.json')) {
  const ids = JSON.parse(fs.readFileSync('./ids.json'))
  controller.ids = ids
} else {
  controller.ids = []
}

console.log(controller.ids)

controller.getIds = () => {
  return controller.ids
}

controller.addId = (id) => {
  controller.ids.push(id)
}

const main = async () => {
  try {
    let prev = { date: '', time: '' }

    bot.start((ctx) =>
      ctx.reply('Welcome!\nType /help to see available commands')
    )
    bot.help((ctx) =>
      ctx.reply(
        'To be notified about any changes in the appointments, use /subscribe'
      )
    )
    bot.hears('/subscribe', async (ctx) => {
      const chat = await ctx.getChat()
      if (!controller.getIds().includes(chat.id)) controller.addId(chat.id)
      fs.writeFileSync('./ids.json', JSON.stringify(controller.getIds()))
      ctx.reply('👍')
    })

    bot.launch()

    const notify = async () => {
      try {
        const available = await getAvailableTimes()

        if (JSON.stringify(prev) !== JSON.stringify(available)) {
          prev = available
          controller.getIds().forEach(async (id) => {
            bot.telegram.sendMessage(id, '📅 New appointments available!')
            const available = await getAvailableTimes()
            const formatted = formatAvailableTimes(available)
            bot.telegram.sendMessage(id, formatted, {
              parse_mode: 'MarkdownV2',
            })
          })
        }
        setTimeout(notify, 1000 * 60 * 5)
      } catch (err) {
        throw err
      }
    }

    await notify()

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
  } catch (err) {
    console.log('ERROR: \n', err)
  }
}

main().catch(console.log)

app.get('/', async (req, res) => {
  const available = await getAvailableTimes()
  const formatted = formatAvailableTimes(available)
  res.send(formatted)
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))

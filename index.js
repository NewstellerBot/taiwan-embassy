const axios = require('axios')
const { Telegraf } = require('telegraf')
const fs = require('fs')
const path = require('path')
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

if (fs.existsSync(path.join(__dirname, 'ids.json'))) {
  const ids = JSON.parse(path.join(__dirname, 'ids.json'))
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
        'To be notified about any changes in the appointments, use /subscribe\nTo get the list of available appointments, use /list\nTo unsubscribe, use /unsubscribe'
      )
    )
    bot.hears('/subscribe', async (ctx) => {
      const chat = await ctx.getChat()
      if (!controller.getIds().includes(chat.id)) controller.addId(chat.id)
      fs.writeFileSync(
        path.join(__dirname, 'ids.json'),
        JSON.stringify(controller.getIds())
      )
      ctx.reply('👍')
    })

    bot.hears('/unsubscribe', async (ctx) => {
      const chat = await ctx.getChat()
      if (controller.getIds().includes(chat.id)) {
        controller.ids = controller.ids.filter((id) => id !== chat.id)
        fs.writeFileSync(
          path.join(__dirname, 'ids.json'),
          JSON.stringify(controller.getIds())
        )
      }
      ctx.reply('👍')
    })

    bot.hears('/list', async (ctx) => {
      const data = await getAvailableTimes()
      const formatted = formatAvailableTimes(data)
      ctx.reply(formatted, { parse_mode: 'MarkdownV2' })
    })

    bot.launch()

    setInterval(async () => {
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
      } catch (err) {
        throw err
      }
    }, 1000 * 60 * 5)

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
  } catch (err) {
    console.log('ERROR: \n', err)
  }
}

main().catch(console.log)

app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))

const formatDates = (data) => {
  console.log(data)
  const formattedData = data.map((d) => {
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
  const grouped = {}
  formattedData.forEach((entry) => {
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

module.exports = formatDates

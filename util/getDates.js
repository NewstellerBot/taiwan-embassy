const axios = require('axios')

const getDates = async () => {
  try {
    const res = await axios.get(
      'https://api.appointlet.com/bookables/164144/available_times?service=490015'
    )
    return res.data
  } catch (error) {
    throw error
  }
}

module.exports = getDates

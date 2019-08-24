const request = require('request');

module.exports = {
  baseUrl: 'https://api.songkick.com/api/3.0',

  getVenueIdFromName: (skApiKey, inputVenueName) => {
    const promise = new Promise((resolve, reject) => {
      request.get(`https://api.songkick.com/api/3.0/search/venues.json?query=${inputVenueName}&apikey=${skApiKey}`,
      {},
      (error, response) => {
        console.log({ error })
        console.log({ response })
        if (response) {
          return resolve(response)
        } else {
          reject(error)
        }
      })
    })
    return promise
  }
}
const request = require('request');

module.exports = {
  baseUrl: 'https://api.songkick.com/api/3.0',

  getVenueIdFromName: (skApiKey, inputVenueName) => {
    const promise = new Promise((resolve, reject) => {
      request.get(`https://api.songkick.com/api/3.0/search/venues.json?query=${inputVenueName}&apikey=${skApiKey}`,
      {},
      (error, response) => {
        if (response) {
          const body = JSON.parse(response.body)
          // FIXME: determine which venue of results is desired one
          const firstVenue = body.resultsPage.results.venue[0]
          return resolve(firstVenue.id)
        } else {
          reject(error)
        }
      })
    })
    return promise
  },

  getUpcomingPerformancesForVenue: async (skApiKey, venueId, minDate, maxDate) => {
    const promise = new Promise((resolve, reject) => {
      request.get(`https://api.songkick.com/api/3.0/venues/${venueId}/calendar.json?apikey=${skApiKey}&min_date=${minDate}&max_date=${maxDate}`,
      {},
      (error, response) => {
        if(response) {
          const body = JSON.parse(response.body)
          const performances = body.resultsPage.results.event
          return resolve(performances)
        } else {
          reject(error)
        }
      })
    })
    return promise
  },

  parseArtistsFromPerformanceData: (concerts, billingsToInclude) => {
    try {
      // possible billings types from songkick: 'headline', 'support'
      const artistNames = new Set();
      concerts.forEach((concert) => {
        concert.performance.forEach((artist) => {
          if(!artistNames.has(artist.displayName) && billingsToInclude.includes(artist.billing)) {
            artistNames.add(artist.displayName);
          }
        })
      })
      return [...artistNames]
    } catch (error) {
      return error
    }
  }

}
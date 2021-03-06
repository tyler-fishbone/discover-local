const request = require('request');

module.exports = {
  baseUrl: 'http://api.songkick.com/api/3.0',

  getVenueIdFromName: (skApiKey, inputVenueName) => {
    const promise = new Promise((resolve, reject) => {
      request.get(`http://api.songkick.com/api/3.0/search/venues.json?query=${inputVenueName}&apikey=${skApiKey}`,
      {},
      (error, response) => {
        if (response) {
          const body = JSON.parse(response.body)
          if (body.resultsPage.totalEntries < 1) {
            return reject('No venues found by that name')
          }
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

  getVenueDataFromName: (skApiKey, inputVenueName) => {
    const promise = new Promise((resolve, reject) => {
      request.get(`http://api.songkick.com/api/3.0/search/venues.json?query=${inputVenueName}&apikey=${skApiKey}`,
      {},
      (error, response) => {
        if (response) {
          const body = JSON.parse(response.body)
          if (body.resultsPage.totalEntries < 1) {
            return reject('No venues found by that name')
          }
          // FIXME: determine which venue of results is desired one
          const firstVenue = body.resultsPage.results.venue[0]
          return resolve(firstVenue)
        } else {
          reject(error)
        }
      })
    })
    return promise
  },

  getUpcomingPerformancesForVenue: async (skApiKey, venueId, minDate, maxDate) => {
    const promise = new Promise((resolve, reject) => {
      request.get(`http://api.songkick.com/api/3.0/venues/${venueId}/calendar.json?apikey=${skApiKey}&min_date=${minDate}&max_date=${maxDate}`,
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

  getUpcomingPerformancesForMetroArea: async (skApiKey, metroId, minDate, maxDate) => {
    // refactor to make multiple calls 
    const pageNum = 1
    const promise = new Promise((resolve, reject) => {
      request.get(`http://api.songkick.com/api/3.0/metro_areas/${metroId}/calendar.json?apikey=${skApiKey}&min_date=${minDate}&max_date=${maxDate}&page=${pageNum}`,
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
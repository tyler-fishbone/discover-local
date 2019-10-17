const skHelper = require('./songkick_helper')

module.exports = {
  exclamate: (inputString) => {
    return inputString + '!'
  },

  getUpcomingArtistsPlayingInVenue: async (skApiKey, inputVenueName, minDate, maxDate) => {
    try {
      const venueId = await skHelper.getVenueIdFromName(skApiKey, inputVenueName)
      const performances = 
        await skHelper.getUpcomingPerformancesForVenue(skApiKey, venueId, minDate, maxDate)
      const artists = skHelper.parseArtistsFromPerformanceData(performances, ['headline', 'support']);

      return artists

    } catch (error) {
      return error
    }
  },

  // best to have a function that uses the id? names it as such?
  getUpcomingArtistsPlayingInMetroArea: async (skApiKey, metroId, minDate, maxDate) => {
    try {
      const performances =
        await skHelper.getUpcomingPerformancesForMetroArea(skApiKey, metroId, minDate, maxDate);
        
      return performances
    } catch (error) {
      return error
    }
  }
}
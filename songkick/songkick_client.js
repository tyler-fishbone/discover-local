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
      const artists = skHelper.parseArtistsFromPerformanceData(performances);

      return artists

    } catch (error) {
      return error
    }
  }
}
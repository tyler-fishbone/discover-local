// try refactoring with async await instead:
// https://medium.com/hackernoon/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9

const sptfyHelper = require('./spotify_helper');


module.exports = {
  exclamate: (inputString) => {
    return inputString + '!'
  },

  findArtistAndAddTopTracksToPlaylist: async (token, artistName, playlistId) => {
    try {

      const artistId = await sptfyHelper.getArtistIdByName(token, artistName)
      const topTracks = await sptfyHelper.getArtistTopTracks(token, artistId)
      const trackUris = sptfyHelper.getTrackUrisFromTrackObjects(topTracks)
      await sptfyHelper.addTracksToPlaylist(token, trackUris, playlistId)

      // FIXME: change the below to boolean values and return those
      return 1

    } catch (error) {
      console.log(`${artistName} ${error}`);
      return 0
    }
  }

}
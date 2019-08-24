var request = require('request');
// try refactoring with async await instead:
// https://medium.com/hackernoon/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9

module.exports = {
  exclamate: (inputString) => {
    return inputString + '!';
  },

  getArtistIdByName: (token, inputName) => {
    let promise = new Promise((resolve, reject) => {
      request.get(`https://api.spotify.com/v1/search?q=${inputName}&type=artist`, {
        'auth': {
          'bearer': token,
        },
      }, (error, response) => {
        const body = JSON.parse(response.body);
        if (body.artists
          && body.artists.items) {
          // fixme: if two artists have the same name this returns the first
          // better to return the one who is most popular
          const artist = body.artists.items.find(artist => {
            return artist.name.toLowerCase() === inputName.toLowerCase();
          })
          if (artist) {
            return resolve(artist.id);
          } else {
            reject('artist not found')
          }
        }
        reject(`probably auth error: ${error}`);
      })
    })
    return promise;
  },

  getArtistTopTracks: (token, artistId, numTracks = 3) => {
    const promise = new Promise((resolve, reject) => {
      request.get(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=us`, {
          'auth': { 'bearer': token },
        }, (error, response) => {
          const body = JSON.parse(response.body)
          if (body) {
            const topTracks = body.tracks.slice(0, numTracks);
            resolve(topTracks)
          } else {
            reject(error)
          }
        })
      })
    return promise
  },

  addTracksToPlaylist: (token, arrayOfTrackUris, playlistId) => {
    const promise = new Promise((resolve, reject) => {
      request.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        'auth': {
          'bearer': token,
        },
        'Content-Type': 'application/json',
        'body': JSON.stringify({
          'uris': arrayOfTrackUris,
        }),
      }, (error, response) => {
        if(response) {
          resolve(response);
        } else {
          reject(error)
        }
      })
    })
    return promise;
  },

  getTrackUrisFromTrackObjects: (trackObjects) => {
    const trackUris = trackObjects.map(trackObj => {
      return trackObj.uri;
    })
    return trackUris;
  }
}
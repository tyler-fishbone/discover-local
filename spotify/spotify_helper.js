var request = require('request');
// try refactoring with async await instead:
// https://medium.com/hackernoon/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9

module.exports = {
  exclamate: (inputString) => {
    return inputString + '!';
  },

  getUser: (token) => {
    let promise = new Promise((resolve, reject) => {
      request.get(`https://api.spotify.com/v1/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }, 
      (error, response) => {
        if (response) {
          const body = JSON.parse(response.body)
          resolve (body)
        } else {
          reject(error)
        }
      })
    })
    return promise
  },

  getArtistIdByName: (token, inputName) => {
    let promise = new Promise((resolve, reject) => {
      request.get(`https://api.spotify.com/v1/search?q=${inputName}&type=artist`, {
        'auth': {
          'bearer': token,
        },
      }, (error, response) => {
        if(response && response.body) {          
          const body = JSON.parse(response.body);
          if (body.artists
            && body.artists.items
            && body.artists.items.length > 0) {
            // fixme: if two artists have the same name this returns the first
            // better to return the one who is most popular
            const artist = body.artists.items.find(artist => {
              return artist.name.toLowerCase() === inputName.toLowerCase();
            })
            if (artist) {
              resolve(artist.id);
            } else {
              reject(`${inputName} not found on spotify`)
              return
            }
          } else {
            reject(`${inputName} not found on spotify`)
            return
          }
        }
        reject(`probably auth error: ${error}`)
        return;
      })
    })
    return promise;
  },

  getArtistTopTracks: (token, artistId, numTracks = 1) => {
    const promise = new Promise((resolve, reject) => {
      request.get(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=us`, {
          'auth': { 'bearer': token },
        }, (error, response) => {
          if (response.body) {
            const body = JSON.parse(response.body)
            if (body.tracks) {
              const topTracks = body.tracks.slice(0, numTracks);
              resolve(topTracks)
            } else {
              reject(error)
              return
            }
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
          return
        }
      })
    })
    return promise;
  },

  createSpotifyPlaylist: (token, userId, name, description) => {
    const promise = new Promise((resolve, reject) => {
      request.post(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        'auth': {
          'bearer': token,
        },
        'Content-Type': 'application/json',
        'body': JSON.stringify({
          name,
          description,
        })
      }, (error, response) => {
        if(response) {
          resolve(response);
        } else {
          reject(error)
        }
      })
    })
    return promise
  },

  translateVenueForUseInSpotify: (venue) => {
    try {
      return {
        displayName: venue.displayName,
        description: venue.description,
        location: {
          street: venue.street,
          city: venue.city.displayName,
          zipCode: venue.zip,
          state: venue.city.state.displayName,
          country: venue.city.country.displayName,
          lat: venue.lat,
          lng: venue.lng,
          phone: venue.phone,
        },
        website: venue.website,
        capacity: venue.capacity,
      }
    } catch (error) {
      return `error in translateVenueForUseInSpotify ${error}`
    }
  },

  buildPlaylistDescription: (inputVenue) => {
    
    let venueDescription = ''

    venueDescription += inputVenue.description
    venueDescription += ` ${inputVenue.website}`

    return venueDescription
  },

  getTrackUrisFromTrackObjects: (trackObjects) => {
    const trackUris = trackObjects.map(trackObj => {
      return trackObj.uri;
    })
    return trackUris;
  }
}
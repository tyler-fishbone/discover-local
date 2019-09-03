/**
 * For more information on the Authorization Code oAuth2 flow to 
 * authenticate against the Spotify Accounts visit:
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

const express = require('express') // Express web server framework
const request = require('request') // "Request" library
const cors = require('cors')
const querystring = require('querystring')
const cookieParser = require('cookie-parser')
const moment = require('moment')
const dotenv = require('dotenv')
dotenv.config();

const client_id = process.env.CLIENT_ID // Your client id
const client_secret = process.env.CLIENT_SECRET // Your secret
const redirect_uri = process.env.REDIRECT_URI // Your redirect uri
let spotify_access_token = ''

const sk_api_key = process.env.SONGKICK_API_KEY

const sptfyClient = require('./spotify/spotify_client')
const skClient = require('./songkick/songkick_client')
const skHelper = require('./songkick/songkick_helper')

const oneWeekAhead = moment().add(7, 'days').format('YYYY-MM-DD')
const threeWeeksAhead = moment().add(21, 'days').format('YYYY-MM-DD')

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const stateKey = 'spotify_auth_state';

var app = express();

let counter = 0;

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        spotify_access_token = body.access_token
        var refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + spotify_access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        console.log(`spotify_access_token: ${spotify_access_token}`);

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: spotify_access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      spotify_access_token = body.access_token;
      res.send({
        'access_token': spotify_access_token
      });
    }
  });
});

app.get('/test_endpoint', function(req, res) {
  counter++;
  console.log(`test endpoint hit: ${counter}`);
  res.send(`test endpoint response: ${counter}`);
})

app.get('/get_song', (req, res) => {
  counter++;
  console.log(`hit /get_song: ${counter}`);

  request.get('https://api.spotify.com/v1/tracks/4iV5W9uYEdYUVa79Axb7Rh', {
    'auth': {
      'bearer': spotify_access_token,
    }
  }, (error, response, body) => {
    res.send(response);
  });
})

app.get('/get_playlist', (req, res) => {
  counter++;
  console.log(`hit /get_playlist: ${counter}`);
  request.get('https://api.spotify.com/v1/playlists/3qDz3bBo6XaswehrDoKgYy', {
    'auth': {
      'bearer': spotify_access_token,
    }
  }, (error, response, body) => {
    res.send(response);
  });
})

app.get('/rename_playlist', (req, res) => {
  counter++;
  console.log(`hit /rename-playlist: ${counter}`);

  const newName = moment().valueOf();
  request.put('https://api.spotify.com/v1/playlists/3qDz3bBo6XaswehrDoKgYy', {
    'auth': {
      'bearer': spotify_access_token,
    },
    'Content-Type': 'application/json',
    'body': JSON.stringify({
      'name': newName.toString(),
    }),
  }, (error, response, body) => {
    res.send(response);
  });
})


app.get('/add_fujitsu_top_tracks', async (req, res) => {
  counter++;
  console.log(`hit /add_fujitsu_top_tracks: ${counter}`)

  try {

    const playlistId = '3qDz3bBo6XaswehrDoKgYy'
    const artistName = 'fujitsu'
    const response = 
      await sptfyClient.findArtistAndAddTopTracksToPlaylist(
        spotify_access_token, artistName, playlistId
    )
    res.send(response)

  } catch (error) {
    res.send(error)
  }
})

app.get('/get_artists_playing_at_the_crocodile', async (req, res) => {
  counter++
  console.log(`hit /get_artists_playing_at_the_crocodile: ${counter}`)

  const inputVenueName = 'The Crocodile'

  try {
    const response =
      await skClient.getUpcomingArtistsPlayingInVenue(
        sk_api_key, inputVenueName, oneWeekAhead, threeWeeksAhead
      )
    
    console.log({ response });
    res.send(response)

  } catch (error) {
    res.send(error)
  }
})

app.get('/add_upcoming_music_for_crocodile', async (req, res) => {
  counter++
  console.log(`hit /add_upcoming_music_for_crocodile: ${counter}`)

  try {
    const inputVenueName = 'The Crocodile'
    const playlistId = '3qDz3bBo6XaswehrDoKgYy'
    const artistNames = await skClient.getUpcomingArtistsPlayingInVenue(
      sk_api_key, inputVenueName, oneWeekAhead, threeWeeksAhead
    )
    console.log(artistNames)
    artistNames.forEach((artistName) => {
      sptfyClient.findArtistAndAddTopTracksToPlaylist(
        spotify_access_token, artistName,playlistId
      )
    })
    res.send({
      artistNames,
      truth: 'likely not all artists were found',
    })
  } catch (error) {
    res.send(error)
  }
})

app.get('/search_venue', async (req, res) => {
  counter++
  console.log(`hit /search_venue: ${counter}`)

  try {
    const venueName = req.query.venue_name;
    const venueData = await skHelper.getVenueDataFromName(sk_api_key, venueName)
    console.log(venueName)
    res.send({venueData})
    
  } catch(error) {
    res.send(error)
  }

})

app.get('/add_venue_playlist', async (req, res) => {
  counter++
  console.log(`hit /add_venue_playlist: ${counter}`)

  try {
    const venueName = req.query.venue_name;
    const venueData = await skHelper.getVenueDataFromName(sk_api_key, venueName)
    console.log(venueName)
    res.send({venueData})
    
  } catch(error) {
    res.send(error)
  }

})

console.log('Listening on 8888');
app.listen(8888);

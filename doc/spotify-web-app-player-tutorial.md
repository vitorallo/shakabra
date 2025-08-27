# Building a Spotify Player inside a Web App - Complete Tutorial

*Based on official Spotify documentation*

This tutorial leads you step by step to create a simple full-stack application to host the Spotify player to play music along with the rest of the devices from your home.

![Final Player](https://developer-assets.spotifycdn.com/images/documentation/web-playback-sdk/guide_final_player.png)

## Prerequisites

- **Spotify Premium account** (required for Web Playback SDK)
- Knowledge of JavaScript (frontend with React and backend with Node.js)
- Familiarity with [Quick Start Guide](https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started) (recommended)

## Source Code

The complete source code is available on the [Spotify GitHub repository](https://github.com/spotify/spotify-web-playback-sdk-example).

## Set up your Account

1. Go to [Spotify for Developers](https://developer.spotify.com/) portal
2. Log in using your Spotify credentials
3. Navigate to the [Dashboard](https://developer.spotify.com/dashboard)
4. Click **Create an APP**
5. Provide name and description
6. Accept terms and conditions
7. Click **Create**

Your new application will contain your **Client ID** and **Client Secret** needed for authorization.

## Initializing the Project

### Create React App

```bash
npx create-react-app spotify-web-player
cd spotify-web-player
```

### Install Dependencies

```bash
npm install
npm install npm-run-all --save-dev
npm install express --save-dev
npm install dotenv --save-dev
npm install request --save-dev
npm install http-proxy-middleware --save-dev
```

### Create Server Directory

```bash
mkdir server
```

### Update package.json Scripts

```json
{
  "scripts": {
    "start": "HOST=127.0.0.1 react-scripts start",
    "build": "react-scripts build",
    "server": "HOST=127.0.0.1 node server",
    "dev": "run-p server start"
  }
}
```

Script explanations:
- `start`: HTTP server on port 3000 for React app
- `build`: Generate static code for production
- `server`: Execute server/index.js
- `dev`: Run both client and server in parallel

### Environment Configuration

Create `.env` file in root directory:

```bash
SPOTIFY_CLIENT_ID='your_spotify_client_id'
SPOTIFY_CLIENT_SECRET='your_spotify_client_secret'
```

## Authorization Implementation

We'll implement the [Authorization Code flow](https://developer.spotify.com/documentation/web-api/tutorials/code-flow) for long-running web apps.

### Backend Server Setup

Create `server/index.js`:

```javascript
const express = require('express')
const dotenv = require('dotenv');
const port = 5000

dotenv.config()

var spotify_client_id = process.env.SPOTIFY_CLIENT_ID
var spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET

var app = express();

// Random string generator for state parameter
var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.get('/auth/login', (req, res) => {
  var scope = "streaming user-read-email user-read-private"
  var state = generateRandomString(16);
  
  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: spotify_client_id,
    scope: scope,
    redirect_uri: "http://127.0.0.1:3000/auth/callback",
    state: state
  })
  
  res.redirect('https://accounts.spotify.com/authorize/?' + auth_query_parameters.toString());
})

var access_token = '';

app.get('/auth/callback', (req, res) => {
  var code = req.query.code;
  
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: "http://127.0.0.1:3000/auth/callback",
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    json: true
  };
  
  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      access_token = body.access_token;
      res.redirect('/')
    }
  });
})

app.get('/auth/token', (req, res) => {
  res.json({
    access_token: access_token
  })
})

app.listen(port, () => {
  console.log(`Listening at http://127.0.0.1:${port}`)
})
```

### Required Scopes

The Web Playback SDK requires these specific scopes:
- `streaming` - Control playback on Web Playback SDK
- `user-read-email` - Read user email 
- `user-read-private` - Read user profile

### Register Callback URL

1. Go to your Spotify app in the Dashboard
2. Click **Edit Settings**
3. Add `http://127.0.0.1:3000/auth/callback` under **Redirect URIs**
4. Click **Save**

![Register Callback](https://developer-assets.spotifycdn.com/images/documentation/web-playback-sdk/register_callback.png)

## Frontend Implementation

### Proxy Setup

Create `src/setupProxy.js`:

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/auth/**',
    createProxyMiddleware({
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
    })
  );
};
```

### Main App Component

Replace `src/App.js`:

```javascript
import React, { useState, useEffect } from 'react';
import WebPlayback from './WebPlayback'
import Login from './Login'
import './App.css';

function App() {
  const [token, setToken] = useState('');

  useEffect(() => {
    async function getToken() {
      const response = await fetch('/auth/token');
      const json = await response.json();
      setToken(json.access_token);
    }

    getToken();
  }, []);

  return (
    <>
      {(token === '') ? <Login/> : <WebPlayback token={token} />}
    </>
  );
}

export default App;
```

### Login Component

Create `src/Login.js`:

```javascript
import React from 'react';

function Login() {
  return (
    <div className="App">
      <header className="App-header">
        <a className="btn-spotify" href="/auth/login">
          Login with Spotify
        </a>
      </header>
    </div>
  );
}

export default Login;
```

### WebPlayback Component

Create `src/WebPlayback.js`:

```javascript
import React, { useState, useEffect } from 'react';

const track = {
  name: "",
  album: {
    images: [
      { url: "" }
    ]
  },
  artists: [
    { name: "" }
  ]
}

function WebPlayback(props) {
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [player, setPlayer] = useState(undefined);
  const [current_track, setTrack] = useState(track);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: cb => { cb(props.token); },
        volume: 0.5
      });

      setPlayer(player);

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.addListener('player_state_changed', (state => {
        if (!state) {
          return;
        }

        setTrack(state.track_window.current_track);
        setPaused(state.paused);

        player.getCurrentState().then(state => { 
          (!state) ? setActive(false) : setActive(true) 
        });
      }));

      player.connect();
    };
  }, []);

  return (
    <>
      <div className="container">
        <div className="main-wrapper">
          <img src={current_track.album.images[0].url}
               className="now-playing__cover" alt="" />

          <div className="now-playing__side">
            <div className="now-playing__name">{current_track.name}</div>
            <div className="now-playing__artist">{current_track.artists[0].name}</div>

            <button className="btn-spotify" onClick={() => { player.previousTrack() }} >
              &lt;&lt;
            </button>

            <button className="btn-spotify" onClick={() => { player.togglePlay() }} >
              {is_paused ? "PLAY" : "PAUSE"}
            </button>

            <button className="btn-spotify" onClick={() => { player.nextTrack() }} >
              &gt;&gt;
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default WebPlayback
```

## Testing the Application

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Open browser and navigate to:**
   ```
   http://127.0.0.1:3000
   ```

3. **Login flow:**
   - Click "Login with Spotify"
   - Authorize the application
   - You should see the player interface

4. **Test Spotify Connect:**
   - Open any Spotify client (desktop, mobile)
   - Look for "Web Playback SDK" in the Connect devices
   - Transfer playback to the web player
   - Music should play in the browser

## Production Deployment

### Build React App

```bash
npm run build
```

### Serve Static Files from Express

Update `server/index.js`:

```javascript
const path = require('path');

// Add this line to serve static files
app.use(express.static(path.join(__dirname, '../build')));

// Your existing routes...
```

### Test Production Build

```bash
npm install -g serve
serve -s build
```

Or run the integrated server:

```bash
npm run server
```

Access your app at:
- `http://127.0.0.1:5000/index.html`
- `http://127.0.0.1:5000/static/js/main.js`

## Key Implementation Notes

### 1. SDK Loading Pattern

**✅ Correct (Official Method):**
```javascript
const script = document.createElement("script");
script.src = "https://sdk.scdn.co/spotify-player.js";
script.async = true;
document.body.appendChild(script);

window.onSpotifyWebPlaybackSDKReady = () => {
  // Initialize player here
};
```

**❌ Incorrect:**
```html
<!-- Don't load in HTML head -->
<script src="https://sdk.scdn.co/spotify-player.js"></script>
```

### 2. Required Scopes

Must include these three scopes:
```javascript
var scope = "streaming user-read-email user-read-private"
```

### 3. Player State Management

The `player_state_changed` event is crucial for UI updates:

```javascript
player.addListener('player_state_changed', (state => {
  if (!state) return;
  
  setTrack(state.track_window.current_track);
  setPaused(state.paused);
  setPosition(state.position);
  
  // Check if this device is active
  player.getCurrentState().then(state => { 
    setActive(!!state);
  });
}));
```

### 4. Device Connection

Always call `player.connect()` after setting up listeners:

```javascript
player.connect();
```

## Next Steps & Enhancements

1. **Token Refresh:** Implement automatic token renewal using `refresh_token`

2. **Search Integration:** Add search functionality using the [Search API](https://developer.spotify.com/documentation/web-api/reference/search)

3. **Playlist Integration:** Load and play user playlists with [Get Playlist API](https://developer.spotify.com/documentation/web-api/reference/get-playlist)

4. **Transfer Playback:** Enable device switching with [Transfer Playback API](https://developer.spotify.com/documentation/web-api/reference/transfer-a-users-playback)

5. **Advanced UI:** Add progress bars, volume controls, and track queues

6. **Error Handling:** Implement comprehensive error handling and user feedback

7. **Mobile Optimization:** Handle iOS-specific limitations and mobile interactions

## Common Pitfalls to Avoid

1. **Multiple SDK loads:** Only load the SDK script once per page
2. **Missing scopes:** Ensure all three required scopes are included
3. **Static script loading:** Use dynamic loading in React components
4. **Missing Premium:** Web Playback SDK requires Spotify Premium
5. **HTTPS in production:** Secure contexts required for production deployment
6. **State management:** Properly handle player state changes and device switching

This tutorial provides the foundation for building a Spotify Web Player. The official approach ensures compatibility and follows best practices for production applications.
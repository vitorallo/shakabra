import { useState } from 'react'
import ShakLogo from './assets/shak-logo.svg'
import './App.css'

function App(): JSX.Element {
  const [count, setCount] = useState(0)

  const handlePing = async (): Promise<void> => {
    const response = await window.api.ping()
    console.log('Ping response:', response)
  }

  return (
    <div className="container">
      <img alt="Shakabra logo" className="logo" src={ShakLogo} />
      <div className="creator">
        🎧 Powered by <span className="highlight">AI DJ Technology</span> 🎵
      </div>
      <div className="title">Shakabra</div>
      <div className="subtitle">AI DJ Party Player</div>

      <div className="actions">
        <div className="action">
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            Beat Count: {count}
          </button>
        </div>
        <div className="action">
          <button type="button" onClick={handlePing}>
            Test IPC
          </button>
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <h3>🎵 Smart Mixing</h3>
          <p>AI-powered track selection based on tempo, energy, and mood</p>
        </div>
        <div className="feature">
          <h3>🔗 Spotify Integration</h3>
          <p>Seamless control of your Spotify playlists and playback</p>
        </div>
        <div className="feature">
          <h3>🎛️ Professional Controls</h3>
          <p>Crossfading, manual overrides, and party progression</p>
        </div>
      </div>
    </div>
  )
}

export default App
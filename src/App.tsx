import { Route, Routes } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage';
import LobbyPage from './components/pages/LobbyPage';
import GamePage from './components/pages/GamePage';

function App() {
  return (
    <div className="bg-slate-900 min-h-screen text-white">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lobby/:gameId" element={<LobbyPage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </div>
  )
}

export default App
import { Routes, Route } from "react-router-dom";
import PlayerInfo from "./pages/PlayerInfo";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Results from "./pages/Results";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PlayerInfo />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/game" element={<Game />} />
      <Route path="/results" element={<Results />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

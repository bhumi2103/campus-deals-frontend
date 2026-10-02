import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home";
import ProfilePage from "./ProfilePage";
import BuyPage from "./BuyPage";
import SellPage from "./SellPage";
import Borrow from "./borrow";
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buy" element={<BuyPage />} />
         <Route path="/sell" element={<SellPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/borrow" element={<Borrow />} />
      </Routes>
    </Router>
  );
}

export default App;
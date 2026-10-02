import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./hero.css";

// Keep this in sync with BuyPage's CATEGORIES list.
const CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Furniture",
  "Gaming",
  "Bikes",
  "Appliances",
  "Sports",
  "Others",
];

// If what the user typed matches (or is contained in / contains) a known
// category name, treat it as a category pick rather than a free-text search —
// e.g. typing "textbook" or "electronics" jumps straight to that filtered
// view on /buy instead of doing a title/description text match.
const matchCategory = (term) => {
  const clean = term.trim().toLowerCase();
  if (!clean) return null;
  return (
    CATEGORIES.find((cat) => cat.toLowerCase() === clean) ||
    CATEGORIES.find(
      (cat) => cat.toLowerCase().includes(clean) || clean.includes(cat.toLowerCase())
    ) ||
    null
  );
};

const Hero = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    const query = searchTerm.trim();
    if (!query) {
      navigate("/buy");
      return;
    }

    const matchedCategory = matchCategory(query);
    if (matchedCategory) {
      navigate(`/buy?category=${encodeURIComponent(matchedCategory)}`);
    } else {
      navigate(`/buy?search=${encodeURIComponent(query)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section className="hero">
      <div className="hero-container">
        <h1 className="hero-title">
          Buy, Sell & Borrow <br />
          <span>On Campus</span>
        </h1>

        <p className="hero-subtitle">
          Join thousands of students saving money and making connections.<br />
         Find textbooks, electronics, furniture, and more from fellow students.
        </p>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search for textbooks, electronics, furniture..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-btn" onClick={handleSearch}>Search</button>
        </div>

        <div className="hero-buttons">
          <button className="primary-btn" onClick={() => navigate("/buy")}>
            Start Exploring →
          </button>
          <button className="outline-btn" onClick={() => navigate("/sell")}>
            Sell Your Item
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./categories.css";
import {
  BookOpen, Laptop, Sofa, Shirt, Bike, Refrigerator, Volleyball, Gamepad2,Plus
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL}/api`;
const CATEGORY_LIST = [
  { name: "Textbooks", icon: <BookOpen /> },
  { name: "Electronics", icon: <Laptop /> },
  { name: "Furniture", icon: <Sofa /> },
  { name: "Gaming", icon: <Gamepad2 /> },
  { name: "Bikes", icon: <Bike /> },
  { name: "Appliances", icon: <Refrigerator /> },
  { name: "Sports", icon: <Volleyball /> },
  { name: "Others", icon: <Plus /> },
];

const Categories = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data } = await axios.get(`${API}/items`);
        const items = data.items || [];
        const tally = {};
        items.forEach((item) => {
          const cat = item.category || "Others";
          tally[cat] = (tally[cat] || 0) + 1;
        });
        setCounts(tally);
      } catch (err) {
        console.error("❌ Error fetching category counts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const handleCategoryClick = (categoryName) => {
    navigate(`/buy?category=${encodeURIComponent(categoryName)}`);
  };

  const formatCount = (name) => {
    if (loading) return "...";
    const count = counts[name] || 0;
    return `${count} item${count !== 1 ? "s" : ""}`;
  };

  return (
    <section className="categories">
      <div className="categories-container">
        <h2 className="categories-title">Browse by Category</h2>
        <p className="categories-subtitle">
          Find exactly what you need from our wide selection of student essentials
        </p>

        <div className="categories-grid">
          {CATEGORY_LIST.map((cat, index) => (
            <div
              className="category-card"
              key={index}
              onClick={() => handleCategoryClick(cat.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleCategoryClick(cat.name)}
            >
              <div className="category-icon">{cat.icon}</div>
              <h3>{cat.name}</h3>
              <p>{formatCount(cat.name)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
import React from "react";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-brand-section">
          <h2 className="footer-brand">
            Campus<span>Deals</span>
          </h2>

          <p className="footer-description">
            The trusted marketplace for students to buy, sell, and borrow on campus.
          </p>
        </div>

        <div className="footer-column">
          <h4>How It Works</h4>
          <ul>
            <li>Find What You Need</li>
            <li>Connect Safely</li>
            <li>Meet & Exchange</li>
            <li>Verified Community</li>
          </ul>
        </div>

        <div className="footer-column marketplace-column">
          <h4>Marketplace</h4>
          <ul>
            <li>Buy</li>
            <li>Sell</li>
            <li>Borrow</li>
            <li>Categories</li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} CampusDeals. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
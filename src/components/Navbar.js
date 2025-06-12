import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const TimeTrackerNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Time Tracker", path: "/" },
    { name: "Summary", path: "/summary" },
    { name: "Settings", path: "/settings" },
  ];

  const handleLogoClick = () => {
    navigate("/");
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar ${menuOpen ? "navMobile" : ""}`}>
      <div className="logo" onClick={handleLogoClick}>
        <span className="logo-text">⏱️Time Logger for Shan Zhou Group</span>
      </div>

      <div className="menu">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`menu-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>☰</button>

      {menuOpen && (
        <div className="mobile-menu">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`mobile-menu-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default TimeTrackerNavbar;

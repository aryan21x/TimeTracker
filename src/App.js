import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import TimeTracker from "./components/Home";
import TimeTrackerNavbar from "./components/Navbar";
import Summary from "./components/Summary";
import Settings from "./components/Settings";

function App() {
  return (
    <Router>
      <TimeTrackerNavbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<TimeTracker />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

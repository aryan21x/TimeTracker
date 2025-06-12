import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Summary = () => {
  const [entries, setEntries] = useState([]);
  const [userHours, setUserHours] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminUIDs = ["EO2pmkGNxZaBYO8J1IvFJWJ8yWg2", "Rr9r9AEaAYWhctIQB1Ot2xWo0Yi1"]; // 🔁 Replace with real admin UIDs

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Summary - Auth state changed:", u ? u.email : "No user");
      if (u) {
        const isAdmin = adminUIDs.includes(u.uid);
        const enrichedUser = { ...u, isAdmin };
        setUser(enrichedUser);
        loadEntries(enrichedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadEntries = async (currentUser) => {
    try {
      console.log("Loading entries...");
      const q = currentUser.isAdmin
        ? query(collection(db, "entries"), orderBy("clockInTime", "desc"))
        : query(
            collection(db, "entries"),
            where("userId", "==", currentUser.uid),
            orderBy("clockInTime", "desc")
          );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Loaded entries:", data.length);
      setEntries(data);
      calculateUserHours(data);
    } catch (error) {
      console.error("Failed to load entries:", error);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      await deleteDoc(doc(db, "entries", entryId));
      const updated = entries.filter((entry) => entry.id !== entryId);
      setEntries(updated);
      calculateUserHours(updated);
    } catch (err) {
      console.error("Failed to delete entry:", err);
      alert("Error deleting entry: " + err.message);
    }
  };

  const calculateDurationInMinutes = (inTime, outTime) => {
    if (!inTime || !outTime) return 0;
    const start = new Date(inTime);
    const end = new Date(outTime);
    return (end - start) / (1000 * 60);
  };

  const formatDuration = (minutes) => {
    if (minutes <= 0) return "0h 0m";
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hrs}h ${mins}m`;
  };

  const calculateUserHours = (entries) => {
    const totals = {};
    entries.forEach(({ username, clockInTime, clockOutTime }) => {
      if (!username || !clockInTime || !clockOutTime) return;
      const duration = calculateDurationInMinutes(clockInTime, clockOutTime);
      totals[username] = (totals[username] || 0) + duration;
    });
    console.log("Calculated user hours:", totals);
    setUserHours(totals);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="summary-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="summary-container">
        <h2>Time Summary</h2>
        <div className="auth-alert">
          <strong>⚠️ Authentication Required</strong>
          <p>Please sign in from the Settings tab to view the summary.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-container">
      <h2>Time Summary</h2>
      <p>
        Viewing as: <strong>{user.displayName || user.email}</strong>{" "}
        {user.isAdmin && <span style={{ color: "green" }}> (Admin Mode)</span>}
      </p>

      {Object.keys(userHours).length > 0 && (
        <div className="user-hours-summary">
          <h3>Total Hours per User</h3>
          <ul className="user-hours-list">
            {Object.entries(userHours)
              .sort((a, b) => b[1] - a[1])
              .map(([username, minutes]) => (
                <li key={username}>
                  <strong>{username}</strong>: {formatDuration(minutes)}
                </li>
              ))}
          </ul>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="no-entries">No entries recorded.</div>
      ) : (
        <div className="entries-table-container">
          <table className="entries-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Duration</th>
                <th>Task</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.username || "—"}</td>
                  <td>{formatDate(entry.clockInTime)}</td>
                  <td>{formatTime(entry.clockInTime)}</td>
                  <td>{formatTime(entry.clockOutTime)}</td>
                  <td>
                    {entry.clockOutTime
                      ? formatDuration(
                          calculateDurationInMinutes(
                            entry.clockInTime,
                            entry.clockOutTime
                          )
                        )
                      : "—"}
                  </td>
                  <td>{entry.task || "—"}</td>
                  <td>
                    {(user.isAdmin || user?.uid === entry.userId) && (
                      <button
                        className="delete-entry-btn"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Summary;

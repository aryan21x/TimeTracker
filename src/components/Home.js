import { useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc,
  deleteDoc,
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function TimeTracker() {
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [task, setTask] = useState("");
  const [entries, setEntries] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Track active clock-in in Firestore
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "activeClocks", user.uid);
    
    // Load any existing clock-in
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setClockInTime(data.clockInTime);
        setTask(data.task || "");
      } else {
        setClockInTime(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      console.log("TimeTracker - Auth state changed:", u ? u.email : "No user");
      setUser(u);
      setLoading(false);
      if (u) {
        await loadEntries(u);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadEntries = async (currentUser) => {
    if (!currentUser) return;
    
    try {
      console.log("Loading entries for user:", currentUser.uid);
      const q = query(
        collection(db, "entries"), 
        where("userId", "==", currentUser.uid),
        orderBy("clockInTime", "desc")
      );
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Loaded entries:", loaded.length);
      setEntries(loaded);
    } catch (error) {
      console.error("Failed to load entries:", error);
    }
  };

  const handleClockIn = async () => {
    const now = new Date().toISOString();
    try {
      await setDoc(doc(db, "activeClocks", user.uid), {
        clockInTime: now,
        task: task,
        userId: user.uid,
        username: user.displayName || user.email,
        lastUpdated: new Date().toISOString()
      });
      setClockInTime(now);
    } catch (err) {
      console.error("Clock-in failed:", err);
      alert("Failed to clock in");
    }
  };

  const handleClockOut = async () => {
    if (!user) {
      alert("Please sign in first!");
      return;
    }

    if (!clockInTime) {
      alert("Please clock in first!");
      return;
    }

    if (!task.trim()) {
      alert("Please enter a task description!");
      return;
    }

    setSaving(true);
    const outTime = new Date().toISOString();
    
    const newEntry = {
      userId: user.uid,
      username: user.displayName || user.email,
      clockInTime: clockInTime,
      clockOutTime: outTime,
      task: task.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      console.log("Clocking out - creating entry:", newEntry);
      
      // Save the completed entry first
      const docRef = await addDoc(collection(db, "entries"), newEntry);
      console.log("Entry saved with ID:", docRef.id);
      
      // Delete active clock
      await deleteDoc(doc(db, "activeClocks", user.uid));
      console.log("Active clock deleted");
      
      // Update local state immediately
      const entryWithId = { id: docRef.id, ...newEntry };
      setEntries(prev => [entryWithId, ...prev]);
      
      // Reset form
      setClockInTime(null);
      setClockOutTime(null);
      setTask("");
      
      console.log("Clock out completed successfully");
      
    } catch (err) {
      console.error("Error during clock out:", err);
      alert("Failed to save entry: " + err.message);
      
      // Reload entries to ensure consistency
      if (user) {
        await loadEntries(user);
      }
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "—";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const minutes = Math.floor((end - start) / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="time-tracker-container">
        <div className="card">
          <h2>Time Tracker</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="time-tracker-container">
        <div className="card">
          <h2>Time Tracker</h2>
          <div className="auth-alert">
            <strong>⚠️ Authentication Required</strong>
            <p>Please sign in from the Settings tab to use the time tracker.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="time-tracker-container">
      <div className="card">
        <h2>Time Tracker</h2>
        <div className="user-status">
          <strong>✅ Signed in as:</strong> {user.displayName || user.email}
        </div>

        {clockInTime && (
          <div className="clocked-in-status">
            <p><strong>🕐 Currently clocked in</strong></p>
            <p><strong>Started at:</strong> {formatTime(clockInTime)}</p>
            <p><strong>Duration:</strong> {calculateDuration(clockInTime, new Date().toISOString())}</p>
          </div>
        )}

        <div className="button-group">
          <button 
            onClick={handleClockIn} 
            disabled={clockInTime !== null}
            className={`clock-in-btn ${clockInTime ? 'disabled' : ''}`}
          >
            {clockInTime ? "Already Clocked In" : "🕐 Clock In"}
          </button>

          <button 
            onClick={handleClockOut} 
            disabled={!clockInTime || saving}
            className={`clock-out-btn ${!clockInTime || saving ? 'disabled' : ''}`}
          >
            {saving ? (
              <>
                <span className="spinner"></span> Saving...
              </>
            ) : "🕐 Clock Out"}
          </button>
        </div>

        <div className="task-input">
          <label><strong>Task Description *</strong></label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Describe what you worked on (required)"
            rows="4"
            required
          />
          <small>Task description is required before clocking out</small>
        </div>

        {entries.length > 0 && (
          <div className="entries-section">
            <h3>Your Recent Entries ({entries.length} total)</h3>
            <div className="entries-list">
              {entries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="entry-item">
                  <div className="entry-task">
                    {entry.task || "No task description"}
                  </div>
                  <div className="entry-details">
                    📅 {formatDate(entry.clockInTime)}<br />
                    ⏰ {formatTime(entry.clockInTime)} - {formatTime(entry.clockOutTime)}<br />
                    ⏱️ Duration: {calculateDuration(entry.clockInTime, entry.clockOutTime)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
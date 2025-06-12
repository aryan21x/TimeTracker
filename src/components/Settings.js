import React, { useState, useEffect } from "react";
import { auth, db, provider } from "../services/firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      console.log("Auth state changed:", u ? u.email : "No user");
      
      if (u) {
        setUser(u);
        try {
          await setDoc(doc(db, "users", u.uid), {
            name: u.displayName,
            email: u.email,
            updatedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error saving user data:", error);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
      setInitializing(false);
    });

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (initializing) {
        console.log("Auth initialization timeout");
        setLoading(false);
        setInitializing(false);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [initializing]);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      console.log("Attempting to sign in...");
      const result = await signInWithPopup(auth, provider);
      console.log("Sign in successful:", result.user.email);
    } catch (error) {
      console.error("Sign-in error:", error);
      alert("Google Sign-In failed: " + error.message);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log("Signing out...");
      await signOut(auth);
      console.log("Sign out successful");
    } catch (error) {
      console.error("Sign-out error:", error);
      alert("Sign-out failed: " + error.message);
    }
  };

  if (loading && initializing) {
    return (
      <div className="settings-container">
        <h2>Settings</h2>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>Loading...</p>
          <small>Initializing authentication...</small>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <div
        style={{
          backgroundColor: "#f9f9f9",
          padding: "10px",
          borderRadius: "5px",
          marginBottom: "1rem",
        }}
      >
        <strong>Instructions:</strong><br />
        Sign in with your Google account to identify your time logs.
      </div>

      <div style={{ marginBottom: "1rem", padding: "10px", backgroundColor: "#e8f4f8" }}>
        <strong>Current Status:</strong> {user ? `Signed in as ${user.displayName}` : "Not signed in"}
      </div>

      {user ? (
        <div>
          <p>
            <strong>Name:</strong> {user.displayName}<br />
            <strong>Email:</strong> {user.email}<br />
            <strong>User ID:</strong> {user.uid}
          </p>
          <button 
            onClick={handleSignOut} 
            style={{ 
              marginTop: "1rem",
              backgroundColor: "#f44336",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button 
          onClick={handleSignIn} 
          disabled={loading}
          style={{ 
            backgroundColor: loading ? "#ccc" : "#4285f4",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
      )}
    </div>
  );
};

export default Settings;
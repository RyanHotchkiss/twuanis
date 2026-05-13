"use client";

import { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  async function sendOTP() {
    setMessage("Sending...");

    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();

    if (data.error) {
      setMessage("Failed to send OTP");
      return;
    }

    setMessage("OTP sent! Check WhatsApp.");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Seller Login</h1>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="WhatsApp Number (e.g. +50688887777)"
        style={{ padding: 10, width: 250 }}
      />
      <button onClick={sendOTP} style={{ padding: 10, marginLeft: 10 }}>
        Send OTP
      </button>
      <p>{message}</p>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

function AIHelper() {
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showAI, setShowAI] = useState(false);
  const messagesEndRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);

  //For deployment backend URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

   // 🔹 AI Helper state
  const [aiMessages, setAiMessages] = useState([
    { role: "assistant", content: "Hi! I’m Aegis, your SecuraSphere AI helper. Ask me anything questions you have about cybersecurity." }
  ]);
  
    // 🔹Function to send a message to your Flask /assistant endpoint
  const sendAiMessage = async () => {
      const trimmed = aiInput.trim();
      if (!trimmed) return;
  
      const newMessages = [...aiMessages, { role: "user", content: trimmed }];
      setAiMessages(newMessages);
      setAiInput("");
      setAiLoading(true);
      setAiError("");
  
      try {
        //For local testing
        //const res = await fetch("http://localhost:5000/assistant", {
        const res = await fetch(`${API_BASE_URL}/assistant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
        });
  
        const data = await res.json();
  
        if (data.error) {
          console.error("AI helper error from backend:", data.error);
          setAiError(data.error); // show the actual error text
          setAiLoading(false);
          return;
        }
  
        setAiMessages([...newMessages, data.message]);
      } catch (err) {
        console.error(err);
        setAiError("Network error contacting AI helper.");
      } finally {
        setAiLoading(false);
      }
    }

    // Auto-scroll to bottom when new message arrives
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, [aiMessages]);

  const handleAiKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendAiMessage();
      }
    };
  
  return (
    <div className="status-box" style={{
        position: 'fixed',
        bottom: window.innerWidth < 640 ? '40px' : '75px',
        right: window.innerWidth < 640 ? '10px' : '20px',
        padding: window.innerWidth < 640 ? '5px' : '15px',
        borderRadius: '8px',
        maxWidth: '300px',
        fontSize: 'clamp(10px, 2.5vw, 12px)',
        zIndex: 11000,
    }}>
        <button
          onClick={() => setShowAI(prev => !prev)}
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#00ffff',
            border: '2px solid #00ffff',
            borderRadius: '6px',
            padding: window.innerWidth < 640 ? '10px 12px' : '8px 15px',
            cursor: 'pointer',
            fontSize: 'clamp(10px, 2.5vw, 12px)',
            marginTop: window.innerWidth < 640 ? '8px' : '12px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
            minHeight: '44px',
            touchAction: 'manipulation',
            whiteSpace: 'nowrap'
            }}>
        {window.innerWidth < 640 ? 'AI HELPER' : 'AI AGENT HELPER'}
        </button>

        {/* 🔹 AI Helper Section */}
        {showAI && (
        <section className="ai-helper" 
            style={{ 
              background: 'black',
              border: "1px solid #444",
              borderRadius: "8px",
              marginTop: window.innerWidth < 640 ? "1rem" : "2rem",
              position: 'fixed',
              bottom: window.innerWidth < 640 ? '40px' : '75px',
              right: window.innerWidth < 640 ? '10px' : '20px',
              left: window.innerWidth < 640 ? '10px' : 'auto',
              maxWidth: window.innerWidth < 640 ? 'calc(100vw - 20px)' : '600px',
              zIndex: 11000
            }}>
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                fontFamily: 'monospace',
                fontWeight: 'bold',
                fontSize: window.innerWidth < 640 ? '14px' : '20px',
                marginLeft: window.innerWidth < 640 ? '8px' : '12px',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                <h2 style={{ margin: 0, fontSize: 'clamp(14px, 4vw, 20px)' }}>SecuraSphere AI Helper</h2>
                <button
                   onClick={() => setShowAI(prev => !prev)}
                    disabled={aiLoading}
                    style={{
                      textAlign: "right",
                      padding: window.innerWidth < 640 ? "0.6rem 0.8rem" : "0.5rem 1rem",
                      borderRadius: "4px",
                      marginBottom: window.innerWidth < 640 ? "0.5rem" : "1rem",
                      marginRight: window.innerWidth < 640 ? "0.5rem" : "1rem",
                      border: "none",
                      cursor: aiLoading ? "not-allowed" : "pointer",
                      background: "linear-gradient(45deg, #22fc63ff, #07f78fff)",
                      color: "#000",
                      fontWeight: "bold",
                      minHeight: "44px",
                      touchAction: "manipulation",
                      fontSize: 'clamp(11px, 2.5vw, 14px)'
                    }}
                  >
                CLOSE
                </button>
                </div>
                <div
                  style={{
                    maxWidth: "600px",
                    margin: "0 auto",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    padding: window.innerWidth < 640 ? "0.5rem" : "1rem",
                    background: "#0b1020",
                  }}
                >
                  <div
                    ref={messagesContainerRef}
                    style={{
                        padding: window.innerWidth < 640 ? "0.4rem" : "0.6rem 0.6rem 0.4rem",
                        height: window.innerWidth < 640 ? "300px" : "475px",
                        flex: 1,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        background: "radial-gradient(circle at top, #10172f, #020617)",
                    }}
                  >
                    {aiMessages.map((m, idx) => (
                      <div
                        ref={messagesEndRef}
                        key={idx}
                        style={{
                          alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                          maxWidth: window.innerWidth < 640 ? "95%" : "90%",
                          padding: window.innerWidth < 640 ? "0.4rem 0.5rem" : "0.45rem 0.6rem",
                          borderRadius: "8px",
                          background: m.role === "user"
                            ? "rgba(0, 224, 255, 0.12)"
                            : "rgba(34, 252, 99, 0.1)",
                          border: `1px solid ${
                            m.role === "user" ? "rgba(0, 224, 255, 0.7)" : "rgba(34, 252, 99, 0.6)"
                          }`,
                          fontSize: window.innerWidth < 640 ? "0.7rem" : "0.8rem",
                          wordBreak: "break-word"
                        }}
                      >
                        <strong style={{ color: m.role === "user" ? "#00e0ff" : "#22fc63" }}>
                          {m.role === "user" ? "You" : "Aegis"}:
                        </strong>{" "}
                        <span>{m.content}</span>
                      </div>
                    ))}
                  </div>
                  {aiError && (
                    <div style={{ color: "#ff6666", marginBottom: "0.5rem" }}>
                      {aiError}
                    </div>
                  )}
                  <div style={{ 
                    borderTop: "1px solid #444", 
                    paddingTop: "0.5rem",
                    display: "flex",
                    alignItems: "center", 
                    gap: "0.5rem" 
                    }}>
                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={handleAiKeyDown}
                      placeholder="Ask a question about your online security..."
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #444",
                        background: "#050814",
                        color: "#fff",
                      }}
                    />
                    <button
                      onClick={sendAiMessage}
                      disabled={aiLoading}
                      style={{
                        display: "flex",
                        padding: window.innerWidth < 640 ? "0.6rem 0.8rem" : "0.5rem 1rem",
                        marginBottom: window.innerWidth < 640 ? "0.5rem" : "1rem",
                        borderRadius: "4px",
                        border: "none",
                        cursor: aiLoading ? "not-allowed" : "pointer",
                        background: "linear-gradient(45deg, #22fc63ff, #07f78fff)",
                        color: "#000",
                        fontWeight: "bold",
                        minHeight: "44px",
                        touchAction: "manipulation",
                        fontSize: 'clamp(11px, 2.5vw, 14px)',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {aiLoading ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        );
    }

    export default AIHelper;

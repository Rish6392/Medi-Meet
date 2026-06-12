"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { getAIResponse } from "@/actions/ai-chat";

/**
 * AIChatWidget — A floating AI chatbot that appears on every page.
 *
 * Architecture:
 * - Renders a floating button (bottom-right) when closed
 * - Expands into a full chat panel when clicked
 * - Calls the server action `getAIResponse` to communicate with Google Gemini
 * - Displays specialty recommendations with direct links to /doctors/[specialty]
 */
export default function AIChatWidget() {
  // Controls whether the chat panel is open or closed
  const [isOpen, setIsOpen] = useState(false);

  // Array of message objects: { role: "user"|"ai", content: string, specialty?: string }
  const [messages, setMessages] = useState([]);

  // The text currently typed in the input field
  const [inputValue, setInputValue] = useState("");

  // True while waiting for AI response (shows loading spinner)
  const [isLoading, setIsLoading] = useState(false);

  // True after first open — used to show the welcome message only once
  const [hasOpened, setHasOpened] = useState(false);

  // Ref to the messages container — used to auto-scroll to the latest message
  const messagesEndRef = useRef(null);

  // Ref to the input field — used to auto-focus when chat opens
  const inputRef = useRef(null);

  /**
   * Auto-scroll to the bottom of the chat whenever messages change.
   * This ensures the user always sees the newest message.
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * When the chat opens for the first time, show a welcome message
   * from the AI and focus the input field.
   */
  useEffect(() => {
    if (isOpen && !hasOpened) {
      setHasOpened(true);
      // Pre-seed the AI's greeting message so the user knows what to do
      setMessages([
        {
          role: "ai",
          content:
            "Hi! 👋 I'm your MediMeet health assistant. Tell me about your symptoms, and I'll help you find the right specialist.",
        },
      ]);
    }
    // Focus the input when chat opens so user can type immediately
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, hasOpened]);

  /**
   * Sends the user's message to the AI and displays the response.
   *
   * Flow:
   * 1. Add user message to the messages array
   * 2. Call getAIResponse server action with the message + conversation history
   * 3. Add AI response to messages array (with optional specialty link)
   */
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return; // Don't send empty messages or while loading

    // Add the user's message to the chat immediately (optimistic UI)
    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue(""); // Clear the input field
    setIsLoading(true); // Show loading spinner

    try {
      // Build chat history for context — the AI needs previous messages
      // to understand follow-up questions like "tell me more about that"
      const chatHistory = updatedMessages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        content: msg.content,
      }));

      // Call the server action (this runs on the server, not in the browser)
      const response = await getAIResponse(text, chatHistory);

      if (response.error) {
        // If the AI errored, show the error as an AI message
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: response.error },
        ]);
      } else {
        // Add the AI's response, including any specialty recommendation
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: response.message,
            specialty: response.specialty, // e.g., "Neurology" or null
            confidence: response.confidence, // e.g., "high", "medium", "low"
          },
        ]);
      }
    } catch {
      // Network error or unexpected failure — show a friendly error
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false); // Hide loading spinner
    }
  };

  /**
   * Handle Enter key press — sends the message.
   * Shift+Enter allows multi-line input without sending.
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent adding a new line
      handleSend();
    }
  };

  return (
    <>
      {/* =============================================
          FLOATING BUTTON — Always visible (bottom-right)
          Pulses with an emerald glow to draw attention
          ============================================= */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="ai-chat-fab"
          aria-label="Open AI Health Assistant"
        >
          {/* The sparkle icon overlay adds a premium feel */}
          <Sparkles className="ai-chat-fab-sparkle" />
          <Bot className="ai-chat-fab-icon" />
        </button>
      )}

      {/* =============================================
          CHAT PANEL — Slides up from bottom-right when open
          ============================================= */}
      {isOpen && (
        <div className="ai-chat-panel">
          {/* --- Header Bar --- */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-left">
              {/* Pulsing green dot = "online" indicator */}
              <div className="ai-chat-status-dot" />
              <div>
                <h3 className="ai-chat-title">MediMeet AI</h3>
                <p className="ai-chat-subtitle">Health Assistant</p>
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="ai-chat-close-btn"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* --- Messages Area (scrollable) --- */}
          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`ai-chat-bubble-wrapper ${
                  msg.role === "user" ? "ai-chat-bubble-user" : "ai-chat-bubble-ai"
                }`}
              >
                {/* AI messages get a bot avatar icon */}
                {msg.role === "ai" && (
                  <div className="ai-chat-avatar">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`ai-chat-bubble ${
                    msg.role === "user" ? "ai-chat-bubble-user-bg" : "ai-chat-bubble-ai-bg"
                  }`}
                >
                  {/* Message text */}
                  <p className="ai-chat-bubble-text">{msg.content}</p>

                  {/* 
                    SPECIALTY RECOMMENDATION CARD
                    When the AI suggests a specialty, this renders a clickable card
                    that links directly to /doctors/[specialty] page.
                    This is the key value-add — connecting AI advice to real action.
                  */}
                  {msg.specialty && (
                    <Link
                      href={`/doctors/${encodeURIComponent(msg.specialty)}`}
                      className="ai-chat-specialty-link"
                      onClick={() => setIsOpen(false)} // Close chat when navigating
                    >
                      <div className="ai-chat-specialty-content">
                        <div>
                          <span className="ai-chat-specialty-label">
                            Recommended Specialty
                          </span>
                          <span className="ai-chat-specialty-name">
                            {msg.specialty}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-emerald-400" />
                      </div>
                      {/* Confidence badge shows how sure the AI is */}
                      {msg.confidence && (
                        <span
                          className={`ai-chat-confidence ${
                            msg.confidence === "high"
                              ? "ai-chat-confidence-high"
                              : msg.confidence === "medium"
                              ? "ai-chat-confidence-medium"
                              : "ai-chat-confidence-low"
                          }`}
                        >
                          {msg.confidence} confidence match
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator — shows animated dots while AI is thinking */}
            {isLoading && (
              <div className="ai-chat-bubble-wrapper ai-chat-bubble-ai">
                <div className="ai-chat-avatar">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="ai-chat-bubble ai-chat-bubble-ai-bg">
                  <div className="ai-chat-loading">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    <span className="ai-chat-loading-text">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Invisible div at the bottom — scrollIntoView target */}
            <div ref={messagesEndRef} />
          </div>

          {/* --- Input Bar (bottom of panel) --- */}
          <div className="ai-chat-input-area">
            <div className="ai-chat-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your symptoms..."
                className="ai-chat-input"
                disabled={isLoading} // Disable input while AI is responding
              />
              {/* Send button — only active when there's text to send */}
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="ai-chat-send-btn"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {/* Disclaimer — important for medical apps */}
            <p className="ai-chat-disclaimer">
              AI suggestions are not medical diagnoses. Always consult a doctor.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

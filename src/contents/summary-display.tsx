import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import type { PlasmoGetInlineAnchor } from "~node_modules/plasmo/dist/type"

import { ApiService } from "../services/api-service"
import type { ToneRating } from "../types/youtube"

// Settings interface for content script
interface ContentScriptSettings {
  autoSummarize: boolean
  maxComments: number
}

// Helper functions for rating UI
const getRatingPosition = (rating: string): string => {
  switch (rating) {
    case "negative":
      return "0%"
    case "quite negative":
      return "25%"
    case "neutral":
      return "50%"
    case "quite positive":
      return "75%"
    case "positive":
      return "100%"
    default:
      return "50%"
  }
}

const getRatingColor = (rating: string): string => {
  switch (rating) {
    case "negative":
      return "#f8b4c4" // Soft rose
    case "quite negative":
      return "#f7c59f" // Soft peach
    case "neutral":
      return "#9ca3af" // Soft gray
    case "quite positive":
      return "#a7f3d0" // Soft mint
    case "positive":
      return "#86efac" // Soft sage
    default:
      return "#9ca3af" // Soft gray
  }
}

const getRatingSymbol = (rating: string): string => {
  switch (rating) {
    case "negative":
      return "😠"
    case "quite negative":
      return "😟"
    case "neutral":
      return "😐"
    case "quite positive":
      return "😊"
    case "positive":
      return "😃"
    default:
      return "😐"
  }
}

/**
 * Configure content script to run on YouTube pages
 *
 * CORS Consideration:
 * - Content scripts run in the context of the webpage (YouTube.com)
 * - When making requests from content scripts, they appear to come from the page's origin
 * - Backend server must allow 'https://www.youtube.com' in Access-Control-Allow-Origin header
 * - Without proper CORS configuration, requests will be blocked by browser security policy
 */
export const config: PlasmoCSConfig = {
  matches: [
    "https://www.youtube.com/watch*",
    "https://youtube.com/watch*",
    "https://youtu.be/*",
    "https://google.com/*",
    "https://www.google.com/*"
  ],
  all_frames: false
}

// Shows the comments summary in a box below `div#description.ytd-watch-metadata`
const SummaryDisplay = () => {
  const [commentsSummary, setCommentsSummary] = useState<string | null>(null)
  const [toneRating, setToneRating] = useState<ToneRating | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<ContentScriptSettings | null>(null)

  const [hailingFrequency] = useStorage("hailing")

  const [maxComments, setMaxComments] = useStorage("maxComments", 50)
  const [autoSummarize, setAutoSummarize] = useStorage("autoSummarize", false)

  // Global error handler for Chrome API issues
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.error &&
        event.error.message &&
        event.error.message.includes("chrome")
      ) {
        console.error(
          "[CommentsSummarizer]: Chrome API error caught:",
          event.error
        )
        setError(
          "Extension context issue. Try refreshing the page or reopening the video in a new tab."
        )
      }
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  // Extract video ID from current URL
  const getVideoId = (): string | null => {
    const url = window.location.href
    console.log("[CommentsSummarizer]: Getting video ID from URL", url)
    if (url.includes("youtube.com/watch")) {
      return url.split("v=")[1]?.split("&")[0] || null
    } else if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1]?.split("?")[0] || null
    }
    return null
  }

  const clearState = () => {
    setIsLoading(false)
    setError(null)
    setCommentsSummary(null)
    setToneRating(null)
  }

  // Fetch comments automatically when component loads
  const fetchComments = async () => {
    console.log("[CommentsSummarizer]: Fetching comments")
    const videoId = getVideoId()
    if (!videoId) {
      setError("Could not extract video ID from URL")
      clearState()
      return
    }

    // Check if auto-summarize is enabled
    if (!autoSummarize) {
      console.log(
        "[CommentsSummarizer]: Auto-summarize disabled - user needs to enable it in popup settings"
      )
      clearState()
      // Don't show anything if auto-summarize is disabled
      return
    }

    console.log("[CommentsSummarizer]: Fetching comments for video:", videoId)
    console.log("[CommentsSummarizer]: API URL:", `http://localhost:8787/get?videoId=${videoId}`)

    try {
      /**
       * CORS Note:
       * - This request is made from the YouTube page context (origin: https://www.youtube.com)
       * - The backend server must include 'https://www.youtube.com' in Access-Control-Allow-Origin
       * - If the server doesn't allow this origin, the request will be blocked by CORS policy
       * - The user needs to configure the backend server to allow requests from YouTube's origin
       */
      const response = await ApiService.getComments(videoId)
      console.log("[CommentsSummarizer]: API response:", response)

      if (response.type === "error") {
        console.error("[CommentsSummarizer]: Error fetching comments:", response.error)

        // Check if this is a CORS-related error
        if (response.error?.includes("CORS") || response.error?.includes("Access-Control")) {
          console.error("[CommentsSummarizer]: CORS error detected - backend server needs to allow YouTube origin")
        }

        setError(response.error || "Failed to fetch comments")
        clearState()
        return
      }

      console.log("[CommentsSummarizer]: Received comments summary:", response)
      console.log("[CommentsSummarizer]: Comments length:", response.comments?.length)
      setCommentsSummary(response.comments)
      setToneRating(response.toneRating)
      setIsLoading(false)
    } catch (err) {
      console.error("[CommentsSummarizer]: Error fetching comments:", err)

      // Check if this is a CORS-related error
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      if (errorMessage.includes("CORS") || errorMessage.includes("Access-Control")) {
        console.error("[CommentsSummarizer]: CORS error detected in catch block")
        setError("CORS policy blocked the request. The backend server needs to allow requests from YouTube's origin (https://www.youtube.com).")
      } else {
        setError(errorMessage)
      }

      clearState()
    }
  }

  useEffect(() => {
    console.log(
      "[CommentsSummarizer]: Component loaded, starting automatic summarization",
      autoSummarize
    )
    if (!autoSummarize) {
      console.log(
        "[CommentsSummarizer]: Auto-summarize disabled - user needs to enable it in popup settings"
      )
      return
    }
    console.log("[CommentsSummarizer]: Fetching comments")
    fetchComments()
  }, [autoSummarize])

  // Keep the message listener for manual refresh from popup
  const msgCallback = useCallback(
    (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ): boolean | undefined => {
      console.log("[CommentsSummarizer]: Received message from popup", message)

      if (message.action === "refreshCommentsSummary") {
        console.log("[CommentsSummarizer]: Refreshing comments summary")
        setIsLoading(true)
        setError(null)
        fetchComments()
        sendResponse({ success: true })
        return true
      }
      return false
    },
    [fetchComments]
  )

  useEffect(() => {
    console.log("[CommentsSummarizer]: Adding message listener")

    try {
    chrome.runtime.onMessage.addListener(msgCallback)

    return () => {
      console.log("[CommentsSummarizer]: Removing message listener")
      chrome.runtime.onMessage.removeListener(msgCallback)
    }
    } catch (error) {
      console.error(
        "[CommentsSummarizer]: Error setting up message listener:",
        error
      )
      return
    }
  }, [msgCallback])

  console.log("[CommentsSummarizer]: Summary display component loaded")

  // Show loading state
  if (isLoading) {
    console.log("[CommentsSummarizer]: Showing loading state")
    return (
      <div
        id="comments-summarizer-summary-display"
        style={{
          width: "100%",
          minHeight: "fit-content",
          padding: "14px 12px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.1)",
          boxSizing: "border-box",
          marginTop: "16px",
          textAlign: "center"
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid #aaa",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
          <span style={{ fontSize: "14px", color: "#aaa" }}>
            Loading comments summary...
          </span>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Show error state
  if (error) {
    console.log("[CommentsSummarizer]: Showing error state", error)
    return (
      <div
        id="comments-summarizer-summary-display"
        style={{
          width: "100%",
          minHeight: "fit-content",
          padding: "14px 12px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.1)",
          boxSizing: "border-box",
          marginTop: "16px"
        }}>
        <div
          style={{
            padding: "12px",
            background: "rgba(239, 68, 68, 0.2)",
            borderRadius: "8px",
            border: "1px solid rgba(239, 68, 68, 0.3)"
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px"
            }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <span
              style={{ fontSize: "14px", fontWeight: "500", color: "#fca5a5" }}>
              Error Loading Comments
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#fca5a5" }}>
            {error}
          </p>
          {error.includes("Chrome API not available") && (
            <div
              style={{ marginTop: "8px", fontSize: "11px", color: "#fca5a5" }}>
              <p style={{ margin: 0, marginBottom: "4px" }}>
                <strong>Possible solutions:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: "16px" }}>
                <li>Try refreshing the page</li>
                <li>Try opening the video in a new tab</li>
                <li>Check if you're in incognito mode</li>
                <li>The extension may not work in embedded videos</li>
              </ul>
            </div>
          )}
          <button
            onClick={fetchComments}
            style={{
              marginTop: "8px",
              padding: "4px 8px",
              fontSize: "11px",
              background: "rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show summary
  if (!commentsSummary) {
    console.log("[CommentsSummarizer]: No comments summary to show")
    return null
  }

  return (
    <div
      id="comments-summarizer-summary-display"
      style={{
        width: "100%",
        minHeight: "fit-content",
        padding: "14px 12px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.1)",
        boxSizing: "border-box",
        marginTop: "16px"
      }}>
      <h2
        style={{
          margin: 0,
          marginBottom: "8px",
          fontSize: "16px"
        }}>
        Comments Summary
      </h2>
      <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.4" }}>
        {commentsSummary}
      </p>
      <span
        style={{
          display: "inline-block",
          fontSize: "11px",
          color: "#aaa",
          marginTop: "14px"
        }}>
        Summarized by AI. AI can make mistakes &middot; Powered by Comments
        Summarizer &middot; Made with &hearts; by BNN.
      </span>
      {toneRating && (
        <div
          style={{
            marginTop: "12px",
            padding: "16px",
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1)"
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "16px"
            }}>
            {/* Rating Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                userSelect: "none"
              }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#aaa",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                Tone
              </div>
              <div
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center"
                }}>
                <div
                  style={{
                    width: "120px",
                    height: "20px",
                    borderRadius: "10px",
                    position: "relative",
                background:
                  "linear-gradient(to right, #f8b4c4 0%, #f7c59f 25%, #9ca3af 50%, #a7f3d0 75%, #86efac 100%)",
                    boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)"
                  }}>
                  {/* Current Rating Indicator */}
                  <div
                    style={{
                      position: "absolute",
                      left: getRatingPosition(toneRating.rating),
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: getRatingColor(toneRating.rating),
                      border: "2px solid rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "white",
                        fontWeight: "bold",
                        textShadow: "0 1px 1px rgba(0, 0, 0, 0.5)"
                      }}>
                      {getRatingSymbol(toneRating.rating)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason Section */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#aaa",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                Analysis
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#e0e0e0",
                  lineHeight: "1.5",
                  fontWeight: "400"
                }}>
                {toneRating.reason}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontStyle: "italic",
                  marginTop: "4px",
                  color: getRatingColor(toneRating.rating),
                  fontWeight: "600"
                }}>
                {toneRating.rating.charAt(0).toUpperCase() +
                  toneRating.rating.slice(1)}{" "}
                tone detected
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => ({
  element: document.querySelector("#description.ytd-watch-metadata")
    ?.parentElement,
  // element: document.querySelector("form[role='search']"),
  insertPosition: "afterend"
})

export default SummaryDisplay

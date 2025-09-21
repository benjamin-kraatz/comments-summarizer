import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import type { PlasmoGetInlineAnchor } from "~node_modules/plasmo/dist/type"

import { l18n } from "../lib/l18n"
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<ContentScriptSettings | null>(null)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)

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
  const getVideoId = useCallback((): string | null => {
    const url = window.location.href
    if (url.includes("youtube.com/watch")) {
      return url.split("v=")[1]?.split("&")[0] || null
    } else if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1]?.split("?")[0] || null
    }
    return null
  }, [])

  const clearState = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setCommentsSummary(null)
    setToneRating(null)
  }, [])

  // Fetch comments automatically when component loads
  const fetchComments = useCallback(
    async (forceFetch = false) => {
      const videoId = getVideoId()
      if (!videoId) {
        setError("Could not extract video ID from URL")
        clearState()
        return
      }

      // If video hasn't changed and not forcing fetch, don't refetch
      if (!forceFetch && currentVideoId === videoId) {
        return
      }

      // Set the new video ID and clear old state
      setCurrentVideoId(videoId)

      // Check if auto-summarize is enabled
      if (!autoSummarize) {
        clearState()
        return
      }

      try {
        /**
         * CORS Note:
         * - This request is made from the YouTube page context (origin: https://www.youtube.com)
         * - The backend server must include 'https://www.youtube.com' in Access-Control-Allow-Origin
         * - If the server doesn't allow this origin, the request will be blocked by CORS policy
         * - The user needs to configure the backend server to allow requests from YouTube's origin
         */
        const response = await ApiService.getComments(videoId)

        if (response.type === "error") {
          console.error(
            "[CommentsSummarizer]: Error fetching comments:",
            response.error
          )

          // Check if this is a CORS-related error
          if (
            response.error?.includes("CORS") ||
            response.error?.includes("Access-Control")
          ) {
            console.error(
              "[CommentsSummarizer]: CORS error detected - backend server needs to allow YouTube origin"
            )
          }

          setError(response.error || "Failed to fetch comments")
          clearState()
          return
        }

        setCommentsSummary(response.comments)
        setToneRating(response.toneRating)
        setIsLoading(false)
      } catch (err) {
        console.error("[CommentsSummarizer]: Error fetching comments:", err)

        // Check if this is a CORS-related error
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred"
        if (
          errorMessage.includes("CORS") ||
          errorMessage.includes("Access-Control")
        ) {
          console.error(
            "[CommentsSummarizer]: CORS error detected in catch block"
          )
          setError(
            "CORS policy blocked the request. The backend server needs to allow requests from YouTube's origin (https://www.youtube.com)."
          )
        } else {
          setError(errorMessage)
        }

        clearState()
      }
    },
    [getVideoId, currentVideoId, autoSummarize, clearState, setCurrentVideoId]
  )

  // Handle URL changes when user navigates to different videos
  const handleUrlChange = useCallback(() => {
    const newVideoId = getVideoId()

    // If video ID changed, fetch new comments
    if (newVideoId !== currentVideoId) {
      setIsLoading(true)
      setError(null)
      setCommentsSummary(null)
      setToneRating(null)
      fetchComments()
    }
  }, [getVideoId, currentVideoId, fetchComments])

  // Initialize video ID and fetch comments on component mount
  useEffect(() => {
    const initialVideoId = getVideoId()
    setCurrentVideoId(initialVideoId)
    if (autoSummarize && initialVideoId) {
      fetchComments(true)
    } else {
      clearState()
    }
  }, [getVideoId, autoSummarize, fetchComments, clearState])

  // Listen for URL changes (navigation within YouTube)
  useEffect(() => {
    // Listen for back/forward navigation
    const handlePopState = () => handleUrlChange()
    const handleHashChange = () => handleUrlChange()

    window.addEventListener("popstate", handlePopState)
    window.addEventListener("hashchange", handleHashChange)

    // Monitor for programmatic navigation (YouTube's SPA navigation)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (
      state: any,
      title: string,
      url?: string | URL | null
    ) {
      originalPushState.apply(this, arguments as any)
      handleUrlChange()
    }

    history.replaceState = function (
      state: any,
      title: string,
      url?: string | URL | null
    ) {
      originalReplaceState.apply(this, arguments as any)
      handleUrlChange()
    }

    return () => {
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("hashchange", handleHashChange)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [handleUrlChange])

  // Optimized URL polling for YouTube SPA navigation
  useEffect(() => {
    let lastUrl = window.location.href
    let isPolling = true

    const pollForChanges = () => {
      if (!isPolling) return

      const currentUrl = window.location.href
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl
        handleUrlChange()
      }
    }

    // Check every 3 seconds when visible
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        pollForChanges()
      }
    }, 3000)

    return () => {
      isPolling = false
      clearInterval(pollInterval)
    }
  }, [handleUrlChange])

  // Handle auto-summarize setting changes
  useEffect(() => {
    if (autoSummarize) {
      fetchComments(true)
    } else {
      clearState()
    }
  }, [autoSummarize, fetchComments, clearState])

  // Show loading state
  if (isLoading) {
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
            {l18n.loadingCommentsSummary}
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
              {l18n.errorLoadingComments}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#fca5a5" }}>
            {error}
          </p>
          {error.includes("Chrome API not available") && (
            <div
              style={{ marginTop: "8px", fontSize: "11px", color: "#fca5a5" }}>
              <p style={{ margin: 0, marginBottom: "4px" }}>
                <strong>{l18n.possibleSolutions}:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: "16px" }}>
                <li>{l18n.tryRefreshingThePage}</li>
                <li>{l18n.tryOpeningTheVideoInANewTab}</li>
                <li>{l18n.checkIfYoureInIncognitoMode}</li>
                <li>{l18n.theExtensionMayNotWorkInEmbeddedVideos}</li>
              </ul>
            </div>
          )}
          <button
            onClick={() => fetchComments(true)}
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
            {l18n.retry}
          </button>
        </div>
      </div>
    )
  }

  // Show summary
  if (!commentsSummary) {
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
        {l18n.commentsSummary}
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
        {l18n.summarizedByAI} &middot; {l18n.poweredBy}
        &middot; {l18n.madeWithLoveByBNN}.
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
                {l18n.tone}
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
                {l18n.analysis}
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
                {mapToneToLabelL18n(toneRating.rating)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function mapToneToLabelL18n(tone: string) {
  switch (tone) {
    case "positive":
      return l18n.positiveTone
    case "quite positive":
      return l18n.quitePositiveTone
    case "quite negative":
      return l18n.quiteNegativeTone
    case "neutral":
      return l18n.neutralTone
    case "negative":
      return l18n.negativeTone
    default:
      return l18n.neutralTone
  }
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => ({
  element: document.querySelector("#description.ytd-watch-metadata")
    ?.parentElement,
  // element: document.querySelector("form[role='search']"),
  insertPosition: "afterend"
})

export default SummaryDisplay

import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useState } from "react"

import type { PlasmoGetInlineAnchor } from "~node_modules/plasmo/dist/type"

import type { ToneRating } from "../types/youtube"

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

// Configure content script to run on YouTube pages
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
  const msgCallback = useCallback(
    (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ): boolean | undefined => {
      console.log("[CommentsSummarizer]: Received message from popup", message)

      if (message.action === "getCommentsSummary") {
        console.log(
          "[CommentsSummarizer]: Received summary from popup",
          message
        )
        setCommentsSummary(message.commentsSummary)
        setToneRating(message.toneRating)
        message.sendResponse({ success: true })
        return true
      }
      return false
    },
    []
  )

  useEffect(() => {
    console.log("[CommentsSummarizer]: Adding message listener")
    chrome.runtime.onMessage.addListener(msgCallback)

    return () => {
      console.log("[CommentsSummarizer]: Removing message listener")
      chrome.runtime.onMessage.removeListener(msgCallback)
    }
  }, [])

  if (!commentsSummary) return null

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

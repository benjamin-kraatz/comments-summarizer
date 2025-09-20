import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useState } from "react"

import type { PlasmoGetInlineAnchor } from "~node_modules/plasmo/dist/type"

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

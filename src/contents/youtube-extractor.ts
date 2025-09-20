import type { PlasmoCSConfig } from "plasmo"
import { YouTubeExtractor } from "../services/youtubeExtractor"
import type { YouTubeContentScriptRequest, YouTubeContentScriptResponse } from "../types/youtube"

// Configure content script to run on YouTube pages
export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/watch*", "https://youtube.com/watch*"],
  all_frames: false
}

// YouTube extractor content script loaded

// Check if chrome.runtime is available
if (typeof chrome === 'undefined' || !chrome.runtime) {
  console.error("[CommentsSummarizer]: Chrome runtime API not available in content script")
} else {
  // Listen for messages from popup or background script
  chrome.runtime.onMessage.addListener(
    (request: YouTubeContentScriptRequest, sender, sendResponse) => {
      console.log("[CommentsSummarizer]: Received message in content script:", request)
      console.log("[CommentsSummarizer]: Current URL:", window.location.href)

      if (request.action === 'extractVideoMetadata') {
        // Extract video metadata using our service
        YouTubeExtractor.extractVideoMetadataWithRetry()
          .then((result: any) => {
            const response: YouTubeContentScriptResponse = result
            console.log("[CommentsSummarizer]: Extracted metadata:", response)
            sendResponse(response)
          })
          .catch((error: Error) => {
            console.error("[CommentsSummarizer]: Error extracting metadata:", error)
            const response: YouTubeContentScriptResponse = {
              success: false,
              error: error.message
            }
            sendResponse(response)
          })

        // Return true to indicate we'll respond asynchronously
        return true
      }

      // Unknown action
      sendResponse({
        success: false,
        error: '[CommentsSummarizer]: Unknown action'
      })
    }
  )
}

// Also listen for direct messages from popup (in case we need to support both approaches)
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return

  if (event.data.type === '[CommentsSummarizer]: YOUTUBE_EXTRACT_METADATA') {
    YouTubeExtractor.extractVideoMetadataWithRetry()
      .then((result: any) => {
        window.postMessage({
          type: '[CommentsSummarizer]: YOUTUBE_EXTRACTION_RESULT',
          ...result
        }, '*')
      })
      .catch((error: Error) => {
        window.postMessage({
          type: '[CommentsSummarizer]: YOUTUBE_EXTRACTION_RESULT',
          success: false,
          error: error.message
        }, '*')
      })
  }
})

export {}

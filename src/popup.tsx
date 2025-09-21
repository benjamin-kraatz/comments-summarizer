import { useEffect, useState } from "react"

import { useSettings } from "./store/settingsStore"
import type { YouTubeVideoMetadata } from "./types/youtube"

import "./styles.css"

import { ApiService } from "./services/api-service"

function IndexPopup() {
  const {
    darkMode,
    hasApiKey,
    isYouTubeReady,
    summarizationModel,
    maxComments,
    autoSummarize
  } = useSettings()
  const [selectedVideo, setSelectedVideo] = useState("")
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false)
  const [videoTitle, setVideoTitle] = useState("")
  const [videoMetadata, setVideoMetadata] =
    useState<YouTubeVideoMetadata | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)

  // Extract YouTube video metadata from content script
  const extractVideoMetadata = async (
    tabId: number,
    url: string,
    maxRetries: number = 3
  ) => {
    try {
      setMetadataError(null)

      // Get the video ID from the URL
      const videoId = url.split("v=")[1]?.split("&")[0]
      if (!videoId) {
        throw new Error("Could not extract video ID from URL")
      }

      // First, try finding the comment summarization in the API.
      const apiResponse = await ApiService.getComments(videoId)
      if (apiResponse.type === "error") {
        setMetadataError(apiResponse.error ?? "Error getting comments")
        return
      }

      console.log("[CommentsSummarizer]: Sending message to content script")
      chrome.tabs.sendMessage(
        tabId,
        {
          action: "getCommentsSummary",
          commentsSummary: apiResponse.comments,
          toneRating: apiResponse.toneRating
        },
        (response) => {
          console.log(
            "[CommentsSummarizer]: Received message from content script",
            response
          )
        }
      )

      // Not found in the API, so call the server to get them comments.
      // TODO:

      // Check if chrome.tabs is available
      if (typeof chrome === "undefined" || !chrome.tabs) {
        throw new Error("Chrome tabs API not available")
      }

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await new Promise<any>((resolve, reject) => {
            chrome.tabs.sendMessage(
              tabId,
              {
                action: "extractVideoMetadata"
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message))
                } else {
                  resolve(response)
                }
              }
            )
          })

          if (response && response.success) {
            setVideoMetadata(response.data)
            setVideoTitle(response.data.title)
            return // Success, exit the retry loop
          } else {
            const errorMessage =
              response?.error || "Failed to extract video metadata"
            throw new Error(errorMessage)
          }
        } catch (error) {
          console.warn(
            `[CommentsSummarizer]: Metadata extraction attempt ${attempt} failed:`,
            error
          )

          // If this isn't the last attempt, wait before retrying
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } else {
            throw error
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred"
      setMetadataError(errorMessage)
      console.error(
        "[CommentsSummarizer]: Error communicating with content script:",
        error
      )
    }
  }

  // Detect YouTube video
  useEffect(() => {
    console.log("[CommentsSummarizer]: Detecting YouTube video")
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      console.log("[CommentsSummarizer]: Querying tabs", tabs)
      if (tabs[0].url) {
        const url = tabs[0].url
        console.log("[CommentsSummarizer]: Found URL", url)
        const isYouTube =
          url.includes("youtube.com/watch") ||
          url.includes("youtu.be/") ||
          url.includes("google.com")
        console.log("[CommentsSummarizer]: Found isYouTube", isYouTube)
        setIsYouTubeVideo(isYouTube)

        if (isYouTube) {
          console.log("[CommentsSummarizer]: Found isYouTube", isYouTube)
          // Extract video ID and get basic info
          const videoId = url.includes("youtube.com/watch")
            ? url.split("v=")[1]?.split("&")[0]
            : url.split("youtu.be/")[1]?.split("?")[0]
          if (videoId) {
            setSelectedVideo(url)
            setVideoTitle(`Loading video info...`)

            // Check if content script is available before trying to extract metadata
            chrome.tabs.get(tabs[0].id, (tab) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "[CommentsSummarizer]: Error getting tab:",
                  chrome.runtime.lastError
                )
                setMetadataError("Could not access current tab")
                return
              }

              // Try to extract metadata, with fallback to basic info
              extractVideoMetadata(tabs[0].id, url).catch(() => {
                // Fallback: show basic info if content script fails
                console.log(
                  "[CommentsSummarizer]: Content script not available, using fallback"
                )
                setVideoTitle(`YouTube Video (${videoId.substring(0, 8)}...)`)
                setMetadataError(
                  "Content script not loaded - showing basic info"
                )
              })
            })
          }
        } else {
          setSelectedVideo(url)
          setVideoTitle("Not a YouTube video")
          setVideoMetadata(null)
          setMetadataError(null)
        }
      }
    })
  }, [])

  const handleSummarize = async () => {
    if (!isYouTubeVideo || !hasApiKey) return

    setIsProcessing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      // In real implementation, call your summarization API here
      console.log(
        "[CommentsSummarizer]: Summarizing comments for:",
        selectedVideo
      )
    } catch (error) {
      console.error("[CommentsSummarizer]: Error summarizing:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRefresh = () => {
    if (typeof chrome !== "undefined") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
        if (tabs[0].url) {
          const url = tabs[0].url
          setSelectedVideo(url)
          const isYouTube =
            url.includes("youtube.com/watch") || url.includes("youtu.be/")
          setIsYouTubeVideo(isYouTube)

          if (isYouTube) {
            const videoId = url.includes("youtube.com/watch")
              ? url.split("v=")[1]?.split("&")[0]
              : url.split("youtu.be/")[1]?.split("?")[0]

            if (videoId) {
              setVideoTitle(`Loading video info...`)

              // Check if content script is available before trying to extract metadata
              chrome.tabs.get(tabs[0].id, (tab) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "[CommentsSummarizer]: Error getting tab:",
                    chrome.runtime.lastError
                  )
                  setMetadataError("Could not access current tab")
                  return
                }

                // Try to extract metadata, with fallback to basic info
                extractVideoMetadata(tabs[0].id, url).catch(() => {
                  // Fallback: show basic info if content script fails
                  console.log(
                    "[CommentsSummarizer]: Content script not available, using fallback"
                  )
                  setVideoTitle(`YouTube Video (${videoId.substring(0, 8)}...)`)
                  setMetadataError(
                    "Content script not loaded - showing basic info"
                  )
                })
              })
            }
          } else {
            setVideoTitle("Not a YouTube video")
            setVideoMetadata(null)
            setMetadataError(null)
          }
        }
      })
    }
  }

  const openOptions = () => {
    if (chrome?.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    }
  }

  return (
    <div
      className={`w-80 p-6 rounded-xl shadow-2xl transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
              darkMode
                ? "bg-gradient-to-br from-purple-600 to-blue-600"
                : "bg-gradient-to-br from-purple-500 to-blue-500"
            }`}>
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Comments Summarizer
        </h2>
        <p
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          AI-powered YouTube comment analysis
        </p>
      </div>

      {/* Current Video Status */}
      <div
        className={`mb-4 p-4 rounded-lg border transition-colors ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-gray-50 border-gray-200"
        }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {isYouTubeVideo ? (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            ) : (
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            )}
            <span
              className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Current Video
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className={`p-1 rounded-full transition-colors ${
              darkMode
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-200 text-gray-600"
            }`}
            title="Refresh current tab">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {metadataError ? (
          <div className="mb-3">
            <div
              className={`p-2 rounded text-sm ${
                darkMode
                  ? "bg-red-900/20 text-red-300 border border-red-700"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {metadataError}
              </div>
            </div>
          </div>
        ) : videoMetadata ? (
          <div className="space-y-3">
            {/* Video Title */}
            <div>
              <h3
                className={`text-sm font-semibold mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                {videoMetadata.title}
              </h3>
            </div>

            {/* Channel Info */}
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <a
                href={videoMetadata.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm hover:underline ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                {videoMetadata.channelName}
              </a>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  📅 {videoMetadata.publishedDate}
                </span>
                <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  👁️ {videoMetadata.views}
                </span>
              </div>
              <a
                href={videoMetadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs transition-colors ${
                  darkMode
                    ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                    : "text-blue-600 hover:text-blue-700 hover:bg-gray-200"
                }`}
                title="Open video">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <span
              className={`ml-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Loading video info...
            </span>
          </div>
        )}

        <div className="flex items-center mt-3">
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              isYouTubeVideo
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            }`}>
            {isYouTubeVideo ? "✓ YouTube Video" : "⚠ Not YouTube"}
          </span>
        </div>
      </div>

      {/* Quick Settings Overview */}
      <div
        className={`mb-4 p-4 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
        <h4
          className={`text-sm font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Quick Settings
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
              AI Model:
            </span>
            <span
              className={`px-2 py-1 rounded-full ${
                darkMode
                  ? "bg-purple-900 text-purple-200"
                  : "bg-purple-100 text-purple-800"
              }`}>
              {summarizationModel.replace("-", " ").toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
              Max Comments:
            </span>
            <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
              {maxComments}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
              Auto-summarize:
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                autoSummarize
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
              }`}>
              {autoSummarize ? "ON" : "OFF"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSummarize}
        disabled={!isYouTubeVideo || !hasApiKey || isProcessing}
        className={`w-full inline-flex items-center justify-center px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform ${
          !isYouTubeVideo || !hasApiKey
            ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
            : isProcessing
              ? "bg-yellow-600 text-white hover:bg-yellow-700"
              : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98]"
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}>
        {isProcessing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            {isYouTubeVideo ? "Summarize Comments" : "Select YouTube Video"}
          </>
        )}
      </button>

      {/* Settings & Status Bar */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <button
          onClick={openOptions}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
            darkMode
              ? "text-purple-400 hover:text-purple-300 hover:bg-gray-800"
              : "text-purple-600 hover:text-purple-700 hover:bg-gray-100"
          }`}>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Settings</span>
        </button>

        <div
          className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
            hasApiKey
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}>
          <div
            className={`w-2 h-2 rounded-full ${hasApiKey ? "bg-green-500" : "bg-red-500"}`}></div>
          <span>{hasApiKey ? "API Ready" : "API Missing"}</span>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`mt-4 text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        <p className="text-xs">v0.0.1 • Made with ❤️</p>
      </div>
    </div>
  )
}

export default IndexPopup

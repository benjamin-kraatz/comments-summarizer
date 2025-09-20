import { useEffect, useState } from "react"
import { useSettings } from "./store/settingsStore"

import "./styles.css"

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
  const [isProcessing, setIsProcessing] = useState(false)

  // Detect YouTube video
  useEffect(() => {
    if (typeof chrome !== "undefined") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
        if (tabs[0].url) {
          const url = tabs[0].url
          const isYouTube = url.includes('youtube.com/watch') || url.includes('youtu.be/')
          setIsYouTubeVideo(isYouTube)

          if (isYouTube) {
            // Extract video ID and get basic info
            const videoId = url.includes('youtube.com/watch')
              ? url.split('v=')[1]?.split('&')[0]
              : url.split('youtu.be/')[1]?.split('?')[0]

            if (videoId) {
              setSelectedVideo(url)
              // In a real implementation, you might fetch video title from YouTube API
              setVideoTitle(`YouTube Video (${videoId.substring(0, 8)}...)`)
            }
          } else {
            setSelectedVideo(url)
            setVideoTitle("Not a YouTube video")
          }
        }
      })
    }
  }, [])

  const handleSummarize = async () => {
    if (!isYouTubeVideo || !hasApiKey) return

    setIsProcessing(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      // In real implementation, call your summarization API here
      console.log('Summarizing comments for:', selectedVideo)
    } catch (error) {
      console.error('Error summarizing:', error)
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
          const isYouTube = url.includes('youtube.com/watch') || url.includes('youtu.be/')
          setIsYouTubeVideo(isYouTube)

          if (isYouTube) {
            const videoId = url.includes('youtube.com/watch')
              ? url.split('v=')[1]?.split('&')[0]
              : url.split('youtu.be/')[1]?.split('?')[0]
            setVideoTitle(`YouTube Video (${videoId?.substring(0, 8)}...)`)
          } else {
            setVideoTitle("Not a YouTube video")
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
    <div className={`w-80 p-6 rounded-xl shadow-2xl transition-all duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
            darkMode ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-blue-500'
          }`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Comments Summarizer
        </h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          AI-powered YouTube comment analysis
        </p>
      </div>

      {/* Current Video Status */}
      <div className={`mb-4 p-4 rounded-lg border transition-colors ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isYouTubeVideo ? (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            ) : (
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            )}
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Current Page
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className={`p-1 rounded-full transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Refresh current tab"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <p className={`text-xs break-all ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {selectedVideo || "No page selected"}
        </p>
        <div className="flex items-center mt-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            isYouTubeVideo
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {isYouTubeVideo ? '✓ YouTube Video' : '⚠ Not YouTube'}
          </span>
        </div>
      </div>

      {/* Quick Settings Overview */}
      <div className={`mb-4 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Quick Settings
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>AI Model:</span>
            <span className={`px-2 py-1 rounded-full ${
              darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
            }`}>
              {summarizationModel.replace('-', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Max Comments:</span>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              {maxComments}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Auto-summarize:</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              autoSummarize
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {autoSummarize ? 'ON' : 'OFF'}
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
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
            : isProcessing
            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98]'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {isYouTubeVideo ? 'Summarize Comments' : 'Select YouTube Video'}
          </>
        )}
      </button>

      {/* Settings & Status Bar */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <button
          onClick={openOptions}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
            darkMode
              ? 'text-purple-400 hover:text-purple-300 hover:bg-gray-800'
              : 'text-purple-600 hover:text-purple-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </button>

        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
          hasApiKey
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{hasApiKey ? 'API Ready' : 'API Missing'}</span>
        </div>
      </div>

      {/* Footer */}
      <div className={`mt-4 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        <p className="text-xs">
          v0.0.1 • Made with ❤️
        </p>
      </div>
    </div>
  )
}

export default IndexPopup

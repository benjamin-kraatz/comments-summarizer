import { useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./components/ui/select"
import { Switch } from "./components/ui/switch"

import "./styles.css"

import { l18n } from "./lib/l18n"
import { cn } from "./lib/utils"

function IndexPopup() {
  // Use individual storage hooks
  const [darkMode, setDarkMode] = useStorage("darkMode", true)
  const [maxComments, setMaxComments] = useStorage("maxComments", 50)
  const [autoSummarize, setAutoSummarize] = useStorage("autoSummarize", false)
  const [showThumbnails, setShowThumbnails] = useStorage("showThumbnails", true)
  const [selectedVideo, setSelectedVideo] = useState("")
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false)
  const [videoTitle, setVideoTitle] = useState("")

  // Detect YouTube video
  useEffect(() => {
    console.log("[CommentsSummarizer]: Detecting YouTube video")

    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs: chrome.tabs.Tab[]) => {
        console.log("[CommentsSummarizer]: Querying tabs", tabs)
        if (tabs[0] && tabs[0].url) {
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
              setVideoTitle(`YouTube Video (${videoId.substring(0, 8)}...)`)
            }
          } else {
            setSelectedVideo(url)
            setVideoTitle("Not a YouTube video")
          }
        } else {
          setVideoTitle("No active tab found")
        }
      }
    )
  }, [])

  const handleRefresh = () => {
    console.log("[CommentsSummarizer]: Refreshing tab info")

    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs: chrome.tabs.Tab[]) => {
        if (tabs[0] && tabs[0].url) {
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
              setVideoTitle(`YouTube Video (${videoId.substring(0, 8)}...)`)
            }
          } else {
            setVideoTitle("Not a YouTube video")
          }
        } else {
          setVideoTitle("No active tab found")
        }
      }
    )
  }

  const openOptions = () => {
    console.log("[CommentsSummarizer]: Opening options page")

    // Check if Chrome APIs are available
    if (
      typeof chrome === "undefined" ||
      !chrome.runtime ||
      !chrome.runtime.openOptionsPage
    ) {
      console.warn("[CommentsSummarizer]: Chrome runtime API not available")
      return
    }

    try {
      chrome.runtime.openOptionsPage()
    } catch (error) {
      console.error("[CommentsSummarizer]: Error opening options page:", error)
    }
  }

  return (
    <div className="w-80 p-6 shadow-2xl transition-all duration-300 dark bg-background text-foreground">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-primary to-secondary"
            )}>
            <svg
              className="w-6 h-6 text-primary-foreground"
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
        <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-primary to-[#abc123] bg-clip-text text-transparent">
          {l18n.extensionName}
        </h2>
        <p className="text-sm text-muted-foreground">{l18n.extensionClaim}</p>
      </div>

      {/* Quick Settings Overview */}
      <Card className="mb-4 p-0 flex flex-col gap-2">
        <CardHeader className="px-4 pt-3 pb-0">
          <CardTitle className="font-bold text-base p-0">
            {l18n.quickSettings.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0 flex flex-col gap-2">
          <label
            htmlFor="auto-summarize"
            className="flex justify-between items-center text-sm">
            <span>{l18n.quickSettings.enableSummarization}</span>
            <Switch
              id="auto-summarize"
              checked={autoSummarize}
              onCheckedChange={setAutoSummarize}
            />
          </label>
          <label
            htmlFor="position"
            className="flex justify-between items-center text-sm">
            <span>{l18n.quickSettings.position.title}</span>
            <Select defaultValue="below-description">
              <SelectTrigger
                className="max-w-[160px] w-full"
                disabled={!autoSummarize}>
                <SelectValue placeholder="Position" id="position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="below-description">
                  {l18n.quickSettings.position.belowDescription}
                </SelectItem>
                <SelectItem value="above-comments">
                  {l18n.quickSettings.position.aboveComments}
                </SelectItem>
              </SelectContent>
            </Select>
          </label>

          <div className="my-2">
            <div className="border-b border-border h-1" />
          </div>

          <div className="flex flex-col gap-1">
            <button className="flex items-center py-1 rounded-lg transition-colors text-primary hover:text-secondary">
              <span>{l18n.reportWrongSummarization}</span>
            </button>
            <button className="flex items-center py-1 rounded-lg transition-colors text-primary hover:text-secondary">
              <span>{l18n.reportIssue}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Settings & Status Bar */}
      <div className="flex flex-col gap-2 items-center">
        <div className="mt-4 flex items-center justify-center text-xs">
          <a
            href="https://www.buymeacoffee.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-1 rounded-full transition-colors text-primary hover:text-secondary-foreground hover:bg-secondary">
            {/* BuyMeACoffee Icon SVG */}
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              {/* Coffee cup body */}
              <path
                d="M18 8h-2V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H6a1 1 0 000 2h1v7a3 3 0 003 3h6a3 3 0 003-3V10h1a1 1 0 100-2z"
                fill="currentColor"
                className="text-amber-600"
              />

              {/* Coffee surface */}
              <ellipse
                cx="12"
                cy="10"
                rx="5"
                ry="1"
                fill="currentColor"
                className="text-amber-800"
              />

              {/* Steam */}
              <path
                d="M8 8c0-1 1-2 2-2s2 1 2 2M10 6c0-1 1-2 2-2s2 1 2 2M12 4c0-1 1-2 2-2s2 1 2 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-amber-400"
                opacity="0.8"
              />

              {/* Handle */}
              <path
                d="M16 7a2 2 0 012 2v2a2 2 0 01-2 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                className="text-amber-700"
              />

              {/* Coffee beans pattern */}
              <circle
                cx="9"
                cy="11"
                r="0.8"
                fill="currentColor"
                className="text-amber-900"
                opacity="0.6"
              />
              <circle
                cx="11"
                cy="12"
                r="0.6"
                fill="currentColor"
                className="text-amber-900"
                opacity="0.4"
              />
              <circle
                cx="13"
                cy="11.5"
                r="0.7"
                fill="currentColor"
                className="text-amber-900"
                opacity="0.5"
              />
            </svg>
            <span>{l18n.buyMeACoffee}</span>
          </a>

          <button
            onClick={openOptions}
            className="flex items-center space-x-1 px-3 py-1 rounded-full transition-colors text-primary hover:text-primary-foreground hover:bg-primary">
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              {/* Toolbox base */}
              <rect
                x="4"
                y="10"
                width="16"
                height="10"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="currentColor"
                className="text-primary"
              />

              {/* Toolbox handle */}
              <rect
                x="10"
                y="8"
                width="4"
                height="3"
                rx="0.5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="currentColor"
                className="text-primary"
              />

              {/* Wrench */}
              <path
                d="M6 16l2-2m0 0l1-1m-1 1l-1 1m2-2l1-1m-1 1l-1 1"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                className="text-secondary"
              />
              <circle
                cx="8"
                cy="14"
                r="0.8"
                fill="currentColor"
                className="text-secondary"
              />

              {/* Screwdriver */}
              <rect
                x="12"
                y="14"
                width="3"
                height="0.8"
                rx="0.2"
                fill="currentColor"
                className="text-gray-600"
              />
              <rect
                x="11.5"
                y="15.5"
                width="1"
                height="2"
                rx="0.1"
                fill="currentColor"
                className="text-gray-700"
              />

              {/* Hammer */}
              <rect
                x="16"
                y="15"
                width="2"
                height="0.6"
                rx="0.1"
                fill="currentColor"
                className="text-purple-600"
              />
              <rect
                x="15.8"
                y="16.2"
                width="0.8"
                height="1.5"
                rx="0.1"
                fill="currentColor"
                className="text-purple-700"
              />

              {/* Plus sign for "more" */}
              <circle
                cx="19"
                cy="12"
                r="1.5"
                fill="currentColor"
                className="text-green-500"
              />
              <path
                d="M19 11v2m-1-1h2"
                stroke="white"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
            <span>More Tools</span>
          </button>
        </div>

        <button
          onClick={openOptions}
          className="flex items-center space-x-1 px-3 py-1 rounded-full transition-colors text-primary hover:text-primary-foreground hover:bg-primary">
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
          <span>{l18n.creatorLetstalk}</span>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col gap-2 items-center">
        <div className="text-center text-muted-foreground">
          <p className="text-xs">v0.0.1 • Made with ❤️ by BNN</p>
        </div>
        <div className="flex items-center justify-center flex-wrap gap-2">
          <a
            href="https://www.buymeacoffee.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary hover:underline">
            {l18n.privacyPolicy}
          </a>
          <span className="text-xs text-muted-foreground">&middot;</span>
          <a
            href="https://www.buymeacoffee.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary hover:underline">
            {l18n.termsOfService}
          </a>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup

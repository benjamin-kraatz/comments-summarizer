import { useEffect } from "react"

import { useStorage } from "@plasmohq/storage/hook"

// Settings interface - simplified for content script usage
export interface SettingsState {
  // Theme
  darkMode: boolean

  // API Configuration
  /**
   * @deprecated An API key is no longer required
   */
  apiKey: string

  // Summarization Settings
  /**
   * @deprecated There is no summarization model selection anymore.
   */
  summarizationModel:
    | "gpt-3.5-turbo"
    | "gpt-4"
    | "gpt-4-turbo"
    | "claude-3-haiku"
    | "claude-3-sonnet"
  summaryLength: "short" | "medium" | "long" | "detailed"
  maxComments: number

  // Display Options
  autoSummarize: boolean
  showThumbnails: boolean
}

// Default settings
export const defaultSettings: SettingsState = {
  darkMode: true,
  apiKey: "",
  summarizationModel: "gpt-3.5-turbo",
  summaryLength: "medium",
  maxComments: 50,
  autoSummarize: false,
  showThumbnails: true
}

// Helper hook for components that need both reading and writing settings
export const useSettings = () => {
  const [darkMode, setDarkMode] = useStorage(
    "darkMode",
    defaultSettings.darkMode
  )
  const [apiKey, setApiKey] = useStorage("apiKey", defaultSettings.apiKey)
  const [summarizationModel, setSummarizationModel] = useStorage(
    "summarizationModel",
    defaultSettings.summarizationModel
  )
  const [summaryLength, setSummaryLength] = useStorage(
    "summaryLength",
    defaultSettings.summaryLength
  )
  const [maxComments, setMaxComments] = useStorage(
    "maxComments",
    defaultSettings.maxComments
  )
  const [autoSummarize, setAutoSummarize] = useStorage(
    "autoSummarize",
    defaultSettings.autoSummarize
  )
  const [showThumbnails, setShowThumbnails] = useStorage(
    "showThumbnails",
    defaultSettings.showThumbnails
  )

  // Apply dark mode to document immediately
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", darkMode)
    }
  }, [darkMode])

  return {
    // State
    darkMode,
    apiKey,
    summarizationModel,
    summaryLength,
    maxComments,
    autoSummarize,
    showThumbnails,

    // Computed values
    hasApiKey: Boolean(apiKey),
    isYouTubeReady: Boolean(apiKey),

    // Actions
    actions: {
      setDarkMode,
      setApiKey,
      setSummarizationModel,
      setSummaryLength,
      setMaxComments,
      setAutoSummarize,
      setShowThumbnails,
      resetToDefaults: () => {
        setDarkMode(defaultSettings.darkMode)
        setApiKey(defaultSettings.apiKey)
        setSummarizationModel(defaultSettings.summarizationModel)
        setSummaryLength(defaultSettings.summaryLength)
        setMaxComments(defaultSettings.maxComments)
        setAutoSummarize(defaultSettings.autoSummarize)
        setShowThumbnails(defaultSettings.showThumbnails)
      }
    }
  }
}

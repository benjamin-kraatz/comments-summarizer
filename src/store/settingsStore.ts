import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SettingsState {
  // Theme
  darkMode: boolean

  // API Configuration
  apiKey: string

  // Summarization Settings
  summarizationModel: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo' | 'claude-3-haiku' | 'claude-3-sonnet'
  summaryLength: 'short' | 'medium' | 'long' | 'detailed'
  maxComments: number

  // Display Options
  autoSummarize: boolean
  showThumbnails: boolean

  // Actions
  setDarkMode: (darkMode: boolean) => void
  setApiKey: (apiKey: string) => void
  setSummarizationModel: (model: SettingsState['summarizationModel']) => void
  setSummaryLength: (length: SettingsState['summaryLength']) => void
  setMaxComments: (maxComments: number) => void
  setAutoSummarize: (autoSummarize: boolean) => void
  setShowThumbnails: (showThumbnails: boolean) => void
  resetToDefaults: () => void
}

// Default settings
const defaultSettings: Omit<SettingsState, 'setDarkMode' | 'setApiKey' | 'setSummarizationModel' | 'setSummaryLength' | 'setMaxComments' | 'setAutoSummarize' | 'setShowThumbnails' | 'resetToDefaults'> = {
  darkMode: true,
  apiKey: '',
  summarizationModel: 'gpt-3.5-turbo',
  summaryLength: 'medium',
  maxComments: 50,
  autoSummarize: false,
  showThumbnails: true,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setDarkMode: (darkMode: boolean) => {
        set({ darkMode })
        // Apply to document immediately
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', darkMode)
        }
      },

      setApiKey: (apiKey: string) => set({ apiKey }),

      setSummarizationModel: (summarizationModel) => set({ summarizationModel }),

      setSummaryLength: (summaryLength) => set({ summaryLength }),

      setMaxComments: (maxComments: number) => set({ maxComments }),

      setAutoSummarize: (autoSummarize: boolean) => set({ autoSummarize }),

      setShowThumbnails: (showThumbnails: boolean) => set({ showThumbnails }),

      resetToDefaults: () => set({ ...defaultSettings }),
    }),
    {
      name: 'comments-summarizer-settings',
      // Only persist specific fields, not actions
      partialize: (state) => ({
        darkMode: state.darkMode,
        apiKey: state.apiKey,
        summarizationModel: state.summarizationModel,
        summaryLength: state.summaryLength,
        maxComments: state.maxComments,
        autoSummarize: state.autoSummarize,
        showThumbnails: state.showThumbnails,
      }),
    }
  )
)

// Helper hook for components that only need to read settings
export const useSettings = () => {
  const store = useSettingsStore()

  return {
    // State
    darkMode: store.darkMode,
    apiKey: store.apiKey,
    summarizationModel: store.summarizationModel,
    summaryLength: store.summaryLength,
    maxComments: store.maxComments,
    autoSummarize: store.autoSummarize,
    showThumbnails: store.showThumbnails,

    // Computed values
    hasApiKey: Boolean(store.apiKey),
    isYouTubeReady: Boolean(store.apiKey),

    // Actions
    actions: {
      setDarkMode: store.setDarkMode,
      setApiKey: store.setApiKey,
      setSummarizationModel: store.setSummarizationModel,
      setSummaryLength: store.setSummaryLength,
      setMaxComments: store.setMaxComments,
      setAutoSummarize: store.setAutoSummarize,
      setShowThumbnails: store.setShowThumbnails,
      resetToDefaults: store.resetToDefaults,
    },
  }
}

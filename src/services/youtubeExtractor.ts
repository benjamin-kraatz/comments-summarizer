import type {
  YouTubeExtractionResult,
  YouTubeVideoMetadata
} from "../types/youtube"

export class YouTubeExtractor {
  private static readonly SELECTORS = {
    // Multiple selector strategies for each element to handle YouTube UI changes
    title: ["div#title.ytd-watch-metadata"],
    channelName: ["div.ytd-channel-name a.yt-simple-endpoint"],
    channelUrl: [
      "div#owner ytd-video-owner-renderer a.yt-simple-endpoint",
      "ytd-video-owner-renderer a",
      ".ytd-video-owner-renderer a",
      '[contains(@href, "/channel/")]'
    ],
    publishedDate: [
      "yt-formatted-string#info.ytd-watch-info-text span:nth-child(3)"
    ],
    views: ["yt-formatted-string#info.ytd-watch-info-text :first-child"]
  }

  /**
   * Check if current page is a YouTube video page
   */
  static isYouTubeVideoPage(): boolean {
    const url = window.location.href
    return url.includes("youtube.com/watch") || url.includes("youtu.be/")
  }

  /**
   * Extract video ID from YouTube URL
   */
  static extractVideoId(url: string): string | null {
    if (url.includes("youtube.com/watch")) {
      return url.split("v=")[1]?.split("&")[0] || null
    } else if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1]?.split("?")[0] || null
    }
    return null
  }

  /**
   * Try multiple selectors to find an element
   */
  private static findElement(selectors: string[]): HTMLElement | null {
    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element) {
        return element as HTMLElement
      }
    }
    return null
  }

  /**
   * Try multiple selectors to find an anchor element with href
   */
  private static findAnchorElement(
    selectors: string[]
  ): HTMLAnchorElement | null {
    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element && element.tagName === "A") {
        return element as HTMLAnchorElement
      }
    }
    return null
  }

  /**
   * Try multiple selectors to find text content
   */
  private static findTextContent(selectors: string[]): string {
    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        const text = element.textContent?.trim()
        if (text) {
          return text
        }
      }
    }
    return ""
  }

  /**
   * Extract YouTube video metadata from DOM
   */
  static extractVideoMetadata(): YouTubeExtractionResult {
    try {
      if (!this.isYouTubeVideoPage()) {
        return {
          success: false,
          error: "Not a YouTube video page"
        }
      }

      const title = this.findTextContent(this.SELECTORS.title)
      const channelName = this.findTextContent(this.SELECTORS.channelName)
      const channelUrl =
        this.findAnchorElement(this.SELECTORS.channelUrl)?.href || ""
      const publishedDate = this.findTextContent(this.SELECTORS.publishedDate)
      const views = this.findTextContent(this.SELECTORS.views)
      const videoId = this.extractVideoId(window.location.href) || ""
      const url = window.location.href

      if (!title || !channelName || !channelUrl) {
        return {
          success: false,
          error: "Could not find required video elements in DOM"
        }
      }

      const metadata: YouTubeVideoMetadata = {
        title,
        channelName,
        channelUrl,
        publishedDate,
        views,
        videoId,
        url
      }

      return {
        success: true,
        data: metadata
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to extract video metadata: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    }
  }

  /**
   * Wait for elements to be available in DOM
   */
  static async waitForElements(
    selectorGroups: string[][],
    timeout: number = 5000
  ): Promise<boolean> {
    const startTime = Date.now()

    return new Promise((resolve) => {
      const checkElements = () => {
        const allElementsFound = selectorGroups.every((selectors) => {
          return this.findElement(selectors) !== null
        })

        if (allElementsFound) {
          resolve(true)
          return
        }

        if (Date.now() - startTime > timeout) {
          resolve(false)
          return
        }

        setTimeout(checkElements, 100)
      }

      checkElements()
    })
  }

  /**
   * Extract metadata with retry logic
   */
  static async extractVideoMetadataWithRetry(
    maxRetries: number = 3
  ): Promise<YouTubeExtractionResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = this.extractVideoMetadata()

      if (result.success) {
        return result
      }

      // Wait for elements to load if this wasn't the last attempt
      if (attempt < maxRetries) {
        const selectorGroups = Object.values(this.SELECTORS)
        const elementsFound = await this.waitForElements(selectorGroups, 2000)

        if (!elementsFound) {
          break
        }
      }
    }

    return {
      success: false,
      error: "Failed to extract video metadata after multiple attempts"
    }
  }
}

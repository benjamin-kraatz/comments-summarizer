import { z } from "zod"

// Retry configuration interface
export interface RetryConfig {
  maxAttempts: number
  delayMs: number
  retryableErrors?: (error: any) => boolean
}

// Default retry configuration - can be imported and customized by other modules
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 6,
  delayMs: 3000, // 3 seconds
  retryableErrors: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof TypeError && error.message.includes("fetch"))
      return true
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      if (message.includes("timeout") || message.includes("network"))
        return true
    }
    return false
  }
}

/**
 * Generic retry utility function with linear backoff
 * @param operation - The async operation to retry
 * @param config - Retry configuration
 * @returns Promise that resolves with the operation result or rejects with the last error
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Check if error is retryable
      const shouldRetry = config.retryableErrors?.(error) ?? false

      // If this is the last attempt or error is not retryable, throw the error
      if (attempt === config.maxAttempts || !shouldRetry) {
        throw error
      }

      // Wait before retrying
      const is404 = error instanceof Error && error.message.includes("HTTP 404")
      if (is404) {
        console.log(
          `Attempt ${attempt} failed with 404, retrying in ${config.delayMs}ms... (This is normal if backend is starting up)`
        )
      } else {
        console.warn(
          `Attempt ${attempt} failed, retrying in ${config.delayMs}ms...`,
          error
        )
      }
      await new Promise((resolve) => setTimeout(resolve, config.delayMs))
    }
  }

  throw lastError
}

const commentsResponseSchema = z.object({
  comments: z.string(),
  toneRating: z
    .object({
      rating: z.enum([
        "positive",
        "quite positive",
        "quite negative",
        "negative",
        "neutral"
      ]),
      reason: z.string()
    })
    .nullish() // Tone rating is optional during migration
})

type CommentsResponse = z.infer<typeof commentsResponseSchema>

/**
 * API Service for communicating with the backend server
 *
 * Note on CORS:
 * - Content scripts run in the context of the webpage they're injected into
 * - When on YouTube, requests appear to come from origin 'https://www.youtube.com'
 * - The backend server must include 'https://www.youtube.com' in Access-Control-Allow-Origin header
 * - Without proper CORS headers, the browser blocks cross-origin requests for security
 */
export class ApiService {
  private static readonly API_URL = "http://localhost:8787" // "https://cs.bnndv.qzz.io"

  /**
   * Fetches comments for a YouTube video with automatic retry logic
   * @param videoId - The YouTube video ID to fetch comments for
   * @param retryConfig - Optional retry configuration to override defaults
   * @returns Promise resolving to either success with comments data or error
   *
   * @example
   * // Use default retry settings (5 attempts, 2s delay)
   * const result = await ApiService.getComments("video123")
   *
   * @example
   * // Custom retry settings
   * const result = await ApiService.getComments("video123", {
   *   maxAttempts: 3,
   *   delayMs: 1000
   * })
   */
  public static async getComments(
    videoId: string,
    retryConfig?: Partial<RetryConfig>
  ) {
    // Custom retry config for getComments method
    const commentsRetryConfig: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...retryConfig,
      retryableErrors: (error: any) => {
        // First check default retryable errors
        if (DEFAULT_RETRY_CONFIG.retryableErrors!(error)) return true

        // Also retry on specific HTTP status codes (4xx are client errors, don't retry)
        if (error instanceof Error && error.message.includes("fetch")) {
          return true // Network errors should be retried
        }

        // Retry on zod parsing errors (malformed backend responses)
        if (
          error instanceof Error &&
          error.message.includes("Error parsing comments response from backend")
        ) {
          return true
        }

        // Retry on 404 errors - backend might be temporarily unavailable
        if (error instanceof Error && error.message.includes("HTTP 404")) {
          return true
        }

        return false
      }
    }

    try {
      return await withRetry(async () => {
        const requestUrl = `${this.API_URL}/get?videoId=${videoId}`
        console.log(`[API Service] Making request to: ${requestUrl}`)

        // Check if server is reachable first
        try {
          const testResponse = await fetch(this.API_URL, { method: "HEAD" })
          console.log(
            `[API Service] Server reachability test: ${testResponse.status}`
          )
          if (!testResponse.ok) {
            throw new Error(
              `Server not reachable: ${testResponse.status} ${testResponse.statusText}`
            )
          }
        } catch (error) {
          console.warn(`[API Service] Server reachability test failed:`, error)
        }

        const response = await fetch(requestUrl)

        console.log(
          `[API Service] Response status: ${response.status} ${response.statusText}`
        )
        console.log(
          `[API Service] Response headers:`,
          Object.fromEntries(response.headers.entries())
        )

        // Check if response has a body
        const contentLength = response.headers.get("content-length")
        console.log(`[API Service] Content-Length: ${contentLength}`)

        if (contentLength === "0") {
          console.warn(
            `[API Service] Response has empty body (Content-Length: 0)`
          )
          throw new Error("Server returned empty response")
        }

        // Handle HTTP error responses
        if (!response.ok) {
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`

          // Log the specific error type for debugging
          if (response.status === 404) {
            console.warn(
              `[API Service] Got 404 - will retry if configured: ${errorMessage}`
            )
          } else {
            console.error(`[API Service] HTTP error: ${errorMessage}`)
          }

          throw new Error(errorMessage)
        }

        let bodyText: string
        let bodyData: CommentsResponse

        try {
          bodyText = await response.text()
          console.log(`[API Service] Response body length: ${bodyText.length}`)
          console.log(
            `[API Service] Response body (first 500 chars):`,
            bodyText.substring(0, 500)
          )

          // Check if response looks like valid JSON
          if (
            bodyText.trim().startsWith("{") &&
            bodyText.trim().endsWith("}")
          ) {
            console.log(`[API Service] Response appears to be valid JSON`)
          } else {
            console.warn(
              `[API Service] Response doesn't look like JSON:`,
              bodyText.substring(0, 100)
            )

            // Check if this looks like an HTML error page
            if (
              bodyText.toLowerCase().includes("<!doctype html>") ||
              bodyText.toLowerCase().includes("<html")
            ) {
              console.error(
                `[API Service] Server returned HTML instead of JSON - server might be down or returning an error page`
              )
              throw new Error(
                "Server returned HTML error page instead of JSON response"
              )
            }
          }
        } catch (error) {
          console.error("[API Service] Error reading response text:", error)
          console.error("[API Service] Response object:", response)
          throw new Error("Failed to read response body from server")
        }

        try {
          bodyData = JSON.parse(bodyText) as CommentsResponse
        } catch (error) {
          console.error("[API Service] Error parsing JSON response:", error)
          console.error("[API Service] Raw response text:", bodyText)
          throw new Error(
            `Invalid JSON response from server: ${error instanceof Error ? error.message : "Unknown JSON error"}`
          )
        }

        const parsed = commentsResponseSchema.safeParse(bodyData)

        if (!parsed.success) {
          console.error(
            "[API Service] Error validating response schema:",
            parsed.error
          )
          console.error("[API Service] Received data:", bodyData)
          throw new Error(
            `Error parsing comments response from backend: ${parsed.error.message}`
          )
        }

        return {
          type: "success" as const,
          comments: parsed.data.comments,
          toneRating: parsed.data.toneRating
        }
      }, commentsRetryConfig)
    } catch (error) {
      console.error("Error getting comments after all retries:", error)

      // Provide more specific error messages based on the error type
      let errorMessage = "Error getting comments"
      if (error instanceof Error) {
        if (error.message.includes("HTTP 404")) {
          errorMessage =
            "Backend API endpoint not found - the server may not be running or the endpoint may not be implemented"
        } else if (error.message.includes("HTTP 5")) {
          errorMessage = "Backend server error - please try again later"
        } else {
          errorMessage = error.message
        }
      }

      return {
        type: "error" as const,
        error: errorMessage
      }
    }
  }
}

export interface YouTubeVideoMetadata {
  title: string
  channelName: string
  channelUrl: string
  publishedDate: string
  views: string
  videoId: string
  url: string
}

export interface YouTubeExtractionResult {
  success: boolean
  data?: YouTubeVideoMetadata
  error?: string
}

export interface YouTubeContentScriptRequest {
  action: "extractVideoMetadata"
}

export interface YouTubeContentScriptResponse {
  success: boolean
  data?: YouTubeVideoMetadata
  error?: string
}

export interface ToneRating {
  rating:
    | "positive"
    | "quite positive"
    | "quite negative"
    | "negative"
    | "neutral"
  reason: string
}

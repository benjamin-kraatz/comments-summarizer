import { z } from "zod"

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

export class ApiService {
  private static readonly API_URL = "http://localhost:8787"

  public static async getComments(videoId: string) {
    try {
      const response = await fetch(`${this.API_URL}/get?videoId=${videoId}`)
      const bodyData = (await response.json()) as CommentsResponse
      const parsed = commentsResponseSchema.safeParse(bodyData)
      if (!parsed.success) {
        console.error("Error parsing comments:", parsed.error)
        return {
          type: "error",
          error:
            "Error parsing comments response from backend:" +
            parsed.error.message
        }
      }
      return {
        type: "success",
        comments: parsed.data.comments,
        toneRating: parsed.data.toneRating
      }
    } catch (error) {
      console.error("Error getting comments:", error)
      return { type: "error", error: "Error getting comments" }
    }
  }
}

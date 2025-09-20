export class ApiService {
  private static readonly API_URL = "http://localhost:8787"

  public static async getComments(videoId: string) {
    try {
      const response = await fetch(`${this.API_URL}/get?videoId=${videoId}`)
      const bodyData = (await response.json()) as { comments: string }
      return { type: "success", comments: bodyData.comments }
    } catch (error) {
      console.error("Error getting comments:", error)
      return { type: "error", error: "Error getting comments" }
    }
  }
}

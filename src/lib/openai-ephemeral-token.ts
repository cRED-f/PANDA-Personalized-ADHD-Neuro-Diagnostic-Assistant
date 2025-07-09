export interface EphemeralTokenResponse {
  client_secret: {
    value: string;
    expires_at: number;
  };
}

export class OpenAIEphemeralTokenService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateEphemeralToken(
    model: string = "gpt-4o-realtime-preview-2024-10-01"
  ): Promise<string> {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/realtime/sessions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to generate ephemeral token: ${response.status} ${response.statusText}`
        );
      }

      const data: EphemeralTokenResponse = await response.json();
      return data.client_secret.value;
    } catch (error) {
      console.error("Error generating ephemeral token:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to generate ephemeral token"
      );
    }
  }
}

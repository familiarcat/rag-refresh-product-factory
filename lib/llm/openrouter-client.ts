/**
 * OpenRouter API client with retry logic and error handling.
 *
 * This module provides a robust client for making API calls to OpenRouter,
 * with automatic retries, error handling, and cost tracking.
 */

import {
  OpenRouterRequest,
  OpenRouterResponse,
  ModelPricing,
  OpenRouterError,
  RateLimitError,
  AuthenticationError,
} from "./types";

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private retryOptions: RetryOptions;

  constructor(
    apiKey?: string,
    baseUrl?: string,
    timeout: number = 60000,
    retryOptions: Partial<RetryOptions> = {}
  ) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
    this.baseUrl =
      baseUrl ||
      process.env.OPENROUTER_BASE_URL ||
      "https://openrouter.ai/api/v1";
    this.timeout = timeout;
    this.retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };

    if (!this.apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY must be provided or set in environment"
      );
    }
  }

  async createCompletion(
    model: string,
    messages: OpenRouterRequest["messages"],
    temperature: number = 0.7,
    maxTokens: number = 2000,
    additionalParams: Partial<OpenRouterRequest> = {}
  ): Promise<OpenRouterResponse> {
    const request: OpenRouterRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...additionalParams,
    };

    return this.executeWithRetry(request);
  }

  private async executeWithRetry(
    request: OpenRouterRequest,
    attempt: number = 0
  ): Promise<OpenRouterResponse> {
    const startTime = Date.now();

    try {
      console.log(
        `[OpenRouter] API call: model=${request.model}, max_tokens=${request.max_tokens}, temp=${request.temperature}`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/your-project/rag-refresh-factory",
          "X-Title": "RAG Refresh Product Factory",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle specific error statuses
      if (response.status === 401) {
        console.error("[OpenRouter] Authentication failed: Invalid API key");
        throw new AuthenticationError();
      }

      if (response.status === 429) {
        console.warn(
          `[OpenRouter] Rate limit exceeded (attempt ${attempt + 1}/${this.retryOptions.maxRetries})`
        );

        if (attempt < this.retryOptions.maxRetries) {
          await this.sleep(this.getRetryDelay(attempt));
          return this.executeWithRetry(request, attempt + 1);
        }

        throw new RateLimitError();
      }

      // Handle 5xx server errors with retry
      if (response.status >= 500 && response.status < 600) {
        console.warn(
          `[OpenRouter] Server error ${response.status} (attempt ${attempt + 1}/${this.retryOptions.maxRetries})`
        );

        if (attempt < this.retryOptions.maxRetries) {
          await this.sleep(this.getRetryDelay(attempt));
          return this.executeWithRetry(request, attempt + 1);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new OpenRouterError(
          `API error ${response.status}: ${errorText.substring(0, 200)}`
        );
      }

      const result: OpenRouterResponse = await response.json();
      const latencyMs = Date.now() - startTime;

      // Add latency to result
      result._latencyMs = latencyMs;

      const usage = result.usage;
      console.log(
        `[OpenRouter] Response: ${usage.total_tokens} tokens, ${latencyMs}ms latency`
      );

      return result;
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      if (error instanceof AuthenticationError || error instanceof RateLimitError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        console.error(`[OpenRouter] Request timeout after ${this.timeout}ms`);

        if (attempt < this.retryOptions.maxRetries) {
          console.log(`Retrying (attempt ${attempt + 2}/${this.retryOptions.maxRetries + 1})...`);
          await this.sleep(this.getRetryDelay(attempt));
          return this.executeWithRetry(request, attempt + 1);
        }

        throw new OpenRouterError(`Request timeout after ${this.timeout}ms`);
      }

      console.error(
        `[OpenRouter] Request failed (${latencyMs}ms):`,
        error instanceof Error ? error.message : String(error)
      );

      throw new OpenRouterError(
        `Request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.retryOptions.initialDelayMs *
        Math.pow(this.retryOptions.backoffMultiplier, attempt),
      this.retryOptions.maxDelayMs
    );
    return delay;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  estimateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
    pricing: ModelPricing
  ): number {
    const promptCost = (promptTokens / 1_000_000) * pricing.inputCostPerMillion;
    const completionCost =
      (completionTokens / 1_000_000) * pricing.outputCostPerMillion;
    return promptCost + completionCost;
  }

  getModelPricing(
    modelId: string,
    costDatabase: any
  ): ModelPricing | null {
    // Search all tiers for this model
    const tiers = costDatabase.tiers || {};

    for (const tierName of Object.keys(tiers)) {
      const tierData = tiers[tierName];
      const models = tierData.models || [];

      for (const modelInfo of models) {
        if (modelInfo.id === modelId) {
          return {
            modelId,
            inputCostPerMillion: modelInfo.input_cost,
            outputCostPerMillion: modelInfo.output_cost,
            contextWindow: modelInfo.context_window,
          };
        }
      }
    }

    return null;
  }
}

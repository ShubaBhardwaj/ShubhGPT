import OpenAI from "openai";
import type { AssistantStream } from "openai/lib/AssistantStream";
import type { Channel, StreamChat, Event, MessageResponse } from "stream-chat";
import axios from "axios";

export class OpenAIResponseHandler {
  private message_text = "";
  private chunk_count = 0;
  private run_id = "";
  private is_done = false;
  private last_update_time = 0;

  constructor(
    private readonly openai: OpenAI,
    private readonly openAIThread: OpenAI.Beta.Threads.Thread,
    private readonly assistantStream: AssistantStream,
    private readonly chatClient: StreamChat,
    private readonly channel: Channel,
    private readonly messageResponse: MessageResponse,
    private readonly onDispose: () => void,
  ) {
    this.chatClient.on("ai_indicator.stop", this.handleStopGeneration);
  }

  private handleStopGeneration = async (event: Event) => {
    if (this.is_done || event.message_id !== this.messageResponse.id) {
      return;
    }
    console.log(`Stopping generation for message ${event.message_id}`);
    if (!this.openAIThread || !this.run_id || !this.openai) {
      return;
    }
    try {
      await this.openai.beta.threads.runs.cancel(this.run_id, {
        thread_id: this.openAIThread.id,
      });
    } catch (error) {
      console.error(`Failed to cancel run ${this.run_id}:`, error);
    }

    await this.channel.sendEvent({
      type: "ai_indicator.clear",
      cid: this.messageResponse.cid,
      message_id: this.messageResponse.id,
    });

    await this.dispose();
  };

  private handleStreamEvent = async (
    event: OpenAI.Beta.Assistants.AssistantStreamEvent,
  ) => {
    const { cid, id } = this.messageResponse;

    if (event.event === "thread.run.created") {
      this.run_id = event.data.id;
    } else if (event.event === "thread.message.delta") {
      const textDelta = event.data.delta.content?.[0];
      if (textDelta && textDelta.type === "text") {
        this.messageResponse.text += textDelta.text?.value || "";
        const now = Date.now();
        if (now - this.last_update_time > 100) {
          this.chatClient.partialUpdateMessage(this.messageResponse.id, {
            set: { text: this.messageResponse.text },
          }).catch(() => {});
          this.last_update_time = now;
        }
        this.chunk_count += 1;
      }
    } else if (event.event === "thread.message.completed") {
      const completedText =
        event.data.content?.[0]?.type === "text"
          ? event.data.content[0].text?.value
          : undefined;

      if (completedText) {
        this.messageResponse.text = completedText;
      }

      await this.chatClient.partialUpdateMessage(this.messageResponse.id, {
        set: { text: this.messageResponse.text },
      }).catch(() => {});

      await this.channel.sendEvent({
        type: "ai_indicator.clear",
        cid: cid,
        message_id: id,
      });
    } else if (event.event === "thread.run.step.created") {
      if (event.data.step_details.type === "message_creation") {
        await this.channel.sendEvent({
          type: "ai_indicator.update",
          ai_state: "AI_STATE_GENERATING",
          cid: cid,
          message_id: id,
        });
      }
    }
  };

  private handleError = async (error: Error) => {
    if (this.is_done) {
      return;
    }
    await this.channel.sendEvent({
      type: "ai_indicator.update",
      ai_state: "AI_STATE_ERROR",
      cid: this.channel.cid,
      message_id: this.messageResponse.id,
    });

    await this.chatClient.partialUpdateMessage(this.messageResponse.id, {
      set: {
        text:
          error.message ?? "An error occurred while generating the response.",
        message: error.toString(),
      },
    }).catch(() => {});

    await this.dispose();
  };

  private performWebSearch = async (query: string): Promise<string> => {
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";

    if (!TAVILY_API_KEY) {
      throw new Error(
        "TAVILY_API_KEY must be set in the environment variables.",
      );
    }

    console.log(`Performing web search for query: ${query}`);

    try {
      const response = await axios.post(
        "https://api.tavily.com/search",
        {
          query: query,
          search_depth: "advanced",
          max_results: 5,
          include_answer: true,
          include_raw_content: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TAVILY_API_KEY}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error("Failed to perform web search.");
      }

      const data = await response.data;
      console.log(`Web search successful for query "${query}"`);
      const jsonData = JSON.stringify(data);
      return jsonData;
    } catch (error: any) {
      console.error(
        `Tavily search failed for query "${query}":`,
        error.response?.data || error.message,
      );

      return JSON.stringify({
        error: `Search failed with status: ${error.response?.status ?? "Unknown"}`,
        details: error.response?.data || error.message,
      });
    }
  };

  private consumeStream = async (stream: AssistantStream) => {
    for await (const event of stream) {
      await this.handleStreamEvent(event);

      if (
        event.event === "thread.run.requires_action" &&
        event.data.required_action?.type === "submit_tool_outputs"
      ) {
        this.run_id = event.data.id;

        await this.channel.sendEvent({
          type: "ai_indicator.update",
          ai_state: "AI_STATE_EXTERNAL_SOURCES",
          cid: this.channel.cid,
          message_id: this.messageResponse.id,
        });

        const toolCalls =
          event.data.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs: any[] = [];

        for (const toolCall of toolCalls) {
          if (toolCall.function.name === "web_search") {
            try {
              const args = JSON.parse(toolCall.function.arguments || "{}");
              const searchResults = await this.performWebSearch(args.query || "");
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: searchResults,
              });
            } catch (error: any) {
              console.error(
                `Failed to perform web search for tool call "${toolCall.id}":`,
                error,
              );
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({
                  error: "Failed to perform web search.",
                  details: error.message,
                }),
              });
            }
          }
        }

        if (toolOutputs.length > 0) {
          const nextStream =
            this.openai.beta.threads.runs.submitToolOutputsStream(
              this.run_id,
              {
                thread_id: this.openAIThread.id,
                tool_outputs: toolOutputs,
              },
            );
          await this.consumeStream(nextStream);
          return;
        }
      }

      if (event.event === "thread.run.completed") {
        this.is_done = true;
        if (this.messageResponse.text) {
          await this.chatClient.partialUpdateMessage(this.messageResponse.id, {
            set: { text: this.messageResponse.text },
          }).catch(() => {});
        }
        await this.channel.sendEvent({
          type: "ai_indicator.clear",
          cid: this.messageResponse.cid,
          message_id: this.messageResponse.id,
        });
        await this.dispose();
        return;
      }

      if (event.event === "thread.run.failed") {
        this.is_done = true;
        await this.handleError(
          new Error(
            event.data.last_error?.message ??
              "Run failed without a specific error message.",
          ),
        );
        return;
      }
    }
  };

  run = async () => {
    try {
      await this.consumeStream(this.assistantStream);
    } catch (error: any) {
      console.error(
        "Error occurred while running the assistant stream:",
        error,
      );
      await this.handleError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  };

  dispose = async () => {
    if (this.is_done) {
      return;
    }

    this.is_done = true;
    this.chatClient.off("ai_indicator.stop", this.handleStopGeneration);
    this.onDispose();
  };
}

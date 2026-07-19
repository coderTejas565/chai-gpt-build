import { tool } from "ai";
import { z } from "zod";

type TavilyResult = {
  title: string;
  url: string;
  content: string;
};

type TavilyResponse = {
  results: TavilyResult[];
};

export const webSearch = tool({
  description:
    "Search the web for current information when the user asks about recent events, latest updates, or information outside your knowledge.",

  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),

  

  execute: async ({ query }) => {
    
    if (!process.env.TAVILY_API_KEY) {
  throw new Error("Missing TAVILY_API_KEY");
}
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error("Web search failed");
    }

    const data: TavilyResponse = await response.json();

    return {
      query,
      results: data.results.map((item) => ({
        title: item.title,
        url: item.url,
        content: item.content,
      })),
    };
  },
});
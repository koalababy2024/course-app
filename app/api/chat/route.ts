import { createAzure } from '@ai-sdk/azure';
import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages, tool } from 'ai';
import { z } from 'zod';

const azure = createAzure(
    {
        resourceName: process.env.OPENAI_RESOURCE_NAME,
        apiKey: process.env.OPENAI_API_KEY
    }
)

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = await streamText({
        // model: openai('gpt-4-turbo'),
        model: azure('gpt-4o-mini'),
        messages: convertToCoreMessages(messages),
        tools: {
            weather: tool({
              description: 'Get the weather in a location (farenheit)',
              parameters: z.object({
                location: z.string().describe('The location to get the weather for'),
              }),
              execute: async ({ location }) => {
                const temperature = Math.round(Math.random() * (90 - 32) + 32);
                return {
                  location,
                  temperature,
                };
              },
            }),
            convertFarenheitToCelsius: tool({
                description: 'Convert a temperature in farenheit to celsius',
                parameters: z.object({
                  temperature: z
                    .number()
                    .describe('The temperature in farenheit to convert'),
                }),
                execute: async ({ temperature }) => {
                  const celsius = Math.round((temperature - 32) * (5 / 9));
                  return {
                    celsius,
                  };
                },
              })
          },
    });

    return result.toDataStreamResponse();
}




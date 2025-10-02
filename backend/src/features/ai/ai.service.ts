import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

@Injectable()
export class AiService {
  private client: OpenAI;
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // this.numberResponse(
    //   'you are a number bot.',
    //   'Give a number between 1 and 100',
    // );
  }

  /**
   * Simple text answers from chatgpt
   * @param instructions 'You are a coding assistant that talks like a pirate'
   * @param input 'Are semicolons optional in JavaScript?'
   * @returns string or undefined
   */
  async textResponse(
    instructions: string,
    input: string,
  ): Promise<string | undefined> {
    const response = await this.client.responses.create({
      model: 'gpt-4o-2024-08-06',
      instructions,
      input,
    });
    if (response.output_text) {
      return response.output_text;
    }
  }

  async numberResponse(
    instructions: string,
    input: string,
  ): Promise<number | undefined> {
    const answer = z.object({
      answer: z.number(),
    });

    const response = await this.client.responses.parse({
      model: 'gpt-4o',
      input: [
        { role: 'system', content: instructions },
        {
          role: 'user',
          content: input,
        },
      ],
      text: {
        format: zodTextFormat(answer, 'answer'),
      },
    });

    const answerData = response.output_parsed as z.infer<typeof answer>;
    if (answerData?.answer) {
      return answerData.answer;
    }
    return;
  }

  async categoryNumberResponse(
    categories: string,
    input: string,
  ): Promise<{ id: number }[] | undefined> {
    const answer = z.object({
      categories: z.array(
        z.object({
          id: z.number(),
        }),
      ),
    });

    const response = await this.client.responses.parse({
      model: 'gpt-4o',
      input: [
        {
          role: 'system',
          content:
            'Du bist eine AI, die für den folgenden Nutzerinput die passenden Kategorie-Ids heraussucht.',
        },
        { role: 'developer', content: categories },
        {
          role: 'user',
          content: input,
        },
      ],
      text: {
        format: zodTextFormat(answer, 'answer'),
      },
    });

    const answerData = response.output_parsed as z.infer<typeof answer>;
    if (answerData?.categories) {
      return answerData.categories;
    }
    return;
  }
}

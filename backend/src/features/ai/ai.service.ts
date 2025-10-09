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
    input?: string,
  ): Promise<string | undefined> {
    const answer = z.object({
      answer: z.string(),
    });

    const response = await this.client.responses.parse({
      model: 'gpt-4o',
      input: [
        { role: 'system', content: instructions },
        ...(input ? [{ role: 'user' as const, content: input }] : []),
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

  async sortTagsInExistingAndNew(
    productName: string,
    productDescription: string,
    existingTags: string,
  ) {
    const answer = z.object({
      existingTags: z.array(
        z.object({
          id: z.number(),
        }),
      ),
      newTags: z.array(
        z.object({
          name: z.string(),
        }),
      ),
    });

    const response = await this.client.responses.parse({
      model: 'gpt-4o',
      input: [
        {
          role: 'system',
          content:
            'Du bist eine AI, die Produkt-tags (Schlagwörter) von WooCommerce heraussucht und bestimmt. Dafür bekommst du im Folgenden den Produktnamen und die Beschreibung sowie eine Liste an existierenden Tags (Schlagwörtern). Wenn möglich, suche aus der Liste existierender Tags passende Schlagwörter heraus und liste diese unter "existingTags" mit deren ID. Falls diese nicht ausreichen oder keine passenden Schlagwörter verfügbar sind, dann liste neue, benötigte Schlagwärter unter "newTags", wobei dort der Name der neuen Tags genannt werden. Es sollen zwischen 1 bis 4 Schlagwörter bestimmt werden. Das kann auch eine Mischung aus existierenden und neuen Tags sein.',
        },
        {
          role: 'developer',
          content: `
          Name: ${productName}
          Beschreibung: ${productDescription}`,
        },
        {
          role: 'user',
          content: `existierende Tags: ${existingTags}`,
        },
      ],
      text: {
        format: zodTextFormat(answer, 'answer'),
      },
    });

    const answerData = response.output_parsed as z.infer<typeof answer>;
    if (answerData) {
      return answerData;
    }
    return;
  }
}

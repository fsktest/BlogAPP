// 'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting tags for a blog post based on its content.
 *
 * - suggestTags - A function that takes blog post content as input and returns a list of suggested tags.
 * - SuggestTagsInput - The input type for the suggestTags function, containing the blog post content.
 * - SuggestTagsOutput - The output type for the suggestTags function, containing an array of suggested tags.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTagsInputSchema = z.object({
  content: z
    .string()
    .describe('The content of the blog post for which tags are to be suggested.'),
});
export type SuggestTagsInput = z.infer<typeof SuggestTagsInputSchema>;

const SuggestTagsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of suggested tags for the blog post content.'),
});
export type SuggestTagsOutput = z.infer<typeof SuggestTagsOutputSchema>;

export async function suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput> {
  return suggestTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: {schema: SuggestTagsInputSchema},
  output: {schema: SuggestTagsOutputSchema},
  prompt: `You are a helpful assistant that suggests tags for blog posts.

  Given the content of a blog post, suggest a list of relevant tags that can be used to improve its discoverability.
  Return the tags as a JSON array of strings.

  Content: {{{content}}}`,
});

const suggestTagsFlow = ai.defineFlow(
  {
    name: 'suggestTagsFlow',
    inputSchema: SuggestTagsInputSchema,
    outputSchema: SuggestTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

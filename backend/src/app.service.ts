import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { ChatOpenAI } from '@langchain/openai';

interface DocumentChunk {
  pageContent: string;
  metadata: Record<string, any>;
}

@Injectable()
export class AppService {
  private createDocumentChunks(text: string, chunkSize = 1000, chunkOverlap = 200) {
    const normalizedText = text.replace(/\s+/g, ' ').trim();
    const chunks: DocumentChunk[] = [];
    let start = 0;

    while (start < normalizedText.length) {
      let end = Math.min(start + chunkSize, normalizedText.length);
      if (end < normalizedText.length) {
        const lastSpace = normalizedText.lastIndexOf(' ', end);
        if (lastSpace > start) {
          end = lastSpace;
        }
      }

      const chunk = normalizedText.slice(start, end);
      chunks.push({ pageContent: chunk, metadata: {} });

      if (end >= normalizedText.length) {
        break;
      }

      start = Math.max(end - chunkOverlap, 0);
    }

    return chunks;
  }
  async processAndIngestPdf(fileBuffer: Buffer) {
    try {
      const openAIApiKey = process.env.OPENAI_API_KEY;
      const pineconeApiKey = process.env.PINECONE_API_KEY;
      const pineconeIndexName = process.env.PINECONE_INDEX ?? 'customer-support-index';

      if (!openAIApiKey) {
        throw new Error('Missing OPENAI_API_KEY environment variable');
      }
      if (!pineconeApiKey) {
        throw new Error('Missing PINECONE_API_KEY environment variable');
      }

      const parser = new PDFParse({ data: fileBuffer });
      const pdfData = await parser.getText();
      const rawText = typeof pdfData === 'string' ? pdfData : pdfData.text;

      const docs = this.createDocumentChunks(rawText, 1000, 200);

      const pineconeClient = new Pinecone({ apiKey: pineconeApiKey });
      const pineconeIndex = pineconeClient.Index(pineconeIndexName);

      const openAIConfig = {
        apiKey: openAIApiKey,
        baseURL: process.env.OPENAI_BASE_URL ?? 'https://free.openrouter.ai/v1',
      };

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey,
        model: 'text-embedding-3-small',
        configuration: openAIConfig,
      });

      await PineconeStore.fromDocuments(docs, embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
      });

      return {
        success: true,
        chunksProcessed: docs.length,
      };
    } catch (error) {
      console.error('Error during ingestion:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(`Failed to process and ingest PDF: ${message}`);
    }
  }

  async handleChat(userMessage: string) {
    try {
      const openAIApiKey = process.env.OPENAI_API_KEY;
      const pineconeApiKey = process.env.PINECONE_API_KEY;
      const pineconeIndexName = process.env.PINECONE_INDEX ?? 'customer-support-index';

      if (!openAIApiKey) {
        throw new Error('Missing OPENAI_API_KEY environment variable');
      }
      if (!pineconeApiKey) {
        throw new Error('Missing PINECONE_API_KEY environment variable');
      }

      const pineconeClient = new Pinecone({ apiKey: pineconeApiKey });
      const pineconeIndex = pineconeClient.Index(pineconeIndexName);

      const openAIConfig = {
        apiKey: openAIApiKey,
        baseURL: process.env.OPENAI_BASE_URL ?? 'https://free.openrouter.ai/v1',
      };

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey,
        model: 'text-embedding-3-small',
        configuration: openAIConfig,
      });

      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex });
      const results = await vectorStore.similaritySearch(userMessage, 3);

      const contextText = results.map(doc => doc.pageContent).join('\n\n');

      const llm = new ChatOpenAI({
        openAIApiKey,
        modelName: 'gpt-3.5-turbo',
        configuration: openAIConfig,
      });

      const prompt = `You are a helpful support bot. Use the following context to answer the user's question. Context: ${contextText}. Question: ${userMessage}.`;
      const aiResponse = await llm.invoke(prompt);

      return { answer: aiResponse.content };
    } catch (error) {
      console.error('Error during chat:', error);
      throw new InternalServerErrorException('Failed to generate response.');
    }
  }
}
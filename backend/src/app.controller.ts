import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('chat')
  async chat(@Body('message') message: string) {
    if (!message) {
      throw new BadRequestException('Message is required.');
    }
    return this.appService.handleChat(message);
  }
  
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) 
  async uploadPdf(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed.');
    }

    try {
      const result = await this.appService.processAndIngestPdf(file.buffer);

      return {
        message: 'PDF successfully uploaded and ingested into Pinecone.',
        status: 'success',
        result,
      };
    } catch (error:any) {
      throw new BadRequestException(`Failed to process PDF: ${error.message}`);
    }
  }
}
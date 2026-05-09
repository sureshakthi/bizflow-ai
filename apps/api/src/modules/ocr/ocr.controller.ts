import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('scan')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|bmp|tiff|webp)$/)) {
          cb(new BadRequestException('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async scan(
    @UploadedFile() file: Express.Multer.File,
    @Body('formType') formType: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const validTypes = ['patient_registration', 'prescription', 'lab_report', 'referral_letter'];
    if (!validTypes.includes(formType)) {
      throw new BadRequestException(
        `formType must be one of: ${validTypes.join(', ')}`,
      );
    }

    try {
      return await this.ocrService.extractText(file.buffer, formType);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'OCR processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface OcrResult {
  rawText: string;
  formType: string;
  fields: Record<string, string>;
  confidence: number;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly groqApiKey = process.env.GROQ_API_KEY || '';
  private readonly groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly groqModel = 'meta-llama/llama-4-scout-17b-16e-instruct';

  async extractText(
    imageBuffer: Buffer,
    formType: string,
  ): Promise<OcrResult> {
    this.logger.log(`Starting Groq Vision scan for form type: ${formType}`);

    const base64Image = imageBuffer.toString('base64');
    const mimeType = this.detectMime(imageBuffer);
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    this.logger.log(
      `Image: ${Math.round(base64Image.length / 1024)}KB base64`,
    );

    const prompt = this.buildPrompt(formType);
    const groqResponse = await this.callGroqVision(dataUri, prompt);

    const fields = this.parseGroqResponse(groqResponse, formType);
    fields['extractedText'] = groqResponse;

    return {
      rawText: groqResponse,
      formType,
      fields,
      confidence: Object.keys(fields).length > 3 ? 85 : 50,
    };
  }

  private async callGroqVision(
    dataUri: string,
    prompt: string,
  ): Promise<string> {
    this.logger.log('Calling Groq Vision API...');

    const axiosConfig: any = {
      headers: {
        Authorization: `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
      proxy: {
        host: 'proxy.cat.com',
        port: 80,
        protocol: 'http',
      },
    };
    this.logger.log('Using proxy proxy.cat.com:80');

    const payload = {
      model: this.groqModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    };

    try {
      const response = await axios.post(this.groqUrl, payload, axiosConfig);
      const text =
        response.data?.choices?.[0]?.message?.content?.trim() || '';
      this.logger.log(`Groq Vision response: ${text.length} chars`);
      this.logger.log(
        `Groq response preview: ${text.substring(0, 500)}`,
      );
      return text;
    } catch (error: any) {
      const status = error.response?.status;
      const errMsg =
        error.response?.data?.error?.message || error.message;
      this.logger.error(`Groq API error (${status}): ${errMsg}`);
      throw new Error(`Groq Vision failed: ${errMsg}`);
    }
  }

  private buildPrompt(formType: string): string {
    const fieldMap: Record<string, string[]> = {
      patient_registration: [
        'name',
        'phone',
        'dob',
        'age',
        'gender',
        'bloodGroup',
        'address',
        'aadhaar',
        'email',
        'emergencyContact',
        'emergencyContactName',
        'referredBy',
        'occupation',
        'maritalStatus',
        'allergies',
        'existingConditions',
        'insuranceProvider',
        'insurancePolicyNumber',
        'fatherOrHusbandName',
        'religion',
        'nationality',
      ],
      prescription: [
        'patientName',
        'patientAge',
        'patientGender',
        'doctorName',
        'date',
        'diagnosis',
        'vitals',
        'medicines',
        'notes',
        'followUp',
      ],
      lab_report: [
        'patientName',
        'patientAge',
        'patientGender',
        'testName',
        'date',
        'sampleCollectedDate',
        'labName',
        'referringDoctor',
        'sampleType',
        'impression',
      ],
      referral_letter: [
        'patientName',
        'patientAge',
        'referringDoctor',
        'referredTo',
        'date',
        'reason',
        'history',
        'currentMedications',
        'investigations',
        'urgency',
      ],
    };

    const fields = fieldMap[formType] || fieldMap['patient_registration'];

    return `You are an expert medical form reader. Extract ALL handwritten and printed text from this ${formType.replace(/_/g, ' ')} form image.

Return ONLY a valid JSON object with these exact keys: ${fields.map((f) => `"${f}"`).join(', ')}.

Rules:
- Read handwriting carefully, especially names, phone numbers, and addresses
- For phone numbers, extract exactly the digits written (Indian 10-digit format)
- For dates, use YYYY-MM-DD format
- For gender, use "Male" or "Female"
- For marital status, use "Married", "Single", "Divorced", or "Widowed"
- If a field is not visible or not filled, use empty string ""
- Do NOT wrap in markdown code blocks, return raw JSON only
- Be very careful with handwritten names - read each letter precisely`;
  }

  private parseGroqResponse(
    response: string,
    _formType: string,
  ): Record<string, string> {
    // Strip markdown code fences if present
    let cleaned = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Try to find JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      this.logger.warn('No JSON found in Groq response');
      return { rawResponse: response };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const result: Record<string, string> = {};

      for (const [key, value] of Object.entries(parsed)) {
        if (value !== null && value !== undefined && String(value).trim()) {
          result[key] = String(value).trim();
        }
      }

      // Post-process phone numbers
      if (result['phone']) {
        const digits = result['phone'].replace(/\D/g, '');
        if (digits.length >= 10) {
          result['phone'] = digits.slice(-10);
        }
      }
      if (result['emergencyContact']) {
        const digits = result['emergencyContact'].replace(/\D/g, '');
        if (digits.length >= 10) {
          result['emergencyContact'] = digits.slice(-10);
        }
      }

      // Clean email
      if (result['email']) {
        result['email'] = result['email'].replace(/\s+/g, '');
      }

      this.logger.log(
        `Parsed fields: ${JSON.stringify(result).substring(0, 500)}`,
      );
      return result;
    } catch (err) {
      this.logger.warn(`JSON parse error: ${err}`);
      return { rawResponse: response };
    }
  }

  private detectMime(buffer: Buffer): string {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    )
      return 'image/png';
    if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) return 'image/bmp';
    return 'image/jpeg';
  }
}

import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
    delete process.env.OPENAI_BASE_URL;
  });

  it('uses the OpenRouter API endpoint by default', () => {
    const config = (service as any).getOpenAIConfiguration('test-key');

    expect(config.apiKey).toBe('test-key');
    expect(config.baseURL).toBe('https://openrouter.ai/api/v1');
  });
});

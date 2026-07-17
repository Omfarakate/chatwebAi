import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv() {
  const envPath = resolve(__dirname, '../.env');
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const [key, ...rest] = trimmed.split('=');
    if (!key) {
      continue;
    }

    const value = rest.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3002',
  });
  app.enableCors({
  origin: 'https://chatweb-n9md01m1p-omfarakates-projects.vercel.app', // <-- Paste your EXACT Vercel URL here
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

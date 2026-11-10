import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAIConfig, saveAIConfig } from "@/lib/settings";

export async function GET() {
  const { baseURL, model } = getAIConfig();
  return NextResponse.json({
    configured: Boolean(getAIConfig().apiKey),
    baseUrl: baseURL,
    model,
  });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };

  saveAIConfig({
    apiKey: body.apiKey?.trim() || undefined,
    baseURL: body.baseUrl?.trim() || undefined,
    model: body.model?.trim() || undefined,
  });

  const { apiKey, baseURL, model } = getAIConfig();
  return NextResponse.json({ configured: Boolean(apiKey), baseUrl: baseURL, model });
}

export async function POST() {
  const { apiKey, baseURL, model } = getAIConfig();
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "No API key configured." }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey, baseURL });
    await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Reply with OK." }],
      max_tokens: 5,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

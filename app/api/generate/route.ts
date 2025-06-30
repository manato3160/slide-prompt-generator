import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log("\n--- [バックエンド] APIリクエスト受信 ---");

  try {
    const body = await request.json();
    console.log("[バックエンド] フロントエンドから受信した生データ:", JSON.stringify(body, null, 2));

    const { query, conversation_id, ...inputs } = body;

    // --- 必須項目の存在チェック ---
    const requiredKeys = [
      'slideTheme', 'audience', 'purpose', 'keyMessage', 
      'slideCount', 'designStyle', 'tone', 'fontStyle', 
      'mainColor', 'subColor'
    ];

    for (const key of requiredKeys) {
      if (!inputs[key]) {
        const errorMessage = `[バックエンド] エラー: 必須項目 '${key}' がリクエストに含まれていません。`;
        console.error(errorMessage);
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 400 });
      }
    }
    console.log("[バックエンド] 必須項目のチェック完了。問題ありません。");

    const DIFY_API_URL = process.env.DIFY_API_URL;
    const DIFY_API_KEY = process.env.DIFY_API_KEY;

    if (!DIFY_API_URL || !DIFY_API_KEY) {
      console.error("[バックエンド] エラー: .env.localのURLまたはキーが設定されていません。");
      return new NextResponse(JSON.stringify({ error: 'サーバー設定エラー' }), { status: 500 });
    }

    // Difyへのリクエストボディを作成
    const difyRequestBody = {
      inputs: inputs,
      query: query ? query : "プロンプト生成",
      response_mode: "blocking",
      user: "slide-prompt-generator-user-1",
      conversation_id: conversation_id || ""
    };

    console.log("[バックエンド] Difyへ送信するデータ:", JSON.stringify(difyRequestBody, null, 2));

    const endpoint = `${DIFY_API_URL}/chat-messages`;

    const difyResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(difyRequestBody),
    });

    const responseText = await difyResponse.text();

    if (!difyResponse.ok) {
      console.error(`[バックエンド] Dify APIエラー: Status ${difyResponse.status}`);
      console.error("[バックエンド] Difyからの応答:", responseText);
      return new NextResponse(JSON.stringify({ 
        error: 'Dify APIからのエラーです。', 
        details: responseText 
      }), { status: difyResponse.status });
    }

    console.log("[バックエンド] Difyから正常な応答を受信しました。");
    const data = JSON.parse(responseText);
    console.log("[バックエンド] フロントエンドへ返すパース済みデータ:", data);
    return NextResponse.json(data);

  } catch (error) {
    console.error("[バックエンド] 予期せぬエラー:", error);
    return new NextResponse(JSON.stringify({ error: 'サーバー内部で予期せぬエラーが発生しました。' }), { status: 500 });
  }
}
window.onload = async function () {
  // ★CloudflareのAPIエンドポイント（WorkerのURL等）を指定してください
  const CLOUDFLARE_API_URL = "https://mypage.kadowaki-universal-prime.workers.dev/";

  try {
    // 1. LIFFの初期化 (※別のページとして独立させる場合、新しいLIFF IDに書き換えてください)
    await liff.init({ liffId: "2009827198-1tNPTxFt" });

    // 2. ログインチェック
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // 3. ユーザー情報の取得 (Lark側の検索キーとしてLINE UserIDを使う場合)
    const profile = await liff.getProfile();
    const userId = profile.userId;

    // 4. Cloudflare(Anycross経由)からLarkのデータを取得して表示
    fetchLarkData(userId, CLOUDFLARE_API_URL);

  } catch (err) {
    console.error("LIFF Init Error:", err);
    alert("初期化エラーが発生しました");
  }
};

// === Larkのデータを取得する関数 ===
async function fetchLarkData(userId, apiUrl) {
  const contentElement = document.getElementById("lark-data-content");

  try {
    const response = await fetch(`${apiUrl}?userId=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    // データの取得
    const nqcId = data?.["Neo Quick Call"]?.value?.[0]?.text;
    const nqcPw = data?.["Neo Quick Call PW"]?.value?.[0]?.text;

    if (nqcId || nqcPw) {
      // 読み込み中のセンタリングを解除
      contentElement.style.textAlign = "left"; 
      
      // シンプルな横並びのリスト風デザイン
      contentElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
          <span style="font-size: 12px; color: #888; letter-spacing: 0.5px;">ID</span>
          <strong style="font-size: 16px; color: #111; user-select: all; letter-spacing: 0.5px;">${nqcId || "未登録"}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px;">
          <span style="font-size: 12px; color: #888; letter-spacing: 0.5px;">Password</span>
          <strong style="font-size: 16px; color: #111; user-select: all; letter-spacing: 0.5px;">${nqcPw || "未登録"}</strong>
        </div>
      `;
    } else {
      contentElement.innerHTML = `
        <p style="color: #d9534f; font-size: 13px; font-weight: bold; margin-bottom: 4px;">データ構造が一致しませんでした</p>
        <p style="font-size: 11px; margin-bottom: 8px;">以下の生データを確認してください：</p>
        <div style="background:#eee; padding:8px; font-size:11px; word-break:break-all; max-height:200px; overflow-y:auto; border-radius:4px;">
          ${JSON.stringify(data)}
        </div>
      `;
    }

  } catch (error) {
    console.error("Fetch Data Error:", error);
    contentElement.style.color = "red";
    contentElement.innerHTML = `<p>データの取得に失敗しました。</p>`;
  }
}
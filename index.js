// 取得したLarkのデータを一時保存する変数
let cachedLarkData = null;

window.onload = async function () {
  // Cloudflare（Worker等）のAPIエンドポイント
  const CLOUDFLARE_API_URL = "https://mypage.kadowaki-universal-prime.workers.dev/";

  // ボタンのクリックイベントを先に設定
  setupButtonListeners();

  try {
    // 1. LIFFの初期化
    await liff.init({ liffId: "2009827198-CXcOChHP" });

    // 2. ログインチェック
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // 3. ユーザー情報の取得 (Lark側の検索キーとしてLINE UserIDを使用)
    const profile = await liff.getProfile();
    const userId = profile.userId;

    // 4. Cloudflare経由でAnycross(Lark)からデータを取得
    await fetchLarkData(userId, CLOUDFLARE_API_URL);

  } catch (err) {
    console.error("LIFF Init Error:", err);
    alert("初期化エラーが発生しました");
  }
};

// === Larkのデータを取得する関数 ===
async function fetchLarkData(userId, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}?userId=${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    // 取得したデータをグローバル変数に保存（ボタンクリック時に使い回すため）
    cachedLarkData = await response.json();

    // アカウント情報の描画（引数：描画先のID, データ, IDの列名, PWの列名）
    renderAccountInfo("nqc-data-content", "Neo Quick Call", "Neo Quick Call PW");
    
    // ※Lark上のSCCの列名に合わせて "SCC", "SCC PW" の部分を変更してください
    renderAccountInfo("scc-data-content", "SCC", "SCC PW");

  } catch (error) {
    console.error("Fetch Data Error:", error);
    document.getElementById("nqc-data-content").innerHTML = `<span class="error-text">データの取得に失敗しました。</span>`;
    document.getElementById("scc-data-content").innerHTML = `<span class="error-text">データの取得に失敗しました。</span>`;
  }
}

// === アカウント情報をHTMLに描画する共通関数 ===
function renderAccountInfo(elementId, idKey, pwKey) {
  const contentElement = document.getElementById(elementId);
  const data = cachedLarkData;

  // Anycross経由で返ってくるデータ構造から値を取得
  const accountId = data?.[idKey]?.value?.[0]?.text;
  const accountPw = data?.[pwKey]?.value?.[0]?.text;

  if (accountId || accountPw) {
    // 取得成功時、中央揃えを解除するためのクラスを追加
    contentElement.classList.add("loaded");
    
    // CSSクラスを使ったHTML構造を挿入
    contentElement.innerHTML = `
      <div class="account-row account-row-first">
        <span class="account-label">ID</span>
        <strong class="account-value">${accountId || "未登録"}</strong>
      </div>
      <div class="account-row account-row-second">
        <span class="account-label">Password</span>
        <strong class="account-value">${accountPw || "未登録"}</strong>
      </div>
    `;
  } else {
    // データがない場合の表示
    contentElement.innerHTML = `情報が登録されていません`;
  }
}

// === ボタンのクリックイベントを設定する関数 ===
function setupButtonListeners() {
  document.getElementById("btn-rule").addEventListener("click", () => {
    // ※Lark上の列名に合わせて "打刻・シフトルール" を変更してください
    showDetails("打刻・シフトルール", "打刻・シフトルール");
  });

  document.getElementById("btn-salary").addEventListener("click", () => {
    // ※Lark上の列名に合わせて "給与条件" を変更してください
    showDetails("給与条件", "給与条件");
  });
}

// === 詳細情報を表示する関数 ===
function showDetails(title, dataKey) {
  const container = document.getElementById("details-container");
  const titleEl = document.getElementById("details-title");
  const contentEl = document.getElementById("details-content");

  // エリアを表示状態にする
  container.style.display = "block";
  titleEl.textContent = title;

  // データがまだ取得できていない場合のフェイルセーフ
  if (!cachedLarkData) {
    contentEl.innerHTML = `<span class="error-text">まだデータを読み込んでいます。数秒後にお試しください。</span>`;
    return;
  }

  // Larkのデータを取得
  const textValue = cachedLarkData?.[dataKey]?.value?.[0]?.text;

  if (textValue) {
    // 改行コード(\n)をHTMLの改行(<br>)に変換して表示
    contentEl.innerHTML = textValue.replace(/\n/g, "<br>");
  } else {
    contentEl.innerHTML = `<span style="color:#999;">情報が登録されていません。</span>`;
  }
}
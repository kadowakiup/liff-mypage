let cachedLarkData = null;

window.onload = async function () {
  const CLOUDFLARE_API_URL = "https://mypage.kadowaki-universal-prime.workers.dev/";
  setupButtonListeners();

  try {
    await liff.init({ liffId: "2009827198-CXcOChHP" });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const userId = profile.userId;

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

    cachedLarkData = await response.json();

    // ID/PWの描画関数を呼び出し
    renderAccountInfo("nqc-data-content", "Neo Quick Call", "Neo Quick Call PW");

  } catch (error) {
    console.error("Fetch Data Error:", error);
    document.getElementById("nqc-data-content").innerHTML = `<span class="error-text">データの取得に失敗しました。</span>`;
  }
}

// === アカウント情報をHTMLに描画する共通関数 ===
function renderAccountInfo(elementId, idKey, pwKey) {
  const contentElement = document.getElementById(elementId);
  const data = cachedLarkData;

  // 新しいJSON構造に合わせてアクセスパスを変更 (data.body["ID/PW"] の下)
  const idPwData = data?.["ID/PW"];
  const accountId = idPwData?.[idKey]?.value?.[0]?.text;
  const accountPw = idPwData?.[pwKey]?.value?.[0]?.text;

  if (accountId || accountPw) {
    contentElement.classList.add("loaded");
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
    // 該当HTML要素が存在する場合は表示
    if (contentElement) {
      contentElement.innerHTML = `情報が登録されていません`;
    }
  }
}

// === ボタンのクリックイベントを設定する関数 ===
function setupButtonListeners() {
  // Anycrossの新しいキー名に合わせて引数を変更
  document.getElementById("btn-rule").addEventListener("click", () => {
    openLinkDirectly("今月分ルール");
  });

  document.getElementById("btn-salary").addEventListener("click", () => {
    openLinkDirectly("今月分給与条件");
  });
}

// === 直接リンクを開く（無い・開けない場合はポップアップを出す）関数 ===
function openLinkDirectly(dataKey) {
  if (!cachedLarkData || !cachedLarkData.body) {
    alert("データを読み込んでいます。数秒待ってから再度タップしてください。");
    return;
  }

  // 新しいJSON構造に合わせて、URLが直接文字列で入っているものを取得
  const targetUrl = cachedLarkData.body[dataKey];

  if (targetUrl && typeof targetUrl === "string" && targetUrl.match(/^https?:\/\//)) {
    // ★ 安全装置：LarkのAPI用URL（PDFの残骸など）の場合は画面遷移させず、ポップアップを出す
    if (targetUrl.includes("open.larksuite.com/open-apis/")) {
      alert(`【エラー】\n${dataKey} に直接開けないファイル形式（PDF等）が設定されているか、過去のデータが残っています。\nLark側で「Googleドライブ等の共有リンク」に書き直してください。`);
      return;
    }

    // 正常なURLであれば開く
    if (liff.isInClient()) {
      liff.openWindow({ url: targetUrl, external: false });
    } else {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  } else {
    alert(`${dataKey} に有効なURL（リンク）が登録されていません。`);
  }
}
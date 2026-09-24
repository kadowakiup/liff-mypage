let cachedLarkData = null;

window.onload = async function () {
  const CLOUDFLARE_API_URL = "https://mypage.kadowaki-universal-prime.workers.dev/";
  
  // イベントリスナーをセット
  setupButtonListeners();

  try {
    await liff.init({ liffId: "2009827198-CXcOChHP" });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const userId = profile.userId;

    // データ取得
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

    // ID/PWの描画関数を呼び出し（HTMLに <div id="nqc-data-content"> が残っている場合用）
    renderAccountInfo("nqc-data-content", "Neo Quick Call", "Neo Quick Call PW");

  } catch (error) {
    console.error("Fetch Data Error:", error);
    const nqcContent = document.getElementById("nqc-data-content");
    if (nqcContent) {
      nqcContent.innerHTML = `<span class="error-text">データの取得に失敗しました。</span>`;
    }
  }
}

// === アカウント情報をHTMLに描画する共通関数 ===
function renderAccountInfo(elementId, idKey, pwKey) {
  const contentElement = document.getElementById(elementId);
  if (!contentElement) return; // HTMLに要素がない場合はスキップ

  const data = cachedLarkData;
  const idPwData = data?.body?.["ID/PW"];
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
    contentElement.innerHTML = `情報が登録されていません`;
  }
}

// === ボタンのクリックイベントを設定する関数 ===
function setupButtonListeners() {
  // 1. 打刻・シフトルール -> "今月分ルール"
  const btnRule = document.getElementById("btn-rule");
  if (btnRule) {
    btnRule.addEventListener("click", () => {
      openLinkDirectly("今月分ルール");
    });
  }

  // 2. 今月給与条件 -> "今月分給与条件"
  const btnSalaryCurrent = document.getElementById("btn-salary-current");
  if (btnSalaryCurrent) {
    btnSalaryCurrent.addEventListener("click", () => {
      openLinkDirectly("今月分給与条件");
    });
  }

  // 3. 先月給与条件 -> "先月分給与条件"
  const btnSalaryPrev = document.getElementById("btn-salary-prev");
  if (btnSalaryPrev) {
    btnSalaryPrev.addEventListener("click", () => {
      openLinkDirectly("先月分給与条件");
    });
  }
}

// === 直接リンクを開く（無い・開けない場合はポップアップを出す）関数 ===
function openLinkDirectly(dataKey) {
  if (!cachedLarkData || !cachedLarkData.body) {
    alert("データを読み込んでいます。数秒待ってから再度タップしてください。");
    return;
  }

  // Anycrossから受け取ったJSONのbody内にあるURLを取得
  const targetUrl = cachedLarkData.body[dataKey];

  if (targetUrl && typeof targetUrl === "string" && targetUrl.match(/^https?:\/\//)) {
    // ★ 安全装置：LarkのAPI用URL（PDFの残骸など）の場合は画面遷移させず、ポップアップを出す
    if (targetUrl.includes("open.larksuite.com/open-apis/")) {
      alert(`【エラー】\n${dataKey} に直接開けないファイル形式が設定されているか、過去のデータが残っています。\nLark側で「Googleドライブ等の共有リンク」に書き直してください。`);
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
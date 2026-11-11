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

    // データの描画関数を呼び出し
    renderApoEfficiency("apo-data-content", "月間アポ効率"); // ★追加
    renderAccountInfo("nqc-data-content", "Neo Quick Call", "Neo Quick Call PW");

  } catch (error) {
    console.error("Fetch Data Error:", error);
    
    // エラー時の表示処理
    const nqcContent = document.getElementById("nqc-data-content");
    if (nqcContent) nqcContent.innerHTML = `<span class="error-text">データの取得に失敗しました。</span>`;
    
    const apoContent = document.getElementById("apo-data-content");
    if (apoContent) apoContent.innerHTML = `<span class="error-text">データの取得に失敗しました。</span>`;
  }
}

// === ★追加：月間アポ効率をHTMLに描画する関数 ===
function renderApoEfficiency(elementId, dataKey) {
  const contentElement = document.getElementById(elementId);
  if (!contentElement) return;

  // Larkからのデータ構造のブレを吸収（直接の文字列、またはオブジェクトの配列）
  let val = cachedLarkData?.[dataKey];
  if (val && typeof val === 'object') {
    if (Array.isArray(val) && val[0]?.text) {
      val = val[0].text;
    } else if (val.value && Array.isArray(val.value) && val.value[0]?.text) {
      val = val.value[0].text;
    } else if (val.text) {
      val = val.text;
    }
  }

  if (val !== undefined && val !== null && val !== "") {
    contentElement.classList.add("loaded");
    contentElement.innerHTML = `
      <div class="account-row account-row-first">
        <span class="account-label">今月の効率</span>
        <strong class="account-value">${val}</strong>
      </div>
    `;
  } else {
    contentElement.innerHTML = `情報が登録されていません`;
  }
}

// === アカウント情報をHTMLに描画する共通関数 ===
function renderAccountInfo(elementId, idKey, pwKey) {
  const contentElement = document.getElementById(elementId);
  if (!contentElement) return; // HTMLに要素がない場合はスキップ

  const data = cachedLarkData;
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
    contentElement.innerHTML = `情報が登録されていません`;
  }
}

// === ボタンのクリックイベントを設定する関数 ===
function setupButtonListeners() {
  const btnRule = document.getElementById("btn-rule");
  if (btnRule) {
    btnRule.addEventListener("click", () => {
      openLinkDirectly("今月分ルール");
    });
  }

  const btnSalaryCurrent = document.getElementById("btn-salary-current");
  if (btnSalaryCurrent) {
    btnSalaryCurrent.addEventListener("click", () => {
      openLinkDirectly("今月分給与条件");
    });
  }

  const btnSalaryPrev = document.getElementById("btn-salary-prev");
  if (btnSalaryPrev) {
    btnSalaryPrev.addEventListener("click", () => {
      openLinkDirectly("先月分給与条件");
    });
  }
}

// === 直接リンクを開く（無い・開けない場合はポップアップを出す）関数 ===
function openLinkDirectly(dataKey) {
  if (!cachedLarkData) {
    alert("データを読み込んでいます。数秒待ってから再度タップしてください。");
    return;
  }

  const targetUrl = cachedLarkData[dataKey];

  if (targetUrl && typeof targetUrl === "string" && targetUrl.match(/^https?:\/\//)) {
    if (targetUrl.includes("open.larksuite.com/open-apis/")) {
      alert(`【エラー】\n${dataKey} に直接開けないファイル形式が設定されているか、過去のデータが残っています。\nLark側で「Googleドライブ等の共有リンク」に書き直してください。`);
      return;
    }

    if (liff.isInClient()) {
      liff.openWindow({ url: targetUrl, external: false });
    } else {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  } else {
    alert(`${dataKey} に有効なURL（リンク）が登録されていません。`);
  }
}
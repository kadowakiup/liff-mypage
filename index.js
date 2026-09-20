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

  const accountId = data?.[idKey]?.value?.[0]?.text;
  const accountPw = data?.[pwKey]?.value?.[0]?.text;

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
  document.getElementById("btn-rule").addEventListener("click", () => {
    openLinkDirectly("打刻・シフトルール");
  });

  document.getElementById("btn-salary").addEventListener("click", () => {
    openLinkDirectly("給与条件");
  });
}

// === 直接リンクを開く（無い・開けない場合はポップアップを出す）関数 ===
function openLinkDirectly(dataKey) {
  if (!cachedLarkData) {
    alert("データを読み込んでいます。数秒待ってから再度タップしてください。");
    return;
  }

  const targetData = cachedLarkData?.[dataKey];
  const valueArray = targetData?.value;

  if (valueArray && valueArray.length > 0) {
    const firstItem = valueArray[0];
    
    // Larkのテキスト列やリンク列に入っている情報を取得
    const textContent = firstItem.text || firstItem.link || firstItem.url || "";

    if (textContent) {
      // 取得した文字列の中からURL(http/httpsで始まる部分)を抽出する
      const urlMatch = textContent.match(/(https?:\/\/[^\s]+)/);
      
      if (urlMatch && urlMatch[1]) {
        const targetUrl = urlMatch[1];
        
        // ★ 安全装置：LarkのAPI用URL（PDFの残骸など）の場合は画面遷移させず、ポップアップを出す
        if (targetUrl.includes("open.larksuite.com/open-apis/")) {
          alert(`【エラー】\n${dataKey} に直接開けないファイル形式（PDF等）が設定されているか、過去のデータが残っています。\nLark側で「Googleドライブ等の共有リンク」に書き直してください。`);
          return;
        }

        // 正常なGoogle Drive等のURLであれば開く
        if (liff.isInClient()) {
          liff.openWindow({ url: targetUrl, external: false });
        } else {
          window.open(targetUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        // テキストは入っているが、URLが見つからなかった場合
        alert(`${dataKey} に有効なURL（リンク）が登録されていません。\n登録内容：${textContent}`);
      }
    } else {
      alert(`${dataKey} の情報が登録されていません。`);
    }
  } else {
    alert(`${dataKey} の情報が登録されていません。`);
  }
}
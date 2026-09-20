// 取得したLarkのデータを一時保存する変数
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
    showDetails("打刻・シフトルール", "打刻・シフトルール");
  });

  document.getElementById("btn-salary").addEventListener("click", () => {
    showDetails("給与条件", "給与条件");
  });
}

// === 詳細情報を表示する関数（URLの自動リンク化対応） ===
function showDetails(title, dataKey) {
  const container = document.getElementById("details-container");
  const titleEl = document.getElementById("details-title");
  const contentEl = document.getElementById("details-content");

  container.style.display = "block";
  titleEl.textContent = title;

  if (!cachedLarkData) {
    contentEl.innerHTML = `<span class="error-text">まだデータを読み込んでいます。数秒後にお試しください。</span>`;
    return;
  }

  // ターゲットのデータ（配列）を取得
  const targetData = cachedLarkData?.[dataKey];
  const valueArray = targetData?.value;

  if (valueArray && valueArray.length > 0) {
    const firstItem = valueArray[0];

    // ① Google Drive等のURLを「テキスト」として登録した場合の処理
    if (firstItem.text) {
      let textContent = firstItem.text;
      
      // テキストの中にURL(http or https)だけがポツンと貼られている場合、ボタン化する
      const urlRegex = /^(https?:\/\/[^\s]+)$/;
      if (urlRegex.test(textContent.trim())) {
        contentEl.innerHTML = `
          <div style="text-align: center; padding: 10px 0;">
            <a href="${textContent.trim()}" target="_blank" rel="noopener noreferrer" 
               style="display: inline-block; width: 100%; box-sizing: border-box; padding: 12px; background: #06c755; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center;">
              🔗 リンクを開く
            </a>
          </div>
        `;
      } else {
        // 文章とURLが混ざっている場合や、ただの文章の場合は、
        // URL部分だけを自動でクリック可能な青いリンクにしつつ、改行を適用する
        const autoLinkRegex = /(https?:\/\/[^\s]+)/g;
        let linkedText = textContent
          .replace(/</g, "&lt;") // セキュリティ対策
          .replace(/>/g, "&gt;")
          .replace(autoLinkRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline;">$1</a>');
        
        contentEl.innerHTML = linkedText.replace(/\n/g, "<br>");
      }
    } 
    else {
      contentEl.innerHTML = `<span style="color:#999;">表示できる形式のデータがありません。</span>`;
    }
  } else {
    contentEl.innerHTML = `<span style="color:#999;">情報が登録されていません。</span>`;
  }
}
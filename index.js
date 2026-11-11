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
    
    document.getElementById("display-name").textContent = profile.displayName;
    if (profile.pictureUrl) {
      document.getElementById("profile-img").src = profile.pictureUrl;
    }

    await fetchLarkData(userId, CLOUDFLARE_API_URL);

  } catch (err) {
    console.error("LIFF Init Error:", err);
    alert("初期化エラーが発生しました");
    hideLoading();
  }
};

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

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

    renderApoEfficiency("apo-data-content", "月間アポ効率", "apo-card");
    renderAccountInfo("nqc-data-content", "Neo Quick Call", "Neo Quick Call PW", "nqc-card");

  } catch (error) {
    console.error("Fetch Data Error:", error);
    
    const apoCard = document.getElementById("apo-card");
    if (apoCard) apoCard.style.display = 'none';
    
    const nqcCard = document.getElementById("nqc-card");
    if (nqcCard) nqcCard.style.display = 'none';
    
    alert("データの取得に失敗しました。");
  } finally {
    hideLoading();
  }
}

function getBodyData() {
  if (!cachedLarkData) return null;
  return cachedLarkData.body ? cachedLarkData.body : cachedLarkData;
}

function renderApoEfficiency(elementId, dataKey, cardId) {
  const contentElement = document.getElementById(elementId);
  const cardElement = document.getElementById(cardId);
  if (!contentElement || !cardElement) return;

  const bodyData = getBodyData();
  let val = bodyData ? bodyData[dataKey] : null;

  if (val && typeof val === 'object') {
    if (val["アポ効率"] && val["アポ効率"].value && val["アポ効率"].value[0] !== undefined) {
      val = val["アポ効率"].value[0];
    } else if (val.value && Array.isArray(val.value) && val.value[0] !== undefined) {
      val = val.value[0].text !== undefined ? val.value[0].text : val.value[0];
    }
  }
  
  if (typeof val === 'string' && !isNaN(parseFloat(val))) {
    val = parseFloat(val);
  }

  let message = ""; 

  if (typeof val === 'number') {
    // ガラス感を残すため透過度（0.4）で色付け
    if (val < 1) {
      cardElement.style.backgroundColor = "rgba(178, 235, 242, 0.4)"; 
      message = "次も頑張りましょう！🌱";
    } else if (val >= 1 && val < 1.5) {
      cardElement.style.backgroundColor = "rgba(200, 230, 201, 0.4)"; 
      message = "安定したペースです✨";
    } else if (val >= 1.5 && val < 2) {
      cardElement.style.backgroundColor = "rgba(248, 187, 208, 0.4)"; 
      message = "素晴らしい効率です！🔥";
    } else if (val >= 2) {
      cardElement.style.backgroundColor = "rgba(225, 190, 231, 0.4)"; 
      message = "圧倒的な成果ですね！👑";
    }
    val = Math.round(val * 100) / 100; 
  }

  if (val !== undefined && val !== null && val !== "" && !isNaN(val)) {
    contentElement.classList.add("loaded");
    contentElement.innerHTML = `
      <div class="score-display">
        <span class="score-value">${val}</span>
        <span class="score-unit">件</span>
      </div>
      <p class="score-message">${message}</p>
    `;
    cardElement.style.display = 'block'; 
  } else {
    cardElement.style.display = 'none';
  }
}

function renderAccountInfo(elementId, idKey, pwKey, cardId) {
  const contentElement = document.getElementById(elementId);
  const cardElement = document.getElementById(cardId);
  if (!contentElement || !cardElement) return; 

  const bodyData = getBodyData();
  const idPwData = bodyData ? bodyData["ID/PW"] : null;
  
  let accountId = null;
  let accountPw = null;
  
  if (idPwData) {
    if (idPwData[idKey] && idPwData[idKey].value && idPwData[idKey].value[0]) {
      accountId = idPwData[idKey].value[0].text;
    }
    if (idPwData[pwKey] && idPwData[pwKey].value && idPwData[pwKey].value[0]) {
      accountPw = idPwData[pwKey].value[0].text;
    }
  }

  if (accountId || accountPw) {
    contentElement.classList.add("loaded");
    contentElement.innerHTML = `
      <div class="account-row">
        <span class="account-label">ID</span>
        <strong class="account-value">${accountId || "未登録"}</strong>
      </div>
      <div class="account-row">
        <span class="account-label">Password</span>
        <strong class="account-value">${accountPw || "未登録"}</strong>
      </div>
    `;
    cardElement.style.display = 'block';
  } else {
    cardElement.style.display = 'none';
  }
}

function setupButtonListeners() {
  const btnRule = document.getElementById("btn-rule");
  if (btnRule) btnRule.addEventListener("click", () => openLinkDirectly("今月分ルール"));

  const btnSalaryCurrent = document.getElementById("btn-salary-current");
  if (btnSalaryCurrent) btnSalaryCurrent.addEventListener("click", () => openLinkDirectly("今月分給与条件"));

  const btnSalaryPrev = document.getElementById("btn-salary-prev");
  if (btnSalaryPrev) btnSalaryPrev.addEventListener("click", () => openLinkDirectly("先月分給与条件"));
}

function openLinkDirectly(dataKey) {
  if (!cachedLarkData) {
    alert("データを読み込んでいます。数秒待ってから再度タップしてください。");
    return;
  }

  const bodyData = getBodyData();
  const targetUrl = bodyData ? bodyData[dataKey] : null;

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
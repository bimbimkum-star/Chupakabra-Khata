document.addEventListener('contextmenu', e => e.preventDefault());

const firebaseConfig = {
  apiKey: "AIzaSyB-nWyD4RtphSv7WazRgM7o3Eaj2NwgPek",
  authDomain: "chupakabra-khata.firebaseapp.com",
  projectId: "chupakabra-khata",
  storageBucket: "chupakabra-khata.firebasestorage.app",
  messagingSenderId: "872712106347",
  appId: "1:872712106347:web:48fc0bfcd7b9e182d89c2e"
};
try { firebase.initializeApp(firebaseConfig); } catch(e){}
const auth = typeof firebase !== "undefined" && firebase.auth ? firebase.auth() : null;
const db = typeof firebase !== "undefined" && firebase.firestore ? firebase.firestore() : null;
let currentUser = null;

const TURTLEMINT_URL = "https://advisor.turtlemintinsurance.com/profile/RAV4412722/ravindra_pratap_singh";
const PARTNER_WHATSAPP = "9369913187";

const PK="chupaProfile_final", CK="chupaCustomers_final", PINKEY="chupaPin_final";
const VK="chupaVault_final", BK="chupaBillCount_final", RK="chupaReactions_final";

let profile = JSON.parse(localStorage.getItem(PK)) || {
  shopName: "मेरी दुकान का खाता", shopAddress: "मेन बाज़ार, उत्तर प्रदेश",
  shopPhone: "9876543210", merchantName: "सत्यप्रकाश सिंह",
  gender: "male", upi: "", gstin: ""
};

let customers = JSON.parse(localStorage.getItem(CK)) || [];
let vault = Number(localStorage.getItem(VK) || "0.00");
let billCount = Number(localStorage.getItem(BK) || "101");
let reactions = JSON.parse(localStorage.getItem(RK)) || { chai: 14, kutai: 2, visits: 85 };

let active = null, txType = "give", editing = false;
let isMuted = localStorage.getItem("chupaMute") === "1";
let activeBillMode = 'kaccha';
let isLedgerOpen = false;

reactions.visits = (reactions.visits || 0) + 1;
localStorage.setItem(RK, JSON.stringify(reactions));

let cart = [
  { name: "सरसों तेल", qty: 2, unit: "लीटर", rate: 140 },
  { name: "गेहूँ आटा", qty: 5, unit: "किलो", rate: 35 }
];

function toggleLedgerDrawer() {
  isLedgerOpen = !isLedgerOpen;
  const drawer = document.getElementById("ledgerDrawer");
  const btn = document.getElementById("ledgerToggleBtn");
  if(isLedgerOpen) {
    drawer.style.display = "block";
    btn.textContent = "हिसाब समेटें 📁";
    renderCustomers();
  } else {
    drawer.style.display = "none";
    btn.textContent = "हिसाब खोलें 📂";
  }
}

function openGameModal() {
  document.getElementById("gameVaultBal").textContent = vault.toFixed(2);
  document.getElementById("modalChaiCount").textContent = reactions.chai;
  document.getElementById("modalKutaiCount").textContent = reactions.kutai;
  document.getElementById("gameModal").style.display = "flex";
}

/* HARDWARE BARCODE SCANNER */
let barcodeBuffer = '';
let lastKeyTime = performance.now();
window.addEventListener('keydown', (e) => {
  const tag = (document.activeElement.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag)) return;
  const now = performance.now();
  if (now - lastKeyTime > 90) barcodeBuffer = '';
  lastKeyTime = now;
  if (e.key === 'Enter') {
    if (barcodeBuffer.length >= 4) {
      handleBarcodeScan(barcodeBuffer.trim());
      barcodeBuffer = '';
    }
  } else if (e.key.length === 1) {
    barcodeBuffer += e.key;
  }
});

function handleBarcodeScan(code) {
  const item = { name: "आइटम (" + code.slice(-4) + ")", qty: 1, unit: "पीस", rate: 100 };
  const exist = cart.find(x => x.name === item.name);
  if (exist) { exist.qty += 1; } else { cart.push(item); }
  renderCart();
  speakMunshi("बारकोड स्कैन हुआ: " + item.name);
}

/* SPEECH ENGINE */
let synthVoices = [];
function loadVoices() { if ('speechSynthesis' in window) synthVoices = window.speechSynthesis.getVoices(); }
loadVoices();
if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = loadVoices;

function getHonorific(name, gender = 'male') {
  if (!name || !name.trim()) return 'साहब';
  const parts = name.trim().split(/\s+/);
  const lastName = parts[parts.length - 1];
  const firstName = parts[0];
  if (gender === 'female') return `${firstName} जी`;
  const surnames = ['सिंह','खट्टर','गुप्ता','वर्मा','शर्मा','मिश्रा','पांडेय','चौधरी','यादव','अंसारी','खान','अग्रवाल','जैन'];
  if (parts.length > 1 && surnames.includes(lastName)) return `${lastName} साहब`;
  return `${firstName} जी`;
}

function speakMunshi(text) {
  const bubble = document.getElementById("mascotBubble");
  const img = document.getElementById("chupaImg");
  bubble.textContent = text;
  bubble.style.display = "block";
  if (img) img.classList.add("talking");
  clearTimeout(window.mtt);
  window.mtt = setTimeout(() => {
    bubble.style.display = "none";
    if (img) img.classList.remove("talking");
  }, 4500);

  if (isMuted || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'hi-IN';
  u.pitch = 0.68;
  u.rate = 0.95;
  if (!synthVoices.length) synthVoices = window.speechSynthesis.getVoices();
  const maleVoice = synthVoices.find(v => v.lang.includes('hi') && (v.name.toLowerCase().includes('male') || !v.name.toLowerCase().includes('female')));
  if (maleVoice) u.voice = maleVoice;
  u.onend = () => { if (img) img.classList.remove("talking"); };
  u.onerror = () => { if (img) img.classList.remove("talking"); };
  window.speechSynthesis.speak(u);
}

function speakMunshiHonorific() {
  const h = getHonorific(profile.merchantName, profile.gender);
  const quotes = [
    `और ${h}, गद्दी संभालिए! बहीखाता एकदम दुरुस्त है।`,
    `${h}, मेहनत की कमाई में ही सबसे बड़ी बरकत है!`,
    `रोकड़ा समय पर आ जाए तो गद्दी का सुकून ही अलग होता है।`,
    `एक-एक पाई का हिसाब साफ रखिए ${h}, मुंशी जी का पूरा पहरा है!`
  ];
  speakMunshi(quotes[Math.floor(Math.random() * quotes.length)]);
}

function toggleMascotMute(e) {
  e.stopPropagation();
  isMuted = !isMuted;
  localStorage.setItem("chupaMute", isMuted ? "1" : "0");
  document.getElementById("mascotMuteBtn").textContent = isMuted ? "🔇" : "🔊";
  toast(isMuted ? "मुंशी जी शांत हो गए 🔇" : "मुंशी जी बोलने लगे 🔊");
}

function feedChai(){
  const img = document.getElementById("chupaImg");
  img.classList.remove("joy","kutai");
  void img.offsetWidth;
  img.classList.add("joy");
  reactions.chai = (reactions.chai || 0) + 1;
  syncData();
  profileUI();
  document.getElementById("modalChaiCount").textContent = reactions.chai;
  speakMunshi("आहा! कड़क अदरक वाली चाय... गद्दी की जय हो मालिक!");
}

function hitKutai(){
  const img = document.getElementById("chupaImg");
  img.classList.remove("joy","kutai");
  void img.offsetWidth;
  img.classList.add("kutai");
  reactions.kutai = (reactions.kutai || 0) + 1;
  syncData();
  profileUI();
  document.getElementById("modalKutaiCount").textContent = reactions.kutai;
  speakMunshi("अरे बाप रे! चप्पल पड़ गई... मुंशी जी से कोई भूल नहीं होगी!");
}

/* AUTH */
if (auth) {
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    const btn = document.getElementById("authBtn");
    const note = document.getElementById("syncStatusText");
    if (user) {
      btn.innerHTML = "👤 लॉगआउट";
      note.textContent = "🟢 क्लाउड बैकअप सक्रिय (" + (user.displayName || "दुकानदार") + ")";
      if (db) {
        db.collection("merchants").doc(user.uid).onSnapshot((doc) => {
          if (doc.exists) {
            const d = doc.data();
            if (d.profile) profile = d.profile;
            if (d.customers) customers = d.customers;
            localStorage.setItem(PK, JSON.stringify(profile));
            localStorage.setItem(CK, JSON.stringify(customers));
            profileUI();
            renderCustomers();
          } else { syncData(); }
        });
      }
    } else {
      btn.innerHTML = "👤 मर्चेंट खाता";
      note.textContent = "🛡️ 256-Bit सुरक्षित लोकल मोड";
    }
  });
}

function toggleAuth() {
  if (!auth) { toast("नेटवर्क से जुड़ें"); return; }
  if (currentUser) {
    if (confirm("लॉगआउट करना चाहते हैं?")) {
      auth.signOut().then(() => toast("लॉगआउट सफल ✓"));
    }
  } else {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(() => toast("मर्चेंट लॉगिन सफल ✓"))
      .catch((e) => toast("त्रुटि: " + e.message));
  }
}

function updateLivePanchang() {
  const now = new Date();
  const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const months = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'];
  document.getElementById("livePanchangText").textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function checkPinLock() {
  const savedPin = localStorage.getItem(PINKEY);
  const isUnlocked = sessionStorage.getItem("chupaUnlocked");
  if (savedPin && isUnlocked !== "1") {
    document.getElementById("lockScreen").style.display = "flex";
  } else {
    document.getElementById("lockScreen").style.display = "none";
  }
}

function unlockApp() {
  const savedPin = localStorage.getItem(PINKEY);
  const enteredPin = document.getElementById("unlockPin").value.trim();
  if (enteredPin === savedPin) {
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("unlockPin").value = "";
    sessionStorage.setItem("chupaUnlocked", "1");
    toast("गद्दी खुल गई ✓");
    speakMunshiHonorific();
  } else {
    toast("गलत PIN! दोबारा प्रयास करें ❌");
    document.getElementById("unlockPin").value = "";
  }
}

function setPin() {
  const currentPin = localStorage.getItem(PINKEY);
  const p = prompt(currentPin ? "नया 4 अंकों का सुरक्षा PIN दर्ज करें (हटाने के लिए खाली छोड़ें):" : "4 अंकों का सुरक्षा PIN बनाएँ:");
  if (p === null) return;
  if (p.trim() === "") {
    localStorage.removeItem(PINKEY);
    sessionStorage.removeItem("chupaUnlocked");
    toast("सुरक्षा PIN हटा दिया गया 🔓");
    return;
  }
  if (/^\d{4}$/.test(p.trim())) {
    localStorage.setItem(PINKEY, p.trim());
    sessionStorage.setItem("chupaUnlocked", "1");
    toast("4 अंकों का PIN लॉक सक्रिय हो गया 🔐");
  } else {
    alert("कृपया केवल 4 अंकों का संख्यात्मक PIN दर्ज करें!");
  }
}

function esc(x){return String(x??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN")}
function bal(c){return (c.tx||[]).reduce((s,t)=>s+(t.type==="give"?+t.amount:-t.amount),0)}
function init(n){return (n||"?").trim().charAt(0)||"?"}
function toast(s){let e=document.getElementById("toast");e.textContent=s;e.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>e.classList.remove("show"),2200)}
function closeModal(id){document.getElementById(id).style.display="none"}

function syncData(){
  localStorage.setItem(CK, JSON.stringify(customers));
  localStorage.setItem(PK, JSON.stringify(profile));
  localStorage.setItem(VK, vault.toFixed(2));
  localStorage.setItem(BK, String(billCount));
  localStorage.setItem(RK, JSON.stringify(reactions));
  if (currentUser && db) {
    db.collection("merchants").doc(currentUser.uid).set({
      profile: profile, customers: customers,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(e => console.log(e));
  }
}

function addVaultReward(amount = 0.05) {
  const today = new Date().toISOString().slice(0, 10);
  const key = "chupaDailyEarned_" + today;
  let earnedToday = Number(localStorage.getItem(key) || "0");
  if (earnedToday < 2.00) {
    const toAdd = Math.min(amount, 2.00 - earnedToday);
    vault += toAdd;
    earnedToday += toAdd;
    localStorage.setItem(key, earnedToday.toFixed(2));
    syncData();
    profileUI();
    toast(`+${toAdd.toFixed(2)} बरकत सिक्का तिजोरी में जुड़ा 🪙`);
  } else {
    syncData();
    profileUI();
    toast("आज का बरकत कोटा (2.00 सिक्के) पूरा हो चुका है! कल फिर मिलेगा।");
  }
}

function getTodayBusiness(){
  let sales = 0, received = 0, credit = 0, transactions = 0;
  const today = new Intl.DateTimeFormat("hi-IN", {day:"numeric",month:"short",year:"numeric"}).format(new Date());
  customers.forEach(c => {
    (c.tx || []).forEach(t => {
      if (!t.date) return;
      if (t.date === today || t.date.includes(today)) {
        transactions++;
        if(t.type === "give"){
          credit += Number(t.amount || 0);
          sales += Number(t.amount || 0);
        } else {
          received += Number(t.amount || 0);
        }
      }
    });
  });
  return { sales, received, credit, transactions };
}

function premiumBusinessSummary(){
  const data = getTodayBusiness();
  const el = document.getElementById("premiumBusinessSummary");
  if(!el) return;

  el.innerHTML = `
    <div style="background:linear-gradient(145deg,#0f172a,#1e1b4b);color:#fff;border-radius:22px;padding:15px;margin-top:12px;box-shadow:0 14px 30px rgba(15,23,42,.18);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <div style="font-size:13px;font-weight:800">📊 आज का कारोबार</div>
          <div style="font-size:9.5px;color:#94a3b8;margin-top:2px">दैनिक लेन-देन का लाइव सार</div>
        </div>
        <div style="background:rgba(255,255,255,.10);padding:5px 8px;border-radius:9px;font-size:9.5px;color:#cbd5e1;font-weight:700">
          ${data.transactions} लेन-देन
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:rgba(5,150,105,.16);border:1px solid rgba(52,211,153,.2);border-radius:14px;padding:10px;">
          <div style="font-size:9.5px;color:#94a3b8;font-weight:600">💰 भुगतान मिला</div>
          <strong style="display:block;margin-top:4px;font-size:16px;color:#6ee7b7">₹${data.received.toLocaleString("en-IN")}</strong>
        </div>
        <div style="background:rgba(225,29,72,.16);border:1px solid rgba(251,113,133,.2);border-radius:14px;padding:10px;">
          <div style="font-size:9.5px;color:#94a3b8;font-weight:600">🧾 आज का उधार</div>
          <strong style="display:block;margin-top:4px;font-size:16px;color:#fda4af">₹${data.credit.toLocaleString("en-IN")}</strong>
        </div>
      </div>
    </div>
  `;
}

function injectPremiumDashboard(){
  const dashboard = document.getElementById("dashboard");
  if(!dashboard || document.getElementById("premiumBusinessSummary")) return;
  const box = document.createElement("div");
  box.id = "premiumBusinessSummary";
  dashboard.appendChild(box);
  premiumBusinessSummary();
}

function profileUI(){
  document.getElementById("shopTitle").textContent = profile.shopName || "मेरी दुकान का खाता";
  document.getElementById("mascotMuteBtn").textContent = isMuted ? "🔇" : "🔊";
  document.getElementById("vaultBalance").textContent = vault.toFixed(2);
}

function dashboard(){
  let get=0, give=0;
  customers.forEach(c => {
    let b = bal(c);
    if(b >= 0) get += b; else give += Math.abs(b);
  });
  document.getElementById("totalGet").textContent = money(get);
  document.getElementById("totalGive").textContent = money(give);
  const net = get - give;
  const netEl = document.getElementById("net");
  netEl.textContent = (net >= 0 ? "+" : "-") + money(Math.abs(net));
  netEl.style.color = "#0f172a";
  premiumBusinessSummary();
}

function renderCustomers(){
  const q = (document.getElementById("search") ? document.getElementById("search").value : "").toLowerCase().trim();
  const list = document.getElementById("customers");
  const arr = customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  list.innerHTML = "";
  document.getElementById("count").textContent = customers.length + " ग्राहक दर्ज";

  if(!arr.length){
    list.innerHTML = '<div class="empty"><b>🔎</b>कोई खाता नहीं मिला। नीचे \'+\' दबाकर शुरुआत करें!</div>';
    dashboard();
    return;
  }
  arr.forEach(c => {
    let b = bal(c), isGet = b >= 0;
    list.innerHTML += `
    <div class="customer" onclick="openDetail(${c.id})">
      <div class="left">
        <div class="avatar">${esc(init(c.name))}</div>
        <div><div class="cname">${esc(c.name)}</div><div class="phone">📞 ${esc(c.phone)}</div></div>
      </div>
      <div class="right">
        <div class="amt ${isGet?"receive":"pay"}">${money(Math.abs(b))}</div>
        <div class="status ${isGet?"receive":"pay"}">${isGet?"लेना है":"देना है"}</div>
      </div>
    </div>`;
  });
  dashboard();
}

function openDetail(id){
  active = id;
  const c = customers.find(x => x.id === id);
  if(!c) return;
  ["dashboard","ledger","mandi","services","billingDesk","clinicDesk","pharmacyDesk"].forEach(i => {
    const el = document.getElementById(i); if(el) el.style.display="none";
  });
  document.getElementById("detail").style.display="block";
  document.getElementById("fab").style.display="none";
  document.getElementById("dAvatar").textContent = init(c.name);
  document.getElementById("dName").textContent = c.name;
  document.getElementById("dPhone").textContent = c.phone;
  document.getElementById("dPoints").textContent = `⭐ ${c.points||0} लॉयल्टी पॉइंट्स`;
  let b = bal(c);
  document.getElementById("dAmount").textContent = money(Math.abs(b));
  document.getElementById("dAmount").style.color = b >= 0 ? "var(--red)" : "var(--green)";
  document.getElementById("dStatus").textContent = b >= 0 ? "आपको लेना है" : "आपको देना है";
  renderTx(c);
}

function renderTx(c){
  const box = document.getElementById("transactions");
  box.innerHTML = "";
  if(!c.tx || !c.tx.length){ box.innerHTML = '<div class="empty">अभी कोई लेन-देन नहीं है</div>'; return; }
  c.tx.slice().reverse().forEach((t, i) => {
    let realIndex = c.tx.length - 1 - i;
    box.innerHTML += `
    <div class="tx">
      <div>
        <div class="txnote">${esc(t.note || (t.type==="give" ? "उधार दिया" : "भुगतान मिला"))}</div>
        <div class="txdate">${esc(t.date)}</div>
      </div>
      <div style="display:flex;align-items:center">
        <div class="txamt ${t.type==="give"?"receive":"pay"}">${t.type==="give"?"+":"−"} ${money(t.amount)}</div>
        <div class="txbuttons"><button class="tiny" onclick="deleteTx(${realIndex})">×</button></div>
      </div>
    </div>`;
  });
}
function back(){ document.getElementById("detail").style.display="none"; showLedger(); }

function openCustomer(){
  document.getElementById("cName").value = "";
  document.getElementById("cPhone").value = "";
  document.getElementById("customerModal").style.display = "flex";
}
function saveCustomer(){
  const n = document.getElementById("cName").value.trim();
  const p = document.getElementById("cPhone").value.trim();
  if(!n){ toast("ग्राहक का नाम डालें"); return; }
  if(!/^\d{10}$/.test(p)){ toast("10 अंकों का फोन नंबर डालें"); return; }
  customers.push({ id: Date.now(), name: n, phone: p, points: 10, tx: [] });
  syncData();
  closeModal("customerModal");
  renderCustomers();
  toast("खाता जुड़ गया ✓");
  speakMunshi(`${n} का नया खाता खुल गया है!`);
}

function openTx(type){
  txType = type;
  document.getElementById("txTitle").textContent = type === "give" ? "उधार दर्ज करें" : "भुगतान दर्ज करें";
  document.getElementById("txAmount").value = "";
  document.getElementById("txNote").value = "";
  document.getElementById("txModal").style.display = "flex";
}
function saveTx(){
  const a = Number(document.getElementById("txAmount").value);
  const note = document.getElementById("txNote").value.trim();
  if(!a || a <= 0){ toast("सही राशि दर्ज करें"); return; }
  const c = customers.find(x => x.id === active);
  if(!c.tx) c.tx = [];
  const date = new Intl.DateTimeFormat("hi-IN", {day:"numeric",month:"short",year:"numeric"}).format(new Date());
  c.tx.push({ amount: a, type: txType, note, date });
  c.points = (c.points || 0) + Math.floor(a / 100);
  syncData();
  closeModal("txModal");
  openDetail(active);
  premiumBusinessSummary();
  toast("हिसाब सुरक्षित हुआ ✓");
  speakMunshi(txType === "get" ? `₹${a} का भुगतान दर्ज हो गया!` : `₹${a} का उधार चढ़ा लिया!`);
}
function deleteTx(i){
  if(!confirm("यह प्रविष्टि हटाना चाहते हैं?")) return;
  const c = customers.find(x => x.id === active);
  c.tx.splice(i, 1);
  syncData();
  openDetail(active);
  premiumBusinessSummary();
  toast("हटा दिया गया");
}

function whatsapp(){
  const c = customers.find(x => x.id === active);
  const b = bal(c);
  if(b <= 0){ toast("कोई बकाया नहीं है"); return; }
  let msg = `नमस्ते ${c.name} जी 🙏\n${profile.shopName} पर आपका ${money(b)} का बकाया है।\nUPI: ${profile.upi}\nधन्यवाद!`;
  window.open("https://wa.me/91" + c.phone + "?text=" + encodeURIComponent(msg), "_blank");
}

/* GENERAL BILLING */
function switchBillMode(mode) {
  if (mode === 'gst' && (!profile.gstin || !profile.gstin.trim())) {
    alert("कृपया पहले सेटिंग्स में GSTIN नंबर दर्ज करें!"); return;
  }
  activeBillMode = mode;
  document.getElementById("bTypeKaccha").className = "bill-type-btn " + (mode === 'kaccha' ? 'active' : '');
  document.getElementById("bTypeGst").className = "bill-type-btn " + (mode === 'gst' ? 'active' : '');
  recalcCart();
}

function renderCart() {
  const tb = document.getElementById("cartTableBody");
  tb.innerHTML = "";
  cart.forEach((item, idx) => {
    tb.innerHTML += `
      <tr>
        <td><input type="text" value="${esc(item.name)}" oninput="cart[${idx}].name=this.value"></td>
        <td><input type="number" min="1" value="${item.qty}" oninput="cart[${idx}].qty=Number(this.value);recalcCart()"></td>
        <td>
          <select onchange="cart[${idx}].unit=this.value">
            <option ${item.unit==='किलो'?'selected':''}>किलो</option>
            <option ${item.unit==='लीटर'?'selected':''}>लीटर</option>
            <option ${item.unit==='पैकेट'?'selected':''}>पैकेट</option>
            <option ${item.unit==='पीस'?'selected':''}>पीस</option>
            <option ${item.unit==='बोरी'?'selected':''}>बोरी</option>
          </select>
        </td>
        <td><input type="number" value="${item.rate}" oninput="cart[${idx}].rate=Number(this.value);recalcCart()" style="text-align:right"></td>
      </tr>
    `;
  });
  recalcCart();
}

function addCartRow() {
  cart.push({ name: "", qty: 1, unit: "किलो", rate: 0 });
  renderCart();
}

function recalcCart() {
  let sub = 0;
  cart.forEach(i => sub += (Number(i.qty||0) * Number(i.rate||0)));
  const disc = Number(document.getElementById("cDiscount").value) || 0;
  const grand = Math.max(0, sub - disc);
  document.getElementById("cSubtotal").textContent = "₹" + sub.toFixed(2);
  document.getElementById("cGrandTotal").textContent = "₹" + grand.toFixed(2);
}

function printCartInvoice() {
  const cName = document.getElementById("cartCustName").value.trim() || "नकद ग्राहक";
  const pArea = document.getElementById("invoicePrintArea");
  const now = new Date();
  const dStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
  const tStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const currentBillNo = `A-${billCount}`;

  let sub = 0, rows = "", itemIndex = 1;
  cart.forEach((i) => {
    const rVal = Number(i.rate) || 0, nVal = (i.name || "").trim();
    if (nVal !== "" || rVal > 0) {
      const qVal = Number(i.qty) || 1, rowTotal = qVal * rVal;
      sub += rowTotal;
      rows += `<tr><td style="padding:4px 2px;border-bottom:1px dashed #ccc;">${itemIndex++}</td><td style="padding:4px 2px;border-bottom:1px dashed #ccc;">${esc(nVal || 'सामान')}</td><td style="padding:4px 2px;text-align:center;border-bottom:1px dashed #ccc;">${qVal} ${i.unit}</td><td style="padding:4px 2px;text-align:right;border-bottom:1px dashed #ccc;">₹${rVal.toFixed(2)}</td><td style="padding:4px 2px;text-align:right;border-bottom:1px dashed #ccc;">₹${rowTotal.toFixed(2)}</td></tr>`;
    }
  });

  const disc = Number(document.getElementById("cDiscount").value) || 0;
  const grand = Math.max(0, sub - disc);

  pArea.innerHTML = `
    <div class="paper-roll" style="margin:auto;font-family:monospace;background:#fff;color:#000;border:1px solid #111;">
      <div style="text-align:center;border-bottom:1px dashed #000;padding-bottom:5px;">
        <h2 style="font-size:16px;margin:0;font-weight:800;">${esc(profile.shopName)}</h2>
        <p style="font-size:9.5px;margin:2px 0;">${esc(profile.shopAddress || '')}</p>
        <p style="font-size:9.5px;margin:0;">मो.: ${esc(profile.shopPhone || '')}</p>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:9.5px;margin:6px 0;">
        <div><div>बिल संख्या: <b>#${currentBillNo}</b></div><div>ग्राहक: ${esc(cName)}</div></div>
        <div style="text-align:right"><div>दिनांक: ${dStr}</div><div>समय: ${tStr}</div></div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead><tr style="border-top:1px solid #000;border-bottom:1px solid #000;"><th style="padding:3px 2px;text-align:left;">#</th><th style="padding:3px 2px;text-align:left;">सामान</th><th style="padding:3px 2px;text-align:center;">मात्रा</th><th style="padding:3px 2px;text-align:right;">भाव</th><th style="padding:3px 2px;text-align:right;">कुल</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:6px;">कोई सामान दर्ज नहीं</td></tr>'}</tbody>
      </table>
      <div style="border-top:1px solid #000;padding-top:4px;margin-top:5px;text-align:right;font-size:11px;">
        <div>उप-योग: ₹${sub.toFixed(2)}</div>
        ${disc > 0 ? `<div style="font-size:10px;">छूट: -₹${disc.toFixed(2)}</div>` : ''}
        <div style="font-size:13px;font-weight:bold;margin-top:2px;border-top:1px dashed #000;padding-top:2px;">कुल देय राशि: ₹${grand.toFixed(2)}</div>
      </div>
      <div style="margin-top:8px;padding-top:5px;border-top:1px dotted #444;text-align:center;font-size:8.5px;line-height:1.35;">
        <div>1. बिका सामान 24 घंटे में बदलें। 2. धन्यवाद! 🙏</div>
        <div style="margin-top:4px;font-weight:bold;">Powered by चुपाकाबरा खाता | सुरक्षित डिजिटल बहीखाता 🐉</div>
      </div>
    </div>
  `;

  addVaultReward(0.05);
  billCount += 1;
  syncData();
  profileUI();
  setTimeout(() => { window.print(); }, 400);
}

function sendCartWhatsApp() {
  const phone = document.getElementById("cartCustPhone").value.trim();
  const cName = document.getElementById("cartCustName").value.trim() || "ग्राहक";
  if (!phone || phone.length < 10) { alert("मान्य 10 अंकों का फोन नंबर डालें!"); return; }
  let sub = 0, text = `*${profile.shopName}*\nमो.: ${profile.shopPhone || ''}\nनमस्ते ${cName} जी, आपका बिल:\n\n`;
  cart.forEach((i, idx) => {
    if ((i.name && i.name.trim() !== "") || (i.rate && Number(i.rate) > 0)) {
      const qVal = Number(i.qty) || 1, rVal = Number(i.rate) || 0;
      sub += (qVal * rVal);
      text += `${idx+1}. ${i.name} - ${qVal} ${i.unit} x ₹${rVal} = ₹${qVal * rVal}\n`;
    }
  });
  const disc = Number(document.getElementById("cDiscount").value) || 0;
  const grand = Math.max(0, sub - disc);
  text += `\n*कुल राशि: ₹${grand.toFixed(2)}*\nभुगतान UPI: ${profile.upi}\n\n_Powered by चुपाकाबरा खाता_ 🐉`;

  addVaultReward(0.05);
  billCount += 1;
  syncData();
  profileUI();
  window.open("https://wa.me/91" + phone + "?text=" + encodeURIComponent(text), "_blank");
}

function openQR(){
  if(!profile.upi){ toast("पहले सेटिंग्स में अपनी UPI ID जोड़ें"); openSettings(); return; }
  const c = customers.find(x => x.id === active);
  const b = c ? bal(c) : 0;
  const amt = b > 0 ? b : "";
  const uri = "upi://pay?pa=" + encodeURIComponent(profile.upi) + "&pn=" + encodeURIComponent(profile.shopName) + (amt ? "&am=" + amt + "&cu=INR" : "");

  document.getElementById("qrShopTitle").textContent = profile.shopName;
  document.getElementById("qrUpiText").textContent = profile.upi + (amt ? ` • ${money(amt)}` : "");
  document.getElementById("qrModal").style.display = "flex";

  const container = document.getElementById("qrCanvasContainer");
  container.innerHTML = "";
  new QRCode(container, { text: uri, width: 220, height: 220, colorDark: "#0f172a", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H });
}

function downloadRoyalPoster(){
  let qrSource = document.querySelector("#qrCanvasContainer canvas");
  if(!qrSource) { openQR(); setTimeout(downloadRoyalPoster, 250); return; }
  const p = document.createElement("canvas"); p.width = 600; p.height = 850;
  const ctx = p.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 850);
  grad.addColorStop(0, "#0f172a"); grad.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 600, 850);
  ctx.lineWidth = 5; ctx.strokeStyle = "#f59e0b"; ctx.strokeRect(18, 18, 564, 814);
  ctx.fillStyle = "#ffffff"; ctx.font = "800 30px sans-serif"; ctx.textAlign = "center"; ctx.fillText(profile.shopName, 300, 105);
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(100, 180, 400, 400, [24]); ctx.fill();
  ctx.drawImage(qrSource, 125, 205, 350, 350);
  ctx.fillStyle = "#93c5fd"; ctx.font = "bold 20px sans-serif"; ctx.fillText("UPI: " + (profile.upi || "सेटिंग्स में दर्ज करें"), 300, 663);
  const a = document.createElement("a"); a.href = p.toDataURL("image/png"); a.download = `${profile.shopName}_QR_Poster.png`; a.click();
  toast("रॉयल पोस्टर डाउनलोड सफल ✓");
}

function openInsurance(){ window.open(TURTLEMINT_URL, "_blank"); }
function applyLoan(){
  let msg = `नमस्ते जी 🙏\nमुझे 'चुपाकाबरा खाता' से व्यापार लोन की जानकारी चाहिए।`;
  window.open("https://wa.me/91" + PARTNER_WHATSAPP + "?text=" + encodeURIComponent(msg), "_blank");
}
function openBankingHub(){ document.getElementById("bankingModal").style.display = "flex"; }

function showLedger(){
  ["mandi","services","detail","billingDesk","clinicDesk","pharmacyDesk"].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display="none";
  });
  document.getElementById("dashboard").style.display="block";
  document.getElementById("ledger").style.display="block";
  document.getElementById("fab").style.display="block";
  setNav("bLedger");
}
function showBilling(){
  ["dashboard","ledger","detail","mandi","services","clinicDesk","pharmacyDesk"].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display="none";
  });
  document.getElementById("billingDesk").style.display="block";
  document.getElementById("fab").style.display="none";
  setNav("bBilling");
  renderCart();
}
function showMandi(){
  ["dashboard","ledger","detail","services","billingDesk","clinicDesk","pharmacyDesk"].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display="none";
  });
  document.getElementById("mandi").style.display="block";
  document.getElementById("fab").style.display="none";
  setNav("bMandi");
  loadDistrictMandi();
}
function showServices(){
  ["dashboard","ledger","detail","mandi","billingDesk","clinicDesk","pharmacyDesk"].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display="none";
  });
  document.getElementById("services").style.display="block";
  document.getElementById("fab").style.display="none";
  setNav("bServices");
}
function setNav(id){
  document.querySelectorAll(".bottom button").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById(id);
  if(btn) btn.classList.add("active");
}

async function loadDistrictMandi(){
  const dist = document.getElementById("mandiDistrictSelect").value;
  const list = document.getElementById("mandiList");
  const status = document.getElementById("mandiStatusText");
  status.textContent = "⏳ लोड हो रहा है...";
  list.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:25px;color:var(--muted);font-size:12px">ताज़ा सरकारी मंडी भाव आ रहे हैं...</div>`;

  const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001a36f11e8747548be776874344c488a08&format=json&limit=20&filters[state]=Uttar Pradesh&filters[district]=${dist}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if(data.records && data.records.length > 0){
      status.textContent = "🟢 लाइव सरकारी भाव";
      list.innerHTML = data.records.map(r => `
        <div style="background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px">
          <div style="font-size:20px">🌾</div>
          <h3 style="font-size:12.5px;font-weight:800;margin-top:6px">${esc(r.commodity)}</h3>
          <div style="font-size:17px;font-weight:800;color:#0284c7;margin-top:4px">₹${Number(r.modal_price||0).toLocaleString("en-IN")}</div>
          <div style="font-size:9.5px;color:var(--muted)">₹${r.min_price} – ₹${r.max_price} / क्विंटल</div>
          <div style="font-size:9.5px;font-weight:700;color:#059669;margin-top:4px">📍 ${esc(r.market)}</div>
        </div>
      `).join("");
    } else { throw new Error(); }
  } catch(e) {
    status.textContent = "🟡 मानक भाव";
    list.innerHTML = `
      <div style="background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px">🌾 <b>गेहूँ</b><div style="font-size:16px;font-weight:800;color:#0284c7">₹2,450</div><small>प्रति क्विंटल</small></div>
      <div style="background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px">🍚 <b>धान</b><div style="font-size:16px;font-weight:800;color:#0284c7">₹2,280</div><small>प्रति क्विंटल</small></div>
    `;
  }
}

function openSettings(){
  document.getElementById("shopName").value = profile.shopName || "";
  document.getElementById("shopAddress").value = profile.shopAddress || "";
  document.getElementById("shopPhone").value = profile.shopPhone || "";
  document.getElementById("merchantName").value = profile.merchantName || "";
  document.getElementById("merchantGender").value = profile.gender || "male";
  document.getElementById("shopUpi").value = profile.upi || "";
  document.getElementById("shopGst").value = profile.gstin || "";
  document.getElementById("adminStatsBox").style.display = "none";
  document.getElementById("adminPinInput").value = "";
  document.getElementById("settingsModal").style.display = "flex";
}

/* MASTER PIN: 2569 */
function verifyAdminView(){
  const pin = document.getElementById("adminPinInput").value.trim();
  if(pin === "2569"){
    document.getElementById("admVisits").textContent = reactions.visits || 1;
    document.getElementById("admBills").textContent = billCount - 100;
    document.getElementById("admChai").textContent = reactions.chai;
    document.getElementById("admKutai").textContent = reactions.kutai;
    document.getElementById("admBarakat").textContent = vault.toFixed(2);
    document.getElementById("adminStatsBox").style.display = "block";
    toast("मालिक मीटर अनलॉक ✓");
  } else {
    alert("अमान्य सुरक्षा पिन!");
  }
}

function saveSettings(){
  const s = document.getElementById("shopName").value.trim();
  const a = document.getElementById("shopAddress").value.trim();
  const p = document.getElementById("shopPhone").value.trim();
  const m = document.getElementById("merchantName").value.trim();
  const g = document.getElementById("merchantGender").value;
  const u = document.getElementById("shopUpi").value.trim();
  const gst = document.getElementById("shopGst").value.trim().toUpperCase();

  if(!s){ toast("दुकान का नाम दर्ज करें"); return; }
  profile.shopName = s; profile.shopAddress = a; profile.shopPhone = p;
  profile.merchantName = m; profile.gender = g; profile.upi = u; profile.gstin = gst;

  syncData(); profileUI();
  closeModal("settingsModal");
  toast("सेटिंग्स सुरक्षित हुईं ✓");
  speakMunshiHonorific();
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const splash = document.getElementById("splashScreen");
    if (splash) {
      splash.style.opacity = "0"; splash.style.visibility = "hidden";
      setTimeout(() => splash.remove(), 600);
    }
  }, 1400);

  checkPinLock();
  updateLivePanchang();
  profileUI();
  dashboard();
  renderCart();
  injectPremiumDashboard();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

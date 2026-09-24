/* =========================================================
   SERVICES.JS: PHARMACY, CLINIC & 50 TEMPLATES ENGINE
   ========================================================= */

const CLINIKEY="chupaClinicProfile_final", RXCUSTOMKEY="chupaRxCustom_final";
const PHARMAKEy="chupaPharmaProfile_final";

let clinicProfile = JSON.parse(localStorage.getItem(CLINIKEY)) || {
  name: "आरोग्य रिहैब व थेरेपी क्लिनिक",
  doc: "डॉ. आर. पी. सिंह (B.P.T, न्यूरोथेरेपिस्ट)",
  reg: "UP-RMP-2026/A", address: "मेन चौराहा, उत्तर प्रदेश",
  phone: "9369913187", mapUrl: "https://maps.google.com/?q=27.5706,81.5977"
};

let pharmaProfile = JSON.parse(localStorage.getItem(PHARMAKEy)) || {
  name: "आरोग्य मेडिकल व फार्मेसी", dl: "UP-DL-8942",
  address: "निकट ज़िला अस्पताल, उत्तर प्रदेश",
  phone: "9369913187", mapUrl: "https://maps.google.com/?q=27.5706,81.5977"
};

let customRxItems = JSON.parse(localStorage.getItem(RXCUSTOMKEY)) || { c: [], t: [], a: [] };
let isGovOpen = false;

let pharmaCart = [
  { name: "Paracetamol 650mg", batch: "B-2401", qty: 10, rate: 2.5 },
  { name: "Pantoprazole 40mg", batch: "P-988", qty: 10, rate: 9.0 }
];

let rxMode = "therapy";
let currentAdderType = 'c';

const rxDataLibrary = {
  therapy: {
    complaints: ["सर्वाइकल स्पॉन्डिलाइटिस", "साइटिका (L4-L5 डिस्क)", "फ्रोजन शोल्डर (कंधा जाम)", "घुटने का दर्द (Osteoarthritis)", "माइग्रेन / आधासीसी", "कमर दर्द (Lumbago)", "लकवा / पैरालिसिस रिहैब", "टेनिस एल्बो", "हील पेन (Plantar Fasciitis)", "अपच व नाभि डिगना"],
    treatment: ["ड्राई कपिंग थेरेपी (5 Cups)", "वेट कपिंग / हिजामा (डिटॉक्स)", "न्यूरोथेरेपी नवल स्टिम्युलेशन", "Tens + IFT फिजियो थेरेपी", "अल्ट्रासाउंड पेन रिलीफ", "मैनुअल जॉइंट मोबिलाइज़ेशन", "स्पाइन ट्रैक्शन (मैनुअल)", "हर्बल पोटली स्वेदन"],
    advice: ["तकिया लगाना पूरी तरह बंद रखें", "गरम पानी की सिकाई (दिन में 2 बार)", "कमर सीधी रखकर बैठें", "भारी वज़न बिल्कुल न उठाएं", "स्ट्रेचिंग कसरत 15 मिनट सुबह", "ठंडी व बादी चीज़ों से परहेज"]
  },
  medical: {
    complaints: ["वायरल फीवर / बुखार", "गले में खराश व सूखी खांसी", "एसिडिटी व पेट दर्द (GERD)", "डायरिया / लूज मोशन", "हाई बीपी (हाइपरटेंशन)", "दाद, खाज, खुजली (फंगल)", "कमजोरी व चक्कर", "जोड़ों का दर्द (यूरिक एसिड)"],
    treatment: ["Paracetamol 650mg SOS", "Pantoprazole 40mg (खाली पेट)", "Amoxicillin + Clav 625mg BD", "ORS + Zinc घोल दिन में 3 बार", "Levocetirizine 5mg रात को", "B-Complex + Multivitamin OD", "Diclofenac Gel स्थानीय लेप"],
    advice: ["उबला पानी पिएं", "हल्का व सुपाच्य भोजन (खिचड़ी/दलिया)", "3 दिन बाद फॉलो-अप दिखाएं", "दवा का पूरा कोर्स लें", "धूल व ठंडी हवा से बचें"]
  },
  rural: {
    complaints: ["सामान्य हरारत व बदन दर्द", "मौसमी सर्दी-जुकाम", "पेट में मरोड़ व गैस", "साधारण घाव व खरोंच", "उल्टी व दस्त का आरंभ", "आंखों में लाली व जलन", "सिरदर्द व थकान"],
    treatment: ["बुखार प्राथमिक गोली (OTC)", "गैस नाशक एंटासिड सिरप", "ओआरएस इलेक्ट्रोलाइट पैकेट", "एंटीसेप्टिक डेटॉल ड्रेसिंग", "दर्द निवारक बाम लेप", "सलाइन नेज़ल ड्रॉप्स", "उच्च केंद्र / ज़िला अस्पताल रेफरल"],
    advice: ["तत्काल आराम करें व पर्याप्त तरल लें", "लक्षण 24 घंटे में न सुधरें तो तुरंत CHC जाएं", "कोई भारी एंटीबायोटिक बिना जांच न लें", "ब्लड प्रेशर की नियमित जांच कराएं"]
  }
};

let selRxComplaints = new Set();
let selRxTreatments = new Set();
let selRxAdvices = new Set();

/* CITIZEN 12 PORTALS LOADER */
const citizenServicesData = [
  { em: "💳", tag: "UP Health", title: "शिक्षक कैशलेस कार्ड", sub: "मुख्यमंत्री कैशलेस चिकित्सा", url: "https://cmtcts.upsdc.gov.in" },
  { em: "🏥", tag: "PM-JAY", title: "आयुष्मान कार्ड", sub: "परिवार पात्रता व डाउनलोड", url: "https://beneficiary.nha.gov.in" },
  { em: "🌾", tag: "FCS UP", title: "राशन कार्ड पर्ची", sub: "कोटेदार सूची व यूनिट खोज", url: "https://fcs.up.gov.in" },
  { em: "🎋", tag: "e-Ganna", title: "गन्ना पर्ची कैलेंडर", sub: "किसान सट्टा व पर्ची कैलेंडर", url: "https://enquiry.caneup.in" },
  { em: "🏫", tag: "eHRMS UP", title: "मानव संपदा पोर्टल", sub: "सर्विस बुक व ऑनलाइन लीव", url: "https://ehrms.upsdc.gov.in" },
  { em: "⚖️", tag: "eCourts", title: "कोर्ट केस स्टेटस", sub: "तहसील व ज़िला कोर्ट तारीख", url: "https://services.ecourts.gov.in" },
  { em: "🔍", tag: "eDistrict", title: "प्रमाणपत्र सत्यापन", sub: "आय/जाति/निवास असली-नकली", url: "https://edistrict.up.gov.in" },
  { em: "📜", tag: "Bhulekh", title: "भूलेख खतौनी", sub: "गाटा व ज़मीन नकल ब्योरा", url: "https://upbhulekh.gov.in" },
  { em: "🚜", tag: "PM-Kisan", title: "PM-किसान क़िस्त", sub: "सम्मान निधि स्थिति व eKYC", url: "https://pmkisan.gov.in" },
  { em: "🚆", tag: "Indian Rail", title: "रेलवे PNR व ट्रेन", sub: "लाइव स्थिति व सीट खोज", url: "https://www.indianrail.gov.in" },
  { em: "🏛️", tag: "IGRSUP", title: "बैनामा व रजिस्ट्री", sub: "जायदाद भार व प्रतिलिपि", url: "https://igrsup.gov.in" },
  { em: "🛡️", tag: "PMFBY", title: "फसल नुक़सान क्लेम", sub: "क्षतिपूर्ति दावा व स्थिति", url: "https://pmfby.gov.in" }
];

function renderCitizenServices() {
  const grid = document.getElementById("citizenGrid");
  if(!grid) return;
  grid.innerHTML = citizenServicesData.map(c => `
    <div class="gov-box">
      <div>
        <div class="gov-emoji">${c.em}</div>
        <div class="gov-tag">${c.tag}</div>
        <div class="gov-title">${c.title}</div>
        <div class="gov-sub">${c.sub}</div>
      </div>
      <a href="${c.url}" target="_blank" rel="noopener" class="gov-btn">पोर्टल खोलें ↗</a>
    </div>
  `).join("");
}

function toggleGovDrawer() {
  isGovOpen = !isGovOpen;
  const drawer = document.getElementById("govDrawer");
  const btn = document.getElementById("govToggleBtn");
  if(isGovOpen) {
    drawer.style.display = "block";
    btn.textContent = "समेटें ✕";
    renderCitizenServices();
  } else {
    drawer.style.display = "none";
    btn.textContent = "सेवाएँ खोलें ↗";
  }
}

/* GEOLOCATION LIVE HELPER */
function fetchCurrentLocation(target){
  if(!navigator.geolocation){ alert("आपके ब्राउज़र में GPS उपलब्ध नहीं है!"); return; }
  toast("सैटेलाइट से लोकेशन ली जा रही है... 📍");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
      if(target === 'pharma'){
        document.getElementById("setPhMap").value = mapLink;
      } else {
        document.getElementById("setClinicMap").value = mapLink;
      }
      toast("GPS लोकेशन लिंक सेट हो गया! 📍✓");
    },
    (err) => { alert("GPS अनुमति दें या मैन्युअल मैप लिंक दर्ज करें!"); },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/* PHARMACY CONTROLLER */
function showPharmacyDesk(){
  ["dashboard","ledger","detail","mandi","services","billingDesk","clinicDesk"].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display="none";
  });
  document.getElementById("pharmacyDesk").style.display="block";
  document.getElementById("fab").style.display="none";
  setNav("bServices");
  updatePharmaUI();
  renderPharmaCart();
}

function updatePharmaUI(){
  document.getElementById("dispPharmaName").textContent = pharmaProfile.name || "आरोग्य मेडिकल व फार्मेसी";
  let sub = `डी.एल. सं.: ${pharmaProfile.dl || 'प्रक्रियाधीन'} | मो.: ${pharmaProfile.phone}`;
  if(pharmaProfile.mapUrl && pharmaProfile.mapUrl.trim()){
    sub += " | 📍 लाइव मैप लिंक सक्रिय";
  }
  document.getElementById("dispPharmaSub").textContent = sub;
}

function editPharmaSetup(){
  document.getElementById("setPhName").value = pharmaProfile.name || "";
  document.getElementById("setPhDl").value = pharmaProfile.dl || "";
  document.getElementById("setPhAddress").value = pharmaProfile.address || "";
  document.getElementById("setPhPhone").value = pharmaProfile.phone || "";
  document.getElementById("setPhMap").value = pharmaProfile.mapUrl || "";
  document.getElementById("pharmaSetupModal").style.display = "flex";
}

function savePharmaSetup(){
  const n = document.getElementById("setPhName").value.trim();
  if(!n){ toast("मेडिकल स्टोर का नाम दर्ज करें"); return; }
  pharmaProfile.name = n;
  pharmaProfile.dl = document.getElementById("setPhDl").value.trim();
  pharmaProfile.address = document.getElementById("setPhAddress").value.trim();
  pharmaProfile.phone = document.getElementById("setPhPhone").value.trim();
  pharmaProfile.mapUrl = document.getElementById("setPhMap").value.trim();

  localStorage.setItem(PHARMAKEy, JSON.stringify(pharmaProfile));
  updatePharmaUI();
  closeModal("pharmaSetupModal");
  toast("फार्मेसी सेटअप सुरक्षित हुआ ✓");
}

function renderPharmaCart(){
  const tb = document.getElementById("pharmaTableBody");
  tb.innerHTML = "";
  pharmaCart.forEach((item, idx) => {
    tb.innerHTML += `
      <tr>
        <td><input type="text" value="${esc(item.name)}" oninput="pharmaCart[${idx}].name=this.value" placeholder="दवा नाम"></td>
        <td><input type="text" value="${esc(item.batch)}" oninput="pharmaCart[${idx}].batch=this.value" placeholder="बैच/एक्स"></td>
        <td><input type="number" min="1" value="${item.qty}" oninput="pharmaCart[${idx}].qty=Number(this.value);recalcPharma()" style="text-align:center"></td>
        <td><input type="number" value="${item.rate}" oninput="pharmaCart[${idx}].rate=Number(this.value);recalcPharma()" style="text-align:right"></td>
      </tr>
    `;
  });
  recalcPharma();
}

function addPharmaRow(){
  pharmaCart.push({ name: "", batch: "", qty: 1, rate: 0 });
  renderPharmaCart();
}

function recalcPharma(){
  let sub = 0;
  pharmaCart.forEach(i => sub += (Number(i.qty||0) * Number(i.rate||0)));
  const disc = Number(document.getElementById("phDiscount").value) || 0;
  const grand = Math.max(0, sub - disc);
  document.getElementById("phSubTotal").textContent = "₹" + sub.toFixed(2);
  document.getElementById("phGrandTotal").textContent = "₹" + grand.toFixed(2);
}

function printPharmaInvoice(){
  const cName = document.getElementById("phCustName").value.trim() || "नकद ग्राहक";
  const docRef = document.getElementById("phDocRef").value.trim() || "-";
  const pArea = document.getElementById("pharmaPrintArea");
  const now = new Date();
  const dStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
  const tStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const rxBillNo = "#PH-" + Math.floor(1000 + Math.random() * 9000);

  let sub = 0, rows = "", itemIndex = 1;
  pharmaCart.forEach(i => {
    if((i.name && i.name.trim() !== "") || Number(i.rate) > 0){
      const qVal = Number(i.qty) || 1, rVal = Number(i.rate) || 0;
      const total = qVal * rVal;
      sub += total;
      rows += `<tr><td style="padding:4px 2px;border-bottom:1px dashed #cbd5e1">${itemIndex++}</td><td style="padding:4px 2px;border-bottom:1px dashed #cbd5e1"><b>${esc(i.name)}</b></td><td style="padding:4px 2px;border-bottom:1px dashed #cbd5e1">${esc(i.batch || '-')}</td><td style="padding:4px 2px;text-align:center;border-bottom:1px dashed #cbd5e1">${qVal}</td><td style="padding:4px 2px;text-align:right;border-bottom:1px dashed #cbd5e1">₹${rVal.toFixed(2)}</td><td style="padding:4px 2px;text-align:right;border-bottom:1px dashed #cbd5e1">₹${total.toFixed(2)}</td></tr>`;
    }
  });

  const disc = Number(document.getElementById("phDiscount").value) || 0;
  const grand = Math.max(0, sub - disc);

  pArea.innerHTML = `
    <div class="paper-a4" style="margin:auto;font-family:sans-serif;background:#fff;border:1px solid #0f172a;padding:22px;">
      <div style="border-bottom:2px solid #0f172a;padding-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h2 style="font-size:20px;font-weight:800;margin:0;color:#0f172a;">${esc(pharmaProfile.name)}</h2>
          <p style="font-size:11px;color:#475569;margin:2px 0;">ड्रग लाइसेंस सं. (D.L. No.): <b>${esc(pharmaProfile.dl || 'UP-DL-APPLIED')}</b></p>
          <p style="font-size:11px;color:#334155;margin:0;">पता: ${esc(pharmaProfile.address)} | हेल्पलाइन: ${esc(pharmaProfile.phone)}</p>
          ${pharmaProfile.mapUrl ? `<p style="font-size:10px;color:#0284c7;margin-top:2px;">📍 Maps नेविगेशन: ${esc(pharmaProfile.mapUrl)}</p>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:24px;font-weight:800;color:#0284c7;">Rx / CASH MEMO</div>
          <div style="font-size:11px;font-weight:700;">दिनांक: ${dStr} (${tStr})</div>
          <div style="font-size:10.5px;color:#64748b;">बिल सं.: ${rxBillNo}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #94a3b8;font-size:12px;margin:6px 0;">
        <div>मरीज़: <b>${esc(cName)}</b></div>
        <div>रेफरिंग डॉक्टर: <b>${esc(docRef)}</b></div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:8px;">
        <thead>
          <tr style="border-top:1px solid #0f172a;border-bottom:1px solid #0f172a;background:#f8fafc;">
            <th style="padding:4px 2px;text-align:left;">#</th>
            <th style="padding:4px 2px;text-align:left;">दवा विवरण</th>
            <th style="padding:4px 2px;text-align:left;">बैच / एक्सपायरी</th>
            <th style="padding:4px 2px;text-align:center;">मात्रा</th>
            <th style="padding:4px 2px;text-align:right;">दर (₹)</th>
            <th style="padding:4px 2px;text-align:right;">कुल (₹)</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:10px;">कोई दवा दर्ज नहीं</td></tr>'}</tbody>
      </table>
      <div style="border-top:1px solid #0f172a;padding-top:6px;margin-top:8px;text-align:right;font-size:12.5px;">
        <div>उप-योग: ₹${sub.toFixed(2)}</div>
        ${disc > 0 ? `<div style="font-size:11px;color:#e11d48">छूट: -₹${disc.toFixed(2)}</div>` : ''}
        <div style="font-size:16px;font-weight:800;margin-top:2px;border-top:1px dashed #000;padding-top:4px;">कुल देय राशि: ₹${grand.toFixed(2)}</div>
      </div>
      <div style="margin-top:45px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div style="max-width:390px;">
          <div style="font-size:8.5px;color:#64748b;line-height:1.35;border-top:1px solid #e2e8f0;padding-top:4px;">
            * कानूनी सूचना: दवा डॉक्टर के परामर्शानुसार ही लें। बिका हुआ सामान वापस नहीं होगा। आपात स्थिति में तुरंत नजदीकी अस्पताल से संपर्क करें।
          </div>
          <div style="font-size:9.5px;font-weight:800;color:#0f172a;margin-top:3px;">Powered by चुपाकाबरा खाता | सुरक्षित डिजिटल बहीखाता 🐉</div>
        </div>
        <div style="text-align:center;font-size:11px;font-weight:700;"><div style="border-top:1px solid #000;width:140px;margin-bottom:4px;"></div>अधिकृत फार्मासिस्ट हस्ताक्षर</div>
      </div>
    </div>
  `;
  addVaultReward(0.05);
  setTimeout(() => { window.print(); }, 250);
}

function sendPharmaWhatsApp(){
  const phone = document.getElementById("phCustPhone").value.trim();
  const cName = document.getElementById("phCustName").value.trim() || "ग्राहक";
  if(!phone || phone.length < 10){ alert("मान्य 10 अंकों का WhatsApp नंबर दर्ज करें!"); return; }

  let sub = 0, medLines = "";
  pharmaCart.forEach((i, idx) => {
    if((i.name && i.name.trim() !== "") || Number(i.rate) > 0){
      const qVal = Number(i.qty) || 1, rVal = Number(i.rate) || 0;
      const total = qVal * rVal;
      sub += total;
      medLines += `${idx+1}. ${i.name} (बैच: ${i.batch||'-'}) - ${qVal} x ₹${rVal} = ₹${total}\n`;
    }
  });

  const disc = Number(document.getElementById("phDiscount").value) || 0;
  const grand = Math.max(0, sub - disc);

  let msg = `*${pharmaProfile.name}*\n` +
            `डी.एल. सं.: ${pharmaProfile.dl || '-'}\n` +
            `मो.: ${pharmaProfile.phone} | ${pharmaProfile.address}\n`;

  if(pharmaProfile.mapUrl && pharmaProfile.mapUrl.trim()){
    msg += `📍 दुकान की सटीक Google Maps लोकेशन (इमरजेंसी हेतु):\n${pharmaProfile.mapUrl}\n`;
  }

  msg += `------------------------\n` +
         `नमस्ते *${cName}* जी, आपका फार्मेसी बिल:\n\n` +
         `*दवाइयाँ:*\n${medLines || 'दवा पर्चा पूर्ण'}\n` +
         `*कुल देय राशि: ₹${grand.toFixed(2)}*\n\n` +
         `धन्यवाद! शीघ्र स्वास्थ्य लाभ की कामना 🙏\n\n` +
         `*Powered by चुपाकाबरा खाता | सुरक्षित डिजिटल बहीखाता 🐉*`;

  addVaultReward(0.05);
  window.open("https://wa.me/91" + phone + "?text=" + encodeURIComponent(msg), "_blank");
}

/* CLINICAL 50 TEMPLATES CONTROLLER */
const templateOptionsList = [
  { group: "🏥 1. क्लासिक क्लिनिकल (1-10)", items: ["01: क्लासिक ℞ एम्स फॉर्मल स्टाइल", "02: क्लासिक हेडर + डबल लाइन बॉर्डर", "03: गवर्नमेंट हॉस्पिटल पर्चा लेआउट", "04: नर्सिंग होम क्लीन लेटरहेड", "05: क्लासिक रॉयल ℞ वॉटरमार्क", "06: चैरिटेबल ट्रस्ट फॉर्मल स्लिप", "07: सीनियर कंसल्टेंट प्रेस्क्रिप्शन", "08: टू-कॉलम क्लासिक डायग्नोसिस", "09: क्लासिक ब्लू बॉर्डर पैड", "10: विंटेज एपोथेकरी स्टाइल"] },
  { group: "🧘 2. मॉडर्न फिजियो व न्यूरो रिहैब (11-20)", items: ["11: स्पाइन व डिस्क असेसमेंट शीट", "12: कपिंग व हिजामा सिटिंग ट्रैकर", "13: न्यूरोथेरेपी नवल स्टिम्युलेशन प्रोटोकॉल", "14: जॉइंट मोबिलिटी व पेन स्केल (VAS)", "15: फिजियो एक्सरसाइज चेकलिस्ट फॉर्मेट", "16: पैरालिसिस रिकवरी चार्ट", "17: स्पोर्ट्स इंजरी व रिहैब कार्ड", "18: ऑर्थोपेडिक रिहैबिलिटेशन लेआउट", "19: मॉडर्न टील हेडर रिहैब पैड", "20: प्रिवेंटिव वेलनेस व पोस्चर गाइड"] },
  { group: "🌿 3. आयुष, देसी व नाड़ी वैदिकी (21-30)", items: ["21: पारंपरिक नाड़ी व पंचकर्म पर्चा", "22: वात-पित्त-कफ त्रिदोष डायरी", "23: हर्बल काढ़ा व अनुपान चार्ट", "24: प्राकृतिक चिकित्सा व स्वेदन स्लिप", "25: मर्म चिकित्सा उपचार पत्रक", "26: आयुष ग्राम आरोग्य पत्र", "27: स्वर्ण प्राशन व बाल संस्कार कार्ड", "28: योग व दिनचर्या परामर्श पर्चा", "29: प्राचीन बॉर्डर देसी दवा पत्र", "30: शोधन व शमन थेरेपी शीट"] },
  { group: "🧾 4. थर्मल रोल पर्चा (काउंटर प्रिंटर) (31-40)", items: ["31: 58mm मिनी पॉकेट पर्ची", "32: 80mm रोल बारकोड क्लिनिक स्लिप", "33: थर्मल सिटिंग टोकन व परामर्श", "34: थर्मल बिल + प्रिस्क्रिप्शन कंबाइंड", "35: कॉम्पैक्ट फॉलो-अप स्लिप", "36: इमरजेंसी ओपीडी रोल टिकट", "37: 80mm बॉक्स ग्रिड पर्चा", "38: थर्मल मेडिसिन डोज टेबल", "39: सुपरफास्ट 10-सेकंड रोल स्लिप", "40: थर्मल बारकोड डिस्चार्ज समरी"] },
  { group: "✒️ 5. एग्जीक्यूटिव मिनिमल व आधुनिक (41-50)", items: ["41: स्लीक मॉडर्न ग्रे हेडर", "42: नो-बॉर्डर अल्ट्रा मिनिमल A4", "43: टू-टोन कॉर्पोरेट हेल्थ कार्ड", "44: डिजिटल ई-प्रिस्क्रिप्शन फॉर्मेट", "45: टेली-कंसल्टेशन ऑफिशियल पैड", "46: बुलेटेड क्लीन क्लिनिकल समरी", "47: मॉडर्न ज्योमेट्रिक कॉर्नर लेटरहेड", "48: डार्क-एलिगेंट हेडर मेडिकल शीट", "49: पोर्ट्रेट कार्ड स्टाइल प्रिस्क्रिप्शन", "50: प्रीमियम गोल्डन स्टैम्प स्टाइल"] }
];

function populateTemplateDropdown() {
  const sel = document.getElementById("rxTemplatePicker");
  if(!sel) return;
  sel.innerHTML = templateOptionsList.map((g, gIdx) => `
    <optgroup label="${g.group}">
      ${g.items.map((item, iIdx) => {
        const val = (gIdx * 10) + iIdx + 1;
        return `<option value="${val}">टेम्पलेट ${item}</option>`;
      }).join("")}
    </optgroup>
  `).join("");
}

function showClinicDesk(){
  ["dashboard","ledger","detail","mandi","services","billingDesk","pharmacyDesk"].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display="none";
  });
  document.getElementById("clinicDesk").style.display="block";
  document.getElementById("fab").style.display="none";
  setNav("bServices");
  updateClinicUI();
  populateTemplateDropdown();
  initRxClouds();
}

function updateClinicUI(){
  document.getElementById("dispClinicName").textContent = clinicProfile.name || "आरोग्य रिहैब व थेरेपी क्लिनिक";
  let sub = clinicProfile.doc || "डॉ. आर. पी. सिंह";
  if(clinicProfile.reg && clinicProfile.reg.trim()){
    sub += ` | Reg: ${clinicProfile.reg}`;
  }
  if(clinicProfile.mapUrl && clinicProfile.mapUrl.trim()){
    sub += " | 📍 लाइव मैप लिंक सक्रिय";
  }
  document.getElementById("dispClinicSub").textContent = sub;
}

function setRxCategory(cat){
  rxMode = cat;
  document.querySelectorAll(".rx-mode-tab").forEach(t => t.classList.remove("active"));
  const tab = document.querySelector(`[data-rxm="${cat}"]`);
  if(tab) tab.classList.add("active");

  const lbl = document.getElementById("rxTreatLbl");
  if(cat === "rural") lbl.textContent = "प्राथमिक सुरक्षित उपचार (Safe OTC):";
  else if(cat === "medical") lbl.textContent = "दवाइयाँ व प्रिस्क्रिप्शन (Rx):";
  else lbl.textContent = "थेरेपी व उपचार प्रोटोकॉल (Treatment):";

  selRxComplaints.clear();
  selRxTreatments.clear();
  selRxAdvices.clear();
  initRxClouds();
}

function initRxClouds(){
  const d = rxDataLibrary[rxMode];
  const allC = [...d.complaints, ...(customRxItems.c || [])];
  const allT = [...d.treatment, ...(customRxItems.t || [])];
  const allA = [...d.advice, ...(customRxItems.a || [])];

  document.getElementById("rxComplaintsCloud").innerHTML = allC.map(item => `
    <span class="rx-chip ${selRxComplaints.has(item)?'active':''}" onclick="toggleRxTag('c', '${item}')">${item}</span>
  `).join("");

  document.getElementById("rxTreatmentCloud").innerHTML = allT.map(item => `
    <span class="rx-chip ${selRxTreatments.has(item)?'active':''}" onclick="toggleRxTag('t', '${item}')">${item}</span>
  `).join("");

  document.getElementById("rxAdviceCloud").innerHTML = allA.map(item => `
    <span class="rx-chip ${selRxAdvices.has(item)?'active':''}" onclick="toggleRxTag('a', '${item}')">${item}</span>
  `).join("");
}

function toggleRxTag(type, val){
  let s = type === 'c' ? selRxComplaints : type === 't' ? selRxTreatments : selRxAdvices;
  if(s.has(val)) s.delete(val); else s.add(val);
  initRxClouds();
}

function openRxItemAdder(type){
  currentAdderType = type;
  const titleEl = document.getElementById("rxCustomItemTitle");
  if(type === 'c') titleEl.textContent = "＋ नया लक्षण / तकलीफ़ लिखें";
  else if(type === 't') titleEl.textContent = "＋ नई थेरेपी / दवा लिखें";
  else titleEl.textContent = "＋ नया परहेज / कसरत निर्देश लिखें";

  document.getElementById("customRxInput").value = "";
  document.getElementById("rxCustomItemModal").style.display = "flex";
}

function saveCustomRxItem(){
  const val = document.getElementById("customRxInput").value.trim();
  if(!val){ toast("कृपया कुछ विवरण लिखें"); return; }

  if(!customRxItems[currentAdderType]) customRxItems[currentAdderType] = [];
  if(!customRxItems[currentAdderType].includes(val)){
    customRxItems[currentAdderType].push(val);
  }

  if(currentAdderType === 'c') selRxComplaints.add(val);
  else if(currentAdderType === 't') selRxTreatments.add(val);
  else selRxAdvices.add(val);

  localStorage.setItem(RXCUSTOMKEY, JSON.stringify(customRxItems));
  closeModal("rxCustomItemModal");
  initRxClouds();
  toast("नया आइटम सूची में जुड़ गया ✓");
}

function updateRxCategoryBadge(){
  const val = parseInt(document.getElementById("rxTemplatePicker").value);
  const badge = document.getElementById("rxCategoryBadge");
  if(val <= 10) badge.textContent = "1. क्लासिक क्लिनिकल";
  else if(val <= 20) badge.textContent = "2. मॉडर्न फिजियो व न्यूरो";
  else if(val <= 30) badge.textContent = "3. आयुष व नाड़ी वैदिकी";
  else if(val <= 40) badge.textContent = "4. थर्मल पॉकेट रोल";
  else badge.textContent = "5. एग्जीक्यूटिव मिनिमल";
}

function editClinicSetup(){
  document.getElementById("setClinicName").value = clinicProfile.name || "";
  document.getElementById("setDocName").value = clinicProfile.doc || "";
  document.getElementById("setDocReg").value = clinicProfile.reg || "";
  document.getElementById("setClinicAddress").value = clinicProfile.address || "";
  document.getElementById("setClinicPhone").value = clinicProfile.phone || "";
  document.getElementById("setClinicMap").value = clinicProfile.mapUrl || "";
  document.getElementById("clinicSetupModal").style.display = "flex";
}

function saveClinicSetup(){
  const n = document.getElementById("setClinicName").value.trim();
  if(!n){ toast("क्लिनिक का नाम दर्ज करें"); return; }
  clinicProfile.name = n;
  clinicProfile.doc = document.getElementById("setDocName").value.trim();
  clinicProfile.reg = document.getElementById("setDocReg").value.trim();
  clinicProfile.address = document.getElementById("setClinicAddress").value.trim();
  clinicProfile.phone = document.getElementById("setClinicPhone").value.trim();
  clinicProfile.mapUrl = document.getElementById("setClinicMap").value.trim();

  localStorage.setItem(CLINIKEY, JSON.stringify(clinicProfile));
  updateClinicUI();
  closeModal("clinicSetupModal");
  toast("क्लिनिक सेटअप सुरक्षित हुआ ✓");
}

function printClinicPrescription(){
  const name = document.getElementById("rxPtName").value.trim();
  if(!name){ alert("कृपया मरीज़ का नाम लिखें!"); return; }

  const ageGen = document.getElementById("rxPtAgeGender").value.trim() || "-";
  const phone = document.getElementById("rxPtPhone").value.trim() || "-";
  const next = document.getElementById("rxPtNext").value.trim() || "आवश्यकतानुसार";
  const tplId = parseInt(document.getElementById("rxTemplatePicker").value);
  const today = new Date().toLocaleDateString('hi-IN');
  const rxNo = "#RX-" + (1000 + tplId * 10 + Math.floor(Math.random() * 9));

  const complaints = Array.from(selRxComplaints).join(", ") || "सामान्य क्लिनिकल परीक्षण";
  const treatments = Array.from(selRxTreatments).map((t, i) => `<div><b>${i+1}.</b> ${t}</div>`).join("") || "परामर्श पूर्ण";
  const advices = Array.from(selRxAdvices).map(a => `<div>• ${a}</div>`).join("") || "सावधानी रखें";

  let tplClass = "tpl-classic";
  if(tplId >= 11 && tplId <= 20) tplClass = "tpl-rehab";
  else if(tplId >= 21 && tplId <= 30) tplClass = "tpl-ayush";
  else if(tplId >= 31 && tplId <= 40) tplClass = "tpl-thermal";
  else if(tplId >= 41 && tplId <= 50) tplClass = "tpl-minimal";

  const pArea = document.getElementById("clinicPrintArea");
  pArea.innerHTML = `
    <div class="${tplClass}">
      <div style="border-bottom:2px solid #0f172a;padding-bottom:10px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h2 style="font-size:20px;font-weight:800;margin:0;color:#0f172a;">${esc(clinicProfile.name)}</h2>
          <p style="font-size:12.5px;font-weight:700;margin:2px 0;">${esc(clinicProfile.doc)}</p>
          ${clinicProfile.reg && clinicProfile.reg.trim() ? `<p style="font-size:11px;color:#334155;margin:1px 0;">पंजीकरण सं. (Reg. No): <b>${esc(clinicProfile.reg)}</b></p>` : ''}
          <p style="font-size:10px;color:#64748b;margin:0;">${esc(clinicProfile.address)} | संपर्क: ${esc(clinicProfile.phone)}</p>
          ${clinicProfile.mapUrl ? `<p style="font-size:9.5px;color:#0284c7;margin-top:2px;">📍 क्लिनिक लाइव मैप: ${esc(clinicProfile.mapUrl)}</p>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:26px;font-weight:800;color:#0284c7;line-height:1;">℞</div>
          <div style="font-size:11px;font-weight:700;margin-top:4px;">दिनांक: ${today}</div>
          <div style="font-size:10px;color:#64748b;">पर्चा सं.: ${rxNo}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #cbd5e1;font-size:12px;margin-top:6px;">
        <div>मरीज़: <b>${esc(name)}</b> (${esc(ageGen)})</div>
        <div>मो.: <b>${esc(phone)}</b></div>
        <div>टेम्पलेट: #${tplId}</div>
      </div>
      <div style="margin-top:14px;">
        <div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;">मुख्य तकलीफ़ / निदान (Complaints):</div>
        <div style="font-size:13px;font-weight:700;color:#0f172a;margin:3px 0 12px;">${complaints}</div>
        <div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;">उपचार व थेरेपी प्रोटोकॉल (Treatment / Rx):</div>
        <div style="font-size:13px;line-height:1.6;color:#0f172a;margin:4px 0 12px;">${treatments}</div>
        <div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;">घरेलू कसरत व परहेज (Advice & Precautions):</div>
        <div style="font-size:12px;line-height:1.5;color:#334155;margin:4px 0 12px;">${advices}</div>
        <div style="margin-top:14px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:11px;display:inline-block;">
          <b>अगला परामर्श / सिटिंग:</b> ${esc(next)}
        </div>
      </div>
      <div style="margin-top:55px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div style="max-width:390px;">
          <div style="font-size:8.5px;color:#64748b;line-height:1.35;border-top:1px solid #e2e8f0;padding-top:4px;">
            * कानूनी सुरक्षा (Disclaimer): यह पर्चा केवल क्लिनिकल परामर्श व रिकॉर्ड हेतु है। सभी चिकित्सा निर्णय व पंजीकरण की प्रामाणिकता हेतु परामर्शदाता स्वयं उत्तरदायी है।
          </div>
          <div style="font-size:9.5px;font-weight:800;color:#0f172a;margin-top:3px;">Powered by चुपाकाबरा खाता | सुरक्षित डिजिटल बहीखाता 🐉</div>
        </div>
        <div style="text-align:center;font-size:11px;font-weight:700;"><div style="border-top:1px solid #000;width:140px;margin-bottom:4px;"></div>अधिकृत हस्ताक्षर</div>
      </div>
    </div>
  `;
  addVaultReward(0.05);
  setTimeout(() => { window.print(); }, 250);
}

function sendClinicWhatsAppRx(){
  const name = document.getElementById("rxPtName").value.trim();
  const phone = document.getElementById("rxPtPhone").value.trim();
  if(!name){ alert("कृपया मरीज़ का नाम लिखें!"); return; }
  if(!phone || phone.length < 10){ alert("10 अंकों का WhatsApp नंबर लिखें!"); return; }

  const complaints = Array.from(selRxComplaints).join(", ") || "क्लिनिकल परामर्श";
  const treatments = Array.from(selRxTreatments).map((t, idx) => `${idx+1}. ${t}`).join("\n");
  const advices = Array.from(selRxAdvices).map(a => `• ${a}`).join("\n");
  const next = document.getElementById("rxPtNext").value.trim() || "आवश्यकतानुसार";
  const tplId = document.getElementById("rxTemplatePicker").value;

  let msg = `*${clinicProfile.name}*\n` +
            `${clinicProfile.doc}\n`;
  if(clinicProfile.reg && clinicProfile.reg.trim()){
    msg += `पंजीकरण संख्या (Reg. No): ${clinicProfile.reg}\n`;
  }
  msg += `मो.: ${clinicProfile.phone} | ${clinicProfile.address}\n`;

  if(clinicProfile.mapUrl && clinicProfile.mapUrl.trim()){
    msg += `📍 क्लिनिक लाइव लोकेशन मैप (आपातकाल नेविगेशन):\n${clinicProfile.mapUrl}\n`;
  }

  msg += `------------------------\n` +
         `नमस्ते *${name}* जी, आपका डिजिटल क्लिनिकल पर्चा (Tpl #${tplId}):\n\n` +
         `*तकलीफ़/लक्षण:* ${complaints}\n\n` +
         `*दवा व थेरेपी प्रोटोकॉल:*\n${treatments || 'परामर्श पूर्ण'}\n\n` +
         `*परहेज व निर्देश:*\n${advices || 'सावधानी रखें'}\n\n` +
         `*अगला परामर्श:* ${next}\n\n` +
         `धन्यवाद! शीघ्र स्वास्थ्य लाभ की शुभकामनाएँ 🙏\n\n` +
         `_कानूनी सूचना: यह पर्चा क्लिनिकल परामर्श व रिकॉर्ड हेतु है। परामर्शदाता स्वयं उत्तरदायी है।_\n` +
         `*Powered by चुपाकाबरा खाता | सुरक्षित डिजिटल बहीखाता 🐉*`;

  addVaultReward(0.05);
  window.open("https://wa.me/91" + phone + "?text=" + encodeURIComponent(msg), "_blank");
}

// Global State
let shoppingProfile = {
  profileName: "Standard Operations",
  cphSystem: "yHL",
  country: "IN",
  companyCode: "1000",
  plant: "1010",
  accountingObject: "CC-9010-IT",
  deliveryAddress: "HQ Tech Park, Tower B, Level 4, Bellary"
};

let currentCartItems = [];

// Initialize Page Defaults
document.addEventListener("DOMContentLoaded", () => {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  const dateInput = document.getElementById("plannedDeliveryDate");
  if (dateInput) {
    dateInput.value = defaultDate.toISOString().split("T")[0];
  }
  
  applyProfileToCart();
  renderProfileBadge();
});

// Navigation Controller
function navigateTo(target) {
  const breadcrumb = document.getElementById("currentUrl");
  const navFreeText = document.getElementById("navFreeText");
  const navCatalog = document.getElementById("navCatalog");
  const navTraining = document.getElementById("navTraining");

  document.getElementById("viewProfile").style.display = "none";
  document.getElementById("viewFreeText").style.display = "none";
  document.getElementById("viewCatalog").style.display = "none";
  document.getElementById("viewTraining").style.display = "none";

  [navFreeText, navCatalog, navTraining].forEach(el => el?.classList.remove("active"));

  if (target === "profile") {
    document.getElementById("viewProfile").style.display = "block";
    if (breadcrumb) breadcrumb.innerText = "https://zescale.test.com/app/#/profile-settings";
  } else if (target === "freetext") {
    document.getElementById("viewFreeText").style.display = "block";
    navFreeText?.classList.add("active");
    if (breadcrumb) breadcrumb.innerText = "https://zescale.test.com/app/#/shopping-cart/free-text";
  } else if (target === "catalog") {
    document.getElementById("viewCatalog").style.display = "block";
    navCatalog?.classList.add("active");
    if (breadcrumb) breadcrumb.innerText = "https://zescale.test.com/app/#/catalog";
  } else if (target === "training") {
    document.getElementById("viewTraining").style.display = "block";
    navTraining?.classList.add("active");
    if (breadcrumb) breadcrumb.innerText = "https://zescale.test.com/app/#/training";
  }
}

// Shopping Profile Actions
function saveShoppingProfile() {
  shoppingProfile.profileName = document.getElementById("profileName").value || "Default Profile";
  shoppingProfile.cphSystem = document.getElementById("cphSystem").value || "yHL";
  shoppingProfile.country = document.getElementById("countryCode").value || "IN";
  shoppingProfile.companyCode = document.getElementById("companyCode").value || "1000";
  shoppingProfile.plant = document.getElementById("plant").value || "1010";
  shoppingProfile.accountingObject = document.getElementById("accountingObject").value || "CC-9010-IT";
  shoppingProfile.deliveryAddress = document.getElementById("deliveryAddress").value || "";

  renderProfileBadge();
  applyProfileToCart();
  showToast(`Profile "${shoppingProfile.profileName}" activated successfully!`, "success");
  
  setTimeout(() => navigateTo("freetext"), 400);
}

function renderProfileBadge() {
  const chip = document.getElementById("activeProfileChip");
  const label = document.getElementById("activeProfileLabel");
  if (chip && label) {
    chip.style.display = "flex";
    label.innerText = `${shoppingProfile.profileName} (${shoppingProfile.companyCode}/${shoppingProfile.plant})`;
  }
}

function applyProfileToCart() {
  const accField = document.getElementById("accountingAssignment");
  if (accField) {
    accField.value = shoppingProfile.accountingObject;
  }
}

// Multi-Line Cart Addition with Auto-Scroll
function addLineItemToCart() {
  const descInput = document.getElementById("shortDescription");
  const priceInput = document.getElementById("netPrice");
  const qtyInput = document.getElementById("quantity");

  const desc = descInput.value.trim();
  const price = parseFloat(priceInput.value);
  const qty = parseFloat(qtyInput.value) || 1;

  if (!desc) {
    alert("Please enter a Short Description.");
    descInput.focus();
    return;
  }

  if (isNaN(price) || price <= 0) {
    alert("Please enter a valid Net Price greater than 0.");
    priceInput.focus();
    return;
  }

  let deliveryDate = document.getElementById("plannedDeliveryDate").value;
  if (!deliveryDate) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    deliveryDate = d.toISOString().split("T")[0];
  }

  const item = {
    id: currentCartItems.length + 1,
    desc: desc,
    orderType: document.getElementById("orderType").value || "Standard Purchase",
    matGroup: document.getElementById("materialGroup").value || "IT-HARDWARE",
    qty: qty,
    unit: document.getElementById("orderUnit").value || "EA",
    price: price,
    subtotal: qty * price,
    currency: document.getElementById("currency").value || "EUR",
    accounting: document.getElementById("accountingAssignment").value || shoppingProfile.accountingObject,
    deliveryDate: deliveryDate,
    supplier: document.getElementById("supplierDetails").value || "100458 - Dell Direct",
    approver: document.getElementById("approverDetails").value || "approver.manager@enterprise.com"
  };

  currentCartItems.push(item);
  renderCartTable();
  
  // Clear input fields for subsequent entry
  descInput.value = "";
  priceInput.value = "";
  qtyInput.value = "1";

  // Scroll down so the user immediately sees the updated staging table
  const tableSection = document.getElementById("scItemsTable");
  if (tableSection) {
    tableSection.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  showToast(`Item #${currentCartItems.length} added to cart preview below!`, "success");
}

function removeLineItem(index) {
  currentCartItems.splice(index, 1);
  renderCartTable();
}

function renderCartTable() {
  const tbody = document.getElementById("scItemsTableBody");
  const submitBtn = document.getElementById("btnSubmitCart");
  const itemCount = document.getElementById("cartItemCount");
  const grandTotalEl = document.getElementById("cartGrandTotal");

  if (!tbody) return;

  if (currentCartItems.length === 0) {
    tbody.innerHTML = `
      <tr id="emptyRowPlaceholder">
        <td colspan="9" class="text-center empty-state">No items added yet. Complete the form above and click "Add Line Item".</td>
      </tr>
    `;
    if (submitBtn) submitBtn.disabled = true;
    if (itemCount) itemCount.innerText = "0";
    if (grandTotalEl) grandTotalEl.innerText = "0.00 EUR";
    return;
  }

  tbody.innerHTML = "";
  let total = 0;
  const currency = currentCartItems[0].currency;

  currentCartItems.forEach((item, idx) => {
    total += item.subtotal;
    const row = document.createElement("tr");
    row.setAttribute("data-testid", `row-cart-item-${idx}`);
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td><strong>${item.desc}</strong><br><small class="text-muted">${item.matGroup}</small></td>
      <td>${item.orderType}</td>
      <td>${item.qty}</td>
      <td>${item.unit}</td>
      <td>${item.price.toFixed(2)} ${item.currency}</td>
      <td><strong>${item.subtotal.toFixed(2)} ${item.currency}</strong></td>
      <td><code>${item.accounting}</code></td>
      <td>
        <button class="btn-remove-row" onclick="removeLineItem(${idx})" title="Delete Line Item">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  if (submitBtn) submitBtn.disabled = false;
  if (itemCount) itemCount.innerText = currentCartItems.length;
  if (grandTotalEl) grandTotalEl.innerText = `${total.toFixed(2)} ${currency}`;
}

// Final Submit connected to CAP OData V4 Deep Insert
async function submitFinalCart() {
  const submitBtn = document.getElementById("btnSubmitCart");
  if (currentCartItems.length === 0) {
    alert("Please add at least one line item first.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting to SAP CAP...`;

  const generatedScId = "SC-" + Math.floor(100000 + Math.random() * 900000);
  const total = currentCartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const payload = {
    ID: crypto.randomUUID(),
    cartNumber: generatedScId,
    profileName: shoppingProfile.profileName || "Standard Operations",
    companyCode: shoppingProfile.companyCode || "1000",
    plant: shoppingProfile.plant || "1010",
    costCenter: shoppingProfile.accountingObject || "CC-9010-IT",
    approver: currentCartItems[0]?.approver || "approver.manager@enterprise.com",
    status: "SUBMITTED",
    totalAmount: total,
    currency: currentCartItems[0]?.currency || "EUR",
    items: currentCartItems.map((item, idx) => ({
      ID: crypto.randomUUID(),
      itemNumber: (idx + 1) * 10,
      shortText: item.desc,
      orderType: item.orderType,
      materialGroup: item.matGroup,
      quantity: item.qty,
      unitOfMeasure: item.unit,
      netPrice: item.price,
      currency: item.currency,
      accountingObj: item.accounting,
      deliveryDate: item.deliveryDate,
      supplier: item.supplier
    }))
  };

  try {
    const response = await fetch("/odata/v4/procurement/ShoppingCarts", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Prefer": "return=representation" // Instructs OData V4 to return the created entity JSON
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let errMsg = `HTTP ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.error?.message || errMsg;
      } catch (e) {
        if (errText) errMsg = errText;
      }
      throw new Error(errMsg);
    }

    // Safely parse body if present, or fallback to generated ID
    const rawText = await response.text();
    let createdCart = {};
    if (rawText && rawText.trim().length > 0) {
      try {
        createdCart = JSON.parse(rawText);
      } catch (e) {
        console.warn("Could not parse JSON response, using payload:", e);
      }
    }

    const finalCartNumber = createdCart.cartNumber || payload.cartNumber || generatedScId;
    alert(`Success! Shopping Cart ${finalCartNumber} submitted successfully.`);

    // Reset table
    currentCartItems = [];
    renderCartTable();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Submission failed:", error);
    alert(`Submission Error: ${error.message}`);
  } finally {
    submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Add Line Item and Submit`;
    submitBtn.disabled = currentCartItems.length === 0;
  }
}

// Toast Utility
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}
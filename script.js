let menuItems = [];
let cart = [];

// Estado da aba de promoções
let currentPromoDay = new Date().getDay();
if (currentPromoDay < 1 || currentPromoDay > 6) currentPromoDay = 1;

window.setPromoDay = function (day) {
    currentPromoDay = day;
    renderDailyPromos();
    const activeBtn = document.querySelector('.categories .btn-dark');
    const activeCategory = activeBtn ? activeBtn.dataset.category : 'all';

    // Safety check para searchInput possivelmente nulo
    const searchVal = document.getElementById('searchInput') ? document.getElementById('searchInput').value : '';
    renderMenu(activeCategory, searchVal);
};

// Elementos do DOM
const menuGrid = document.getElementById('menuGrid');
const categoryContainer = document.getElementById('categoryContainer');
const searchInput = document.getElementById('searchInput');

// Configuração das promoções da semana (Cronograma Reestabelecido)
const dailyPromotions = {
    1: [ // Segunda: Hamburguinhos, Pão Caseiro, Bolo Prestigio e Doce de Abacaxi
        { id: "0", promoPrice: 7.00 },
        { id: "4", promoPrice: 10.00 },
        { id: "31", promoPrice: 11.00 },
        { id: "18", promoPrice: 7.00 },
        { id: "28", promoPrice: 6.00 }
    ],
    2: [ // Terça: Hamburguinhos,Croissant e Pizzas Brotinho
        { id: "0", promoPrice: 7.00 },
        { id: "4", promoPrice: 10.00 },
        { id: "12", promoPrice: 8.00 },
        { id: "25", promoPrice: 7.00 },
        { id: "26", promoPrice: 7.00 },
        { id: "27", promoPrice: 7.00 }
    ],
    3: [ // Quarta: Coxinha, Lanches Naturais, Kibe, Enroladinho e Arroz Doce de Paçoca
        { id: "1", promoPrice: 7.00 },
        { id: "21", promoPrice: 8.00 },
        { id: "22", promoPrice: 8.00 },
        { id: "32", promoPrice: 8.00 },
        { id: "33", promoPrice: 7.00 },
        { id: "24", promoPrice: 3.00 }
    ],
    4: [ // Quinta: Coxinha, Pizzas Brotinho e Cachorro Quente
        { id: "1", promoPrice: 7.00 },
        { id: "25", promoPrice: 7.00 },
        { id: "26", promoPrice: 7.00 },
        { id: "27", promoPrice: 7.00 },
        { id: "29", promoPrice: 7.00 }
    ],
    5: [ // Sexta: Cachorro Quente, Croissant, Bolo Prestigio, Torta de Frango, Arroz Doce e Bauru
        { id: "29", promoPrice: 7.00 },
        { id: "12", promoPrice: 8.00 },
        { id: "18", promoPrice: 7.00 },
        { id: "30", promoPrice: 7.00 },
        { id: "24", promoPrice: 3.00 },
        { id: "34", promoPrice: 7.00 }
    ],
    6: [ // Sábado: Hamburguinhos, Lanches Naturais, Enroladinho e Torta de Frango
        { id: "0", promoPrice: 7.00 },
        { id: "4", promoPrice: 10.00 },
        { id: "21", promoPrice: 8.00 },
        { id: "22", promoPrice: 8.00 },
        { id: "33", promoPrice: 7.00 },
        { id: "30", promoPrice: 7.00 }
    ]
};

// Labels com emoji para as categorias
const categoryLabels = {
    'all': '🍽️ Todos',
    'burgers': '🍔 Burgers',
    'coxinha': '🍗 Coxinha',
    'bolinho': '🥟 Bolinho',
    'esfirra': '🫓 Esfirra',
    'croissant': '🥐 Croissant',
    'pizzas': '🍕 Pizzas',
    'lanches': '🥪 Naturais',
    'tortas': '🥧 Tortas',
    'paes': '🍞 Pães',
    'salgados': '🍘 Salgados',
    'drinks': '🥤 Bebidas',
    'desserts': '🍮 Sobremesas'
};

// Fetch e parse do XML
async function loadMenu() {
    console.log("Iniciando carregamento do cardápio...");
    try {
        const response = await fetch('./items.xml?v=' + Date.now());
        if (response.ok) {
            const str = await response.text();
            const data = new window.DOMParser().parseFromString(str, "text/xml");

            if (data.getElementsByTagName("parsererror").length > 0) throw new Error("Erro de XML");

            const items = data.getElementsByTagName("item");

            if (items && items.length > 0) {
                console.log("Itens carregados do XML:", items.length);
                menuItems = Array.from(items).map(item => {
                    const getTagValue = (tagName) => {
                        const el = item.getElementsByTagName(tagName)[0];
                        return el ? el.textContent : '';
                    };
                    return {
                        id: getTagValue("id"),
                        name: getTagValue("name"),
                        category: getTagValue("category"),
                        price: parseFloat(getTagValue("price")) || 0,
                        description: getTagValue("description"),
                        image: getTagValue("image")
                    };
                });
                renderAll();
                return;
            }
        }
    } catch (e) {
        console.warn("Fetch XML falhou, tentando fallback...", e.message);
    }

    // Fallback para menuData.js
    if (window.menuItemsData) {
        console.log("Usando fallback menuData.js");
        menuItems = window.menuItemsData;
        renderAll();
    } else {
        console.error("Erro crítico: Nenhuma fonte de dados encontrada!");
    }
}

function renderAll() {
    try { renderDailyPromos(); } catch (e) { console.error("Erro no promo", e); }
    try { renderCategories(); } catch (e) { console.error("Erro categorias", e); }
    try { renderMenu(); } catch (e) { console.error("Erro menu", e); }
}

function createProductCard(item, isPromo, promoPrice, index = 0) {
    let imgSrc = item.image || '';
    if (imgSrc.startsWith('assets/')) imgSrc = './' + imgSrc;

    const displayPrice = isPromo ? promoPrice : item.price;
    const promoClasses = isPromo ? 'promo-price-text' : '';
    const originalPriceHTML = isPromo ?
        `<span class="text-muted text-decoration-line-through me-2" style="font-size: 0.85rem;">R$ ${item.price.toFixed(2).replace('.', ',')}</span>` : '';

    const cartItem = cart.find(c => c.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    return `
        <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden product-card ${isPromo ? 'promo-border' : ''}" style="animation: slideUp 0.5s ease forwards; animation-delay: ${index * 0.05}s; cursor: pointer;" onclick="openProductModal('${item.id}', ${isPromo}, ${isPromo ? promoPrice : null})">
            <div class="position-relative overflow-hidden">
                ${isPromo ? '<span class="badge bg-instagram position-absolute top-0 end-0 m-3 shadow-sm" style="z-index: 2;">PROMOÇÃO</span>' : ''}
                <img src="${imgSrc}" class="card-img-top" alt="${item.name}" style="height: 200px; object-fit: cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indisponivel'">
            </div>
            <div class="card-body d-flex flex-column text-center p-4">
                <h5 class="card-title fw-bold mb-2">${item.name}</h5>
                <p class="card-text text-muted small flex-grow-1 mb-3">${item.description}</p>
                <div class="mt-auto pt-3 border-top w-100">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="price-wrapper text-start">
                            <div class="d-flex flex-column">
                                ${originalPriceHTML}
                                <span class="h4 fw-bold mb-0 ${promoClasses}" style="${isPromo ? 'color: #f53d2d;' : ''}">R$ ${displayPrice.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                        
                        <div class="d-flex align-items-center gap-2">
                            ${quantity > 0 ? `<span class="badge bg-success rounded-pill px-2 py-1 shadow-sm"><i class="fas fa-shopping-bag me-1"></i> ${quantity}</span>` : ''}
                            <button class="btn-add-cart" aria-label="Adicionar ao carrinho" style="border-radius: 50%; width: 40px; height: 40px; background: #212529; color: white; border: none;">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Lógica do Modal Estilo iFood
let currentModalProduct = null;
let currentModalQty = 1;

window.openProductModal = function(id, isPromo, promoPrice) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    
    currentModalProduct = {
        ...item,
        displayPrice: isPromo ? promoPrice : item.price
    };
    currentModalQty = 1;
    
    document.getElementById('modalProductName').textContent = item.name;
    document.getElementById('modalProductDesc').textContent = item.description;
    document.getElementById('modalProductPrice').textContent = `R$ ${currentModalProduct.displayPrice.toFixed(2).replace('.', ',')}`;
    
    let imgSrc = item.image || '';
    if (imgSrc.startsWith('assets/')) imgSrc = './' + imgSrc;
    document.getElementById('modalProductImage').style.backgroundImage = `url('${imgSrc}')`;
    
    document.getElementById('modalProductObs').value = '';
    
    updateModalUI();
    
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    productModal.show();
};

window.changeModalQty = function(delta) {
    if (currentModalQty + delta > 0) {
        currentModalQty += delta;
        updateModalUI();
    }
};

function updateModalUI() {
    document.getElementById('modalProductQty').textContent = currentModalQty;
    const total = currentModalProduct.displayPrice * currentModalQty;
    document.getElementById('modalProductTotal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const btnConfirm = document.getElementById('btnConfirmProduct');
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            if (!currentModalProduct) return;
            const obs = document.getElementById('modalProductObs').value;
            
            // Adiciona ao carrinho com observação
            window.alterarQtd(currentModalProduct.id, currentModalQty, currentModalProduct.name, currentModalProduct.displayPrice, obs);
            
            // Fecha Modal
            const modalEl = document.getElementById('productModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        });
    }
});

function renderDailyPromos() {
    const promoContainer = document.getElementById('promoCarouselContainer');
    if (!promoContainer) return;

    const today = currentPromoDay;
    const todaysPromos = dailyPromotions[today];

    if (!todaysPromos || todaysPromos.length === 0) {
        promoContainer.style.display = 'none';
        return;
    }

    promoContainer.style.display = 'block';
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const diaNome = diasSemana[today];

    const gradients = {
        1: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)',
        2: 'linear-gradient(135deg, #e8321f 0%, #ff5252 100%)',
        3: 'linear-gradient(135deg, #00BCD4 0%, #2196F3 100%)',
        4: 'linear-gradient(135deg, #4CAF50 0%, #009688 100%)',
        5: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)',
        0: 'linear-gradient(135deg, #e8321f 0%, #ff5252 100%)',
        6: 'linear-gradient(135deg, #F44336 0%, #BA68C8 100%)'
    };

    let itemsHTML = '';
    todaysPromos.forEach((promo, index) => {
        const item = menuItems.find(i => i.id === promo.id);
        if (item) {
            itemsHTML += `
                <div class="col">
                    ${createProductCard(item, true, promo.promoPrice, index)}
                </div>
            `;
        }
    });

    const dayBtnsHTML = [1, 2, 3, 4, 5, 6].map(d => {
        const names = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const activeClass = d === currentPromoDay ? 'btn-primary text-white border-primary' : 'btn-light border';
        return `<button class="btn rounded-pill px-3 py-1 ${activeClass} fw-bold shadow-sm" onclick="setPromoDay(${d})" style="white-space: nowrap;">${names[d]}</button>`;
    }).join('');

    promoContainer.innerHTML = `
        <div class="promo-section-header text-center mb-4">
             <h5 class="fw-bold text-dark mb-3">🔥 Promoções de ${diaNome}</h5>
             <div class="promo-day-selector d-flex justify-content-center gap-2 mb-2 overflow-auto pb-2" style="scrollbar-width: none;">
                ${dayBtnsHTML}
            </div>
        </div>
        
        <div class="promo-banner" style="background: ${gradients[today]}; border-radius: 25px; padding: 2.5rem 1.5rem;">
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 justify-content-center">
                ${itemsHTML}
            </div>
        </div>
    `;
}


function renderCategories() {
    if (!categoryContainer) return;
    const categories = ['all', ...new Set(menuItems.map(item => item.category))];
    categoryContainer.innerHTML = '';
    categoryContainer.className = 'categories d-flex flex-nowrap justify-content-start mb-4';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `btn ${cat === 'all' ? 'btn-dark' : 'btn-outline-dark'} rounded-pill px-4 py-2 me-2 mb-2 fw-semibold`;
        btn.dataset.category = cat;
        btn.textContent = categoryLabels[cat] || cat;

        btn.onclick = () => {
            document.querySelectorAll('.categories .btn').forEach(b => {
                b.classList.remove('btn-dark');
                b.classList.add('btn-outline-dark');
            });
            btn.classList.remove('btn-outline-dark');
            btn.classList.add('btn-dark');
            renderMenu(cat, searchInput.value);
        };

        categoryContainer.appendChild(btn);
    });
}

function renderMenu(filter = 'all', searchQuery = '') {
    if (!menuGrid) return;
    menuGrid.innerHTML = '';

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = filter === 'all' || item.category === filter;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filteredItems.length === 0) {
        menuGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search" style="display:block; font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Nenhum item encontrado para "<strong>${searchQuery}</strong>"</p>
            </div>`;
        return;
    }

    const today = currentPromoDay;
    const todaysPromos = dailyPromotions[today] || [];

    filteredItems.forEach((item, index) => {
        const promo = todaysPromos.find(p => p.id === item.id);
        const isPromo = !!promo;
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';
        col.innerHTML = createProductCard(item, isPromo, isPromo ? promo.promoPrice : null, index);
        menuGrid.appendChild(col);
    });
}

// Efeito de scroll no header
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (header) {
        window.scrollY > 20 ? header.classList.add('scrolled', 'glass') : header.classList.remove('scrolled', 'glass');
    }
});

// Pesquisa em tempo real
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const activeBtn = document.querySelector('.categories .btn-dark');
        const activeCategory = activeBtn ? activeBtn.dataset.category : 'all';
        renderMenu(activeCategory, e.target.value);
    });
}

// Lógica do Carrinho
window.alterarQtd = function (id, delta, name, price, obs = '') {
    // Ao receber obs, verificamos se já há um item com a mesma ID e mesma obs no carrinho
    const existing = cart.find(item => item.id === id && (item.obs || '') === obs);
    
    if (existing) {
        existing.quantity += delta;
        if (existing.quantity <= 0) {
            cart = cart.filter(item => item !== existing);
        }
    } else if (delta > 0) {
        cart.push({ id, name, price, quantity: delta, obs });
    }
    
    updateCartUI();
    
    // Atualiza a visualização do menu para refletir as quantidades nos cards
    const activeBtn = document.querySelector('.categories .btn-dark');
    const activeCategory = activeBtn ? activeBtn.dataset.category : 'all';
    const searchEl = document.getElementById('searchInput');
    if (searchEl) {
        renderMenu(activeCategory, searchEl.value);
    }
    
    if (delta > 0) showToast(`${name} adicionado! 🛒`);
};

window.addToCart = function (id, name, price) {
    window.alterarQtd(id, 1, name, price);
};

window.irParaPagamento = function () {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }
    // Salva o carrinho e subtotal para a página de pagamento
    const subtotal = cart.reduce((t, i) => t + (i.price * i.quantity), 0);
    localStorage.setItem('cartAGS', JSON.stringify(cart));
    localStorage.setItem('subtotalAGS', subtotal.toFixed(2));
    window.location.href = 'pagamento.html';
};


function updateCartUI() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItemsContainer || !cartCount || !cartTotal) return;

    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted text-center my-4 py-4 bg-light rounded-4">Seu carrinho está vazio.</p>';
        cartTotal.textContent = 'R$ 0,00';
        return;
    }

    let itemsHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        const obsHtml = item.obs ? `<div class="small text-muted fst-italic mt-1"><i class="fas fa-comment-dots me-1"></i>${item.obs}</div>` : '';
        
        itemsHTML += `
            <div class="cart-item shadow-sm border p-3 rounded-4 mb-2 d-flex justify-content-between align-items-center">
                <div class="flex-grow-1">
                    <h6 class="fw-bold mb-1">${item.name}</h6>
                    ${obsHtml}
                    <div class="d-flex align-items-center gap-3 mt-2">
                        <small class="text-muted">R$ ${item.price.toFixed(2).replace('.', ',')} cada</small>
                        <div class="d-flex align-items-center gap-2 bg-light px-2 py-1 rounded-pill border" style="transform: scale(0.9);">
                            <button class="btn btn-sm p-0 text-muted border-0 bg-transparent" onclick="alterarQtd('${item.id}', -1, '${item.name}', ${item.price}, '${item.obs ? item.obs.replace(/'/g, "\\'") : ''}')">
                                <i class="fas fa-minus-circle"></i>
                            </button>
                            <span class="fw-bold small" style="min-width: 20px; text-align: center;">${item.quantity}</span>
                            <button class="btn btn-sm p-0 text-muted border-0 bg-transparent" onclick="alterarQtd('${item.id}', 1, '${item.name}', ${item.price}, '${item.obs ? item.obs.replace(/'/g, "\\'") : ''}')">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-dark mb-1">R$ ${itemTotal.toFixed(2).replace('.', ',')}</div>
                    <button class="btn btn-sm text-danger p-0" onclick="removeFromCart(${index})" title="Remover item">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = itemsHTML;
    cartTotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

window.removeFromCart = function (index) {
    const item = cart[index];
    if (item) {
        window.alterarQtd(item.id, -item.quantity, item.name, item.price, item.obs);
    }
};

// Sistema de Toast
function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-custom';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

// Lógica de Dark Mode
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    const setCategoryTheme = () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    };

    // Check LocalStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    setCategoryTheme();

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        setCategoryTheme();
        showToast(`Modo ${newTheme === 'dark' ? 'Escuro' : 'Claro'} ativado!`);
    });
}

// Carregamento inicial
window.onload = loadMenu;

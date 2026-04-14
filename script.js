let menuItems = [];

// Estado da aba de promoções
let currentPromoDay = new Date().getDay();
if (currentPromoDay < 1 || currentPromoDay > 5) currentPromoDay = 1;

window.setPromoDay = function (day) {
    currentPromoDay = day;
    renderDailyPromos();
    const activePill = document.querySelector('.category-pill.active');
    const activeCategory = activePill ? activePill.dataset.category : 'all';
    renderMenu(activeCategory, searchInput.value);
};

// Elementos do DOM
const menuGrid = document.getElementById('menuGrid');
const categoryContainer = document.getElementById('categoryContainer');
const searchInput = document.getElementById('searchInput');

// Configuração das promoções da semana
const dailyPromotions = {
    1: [ // Segunda: Hamburguinhos, Pão Caseiro e Doce de Abacaxi
        { id: "0", promoPrice: 7.00 },
        { id: "4", promoPrice: 9.00 },
        { id: "31", promoPrice: 11.00 },
        { id: "28", promoPrice: 6.00 }
    ],
    2: [ // Terça: Croissant e Pizzas Brotinho
        { id: "12", promoPrice: 8.00 },
        { id: "25", promoPrice: 7.00 },
        { id: "26", promoPrice: 7.00 },
        { id: "27", promoPrice: 7.00 }
    ],
    3: [ // Quarta: Coxinha, Lanches Naturais e Arroz Doce de Paçoca
        { id: "1", promoPrice: 7.00 },
        { id: "21", promoPrice: 8.00 },
        { id: "22", promoPrice: 8.00 },
        { id: "24", promoPrice: 3.00 }
    ],
    4: [ // Quinta: Pizzas Brotinho e Cachorro Quente
        { id: "25", promoPrice: 7.00 },
        { id: "26", promoPrice: 7.00 },
        { id: "27", promoPrice: 7.00 },
        { id: "29", promoPrice: 7.00 }
    ],
    5: [ // Sexta: Bolo Prestigio, Kibe, Enroladinho e Torta
        { id: "18", promoPrice: 7.00 },
        { id: "32", promoPrice: 8.00 },
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
    try {
        const response = await fetch('./items.xml?v=' + Date.now());
        if (response.ok) {
            const str = await response.text();
            const data = new window.DOMParser().parseFromString(str, "text/xml");

            if (data.getElementsByTagName("parsererror").length > 0) throw new Error("Erro de XML");

            const items = data.getElementsByTagName("item");

            if (items.length > 0) {
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
        console.warn("Fetch XML falhou, usando fallback...", e.message);
    }

    // Fallback para menuData.js
    if (window.menuItemsData) {
        menuItems = window.menuItemsData;
        renderAll();
    }
}

function renderAll() {
    renderDailyPromos();
    renderCategories();
    renderMenu();
}

function renderDailyPromos() {
    const promoContainer = document.getElementById('dailyPromoContainer');
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

    let itemsHTML = '';

    todaysPromos.forEach(promo => {
        const item = menuItems.find(i => i.id === promo.id);
        if (item) {
            let imgSrc = item.image;
            if (imgSrc.startsWith('assets/')) imgSrc = './' + imgSrc;

            const originalPriceHTML = `<span style="text-decoration: line-through; color: #999; font-size: 0.9rem; margin-right: 5px;">R$ ${item.price.toFixed(2).replace('.', ',')}</span>`;

            itemsHTML += `
            itemsHTML += `
                <div class="col-11 col-sm-6 col-md-4 col-lg-3 mx-auto">
                    <div class="card h-100 shadow-md border-0 rounded-4 overflow-hidden promo-product-card">
                        <div class="position-relative">
                            <span class="badge bg-instagram position-absolute top-0 end-0 m-3 shadow-sm" style="z-index: 2;">HOJE</span>
                            <img src="${imgSrc}" class="card-img-top" alt="${item.name}" style="height: 180px; object-fit: cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indisponivel'">
                        </div>
                        <div class="card-body d-flex flex-column p-4 text-center">
                            <h5 class="card-title fw-bold mb-2">${item.name}</h5>
                            <p class="card-text text-muted small flex-grow-1">${item.description}</p>
                            <div class="mt-auto pt-3 border-top w-100">
                                <div class="price-wrapper">
                                    <span class="d-block text-uppercase fw-bold text-muted mb-1" style="font-size: 0.65rem;">a partir de</span>
                                    <div class="d-flex justify-content-center align-items-center gap-2">
                                        ${originalPriceHTML}
                                        <span class="h4 fw-bold mb-0 text-danger">R$ ${promo.promoPrice.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    if (itemsHTML === '') return;

    const gradients = {
        1: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)', // Segunda
        2: 'linear-gradient(135deg, #e8321f 0%, #ff5252 100%)', // Terça
        3: 'linear-gradient(135deg, #00BCD4 0%, #2196F3 100%)', // Quarta
        4: 'linear-gradient(135deg, #4CAF50 0%, #009688 100%)', // Quinta
        5: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)', // Sexta
        0: 'linear-gradient(135deg, #e8321f 0%, #ff5252 100%)',
        6: 'linear-gradient(135deg, #e8321f 0%, #ff5252 100%)'
    };

    const dayBtnsHTML = [1, 2, 3, 4, 5].map(d => {
        const names = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        return `<button class="day-btn ${d === currentPromoDay ? 'active' : ''}" onclick="setPromoDay(${d})">${names[d]}</button>`;
    }).join('');

    const promoCount = todaysPromos.length;
    let promoItemsClass = '';
    if (promoCount >= 5) {
        promoItemsClass = 'promo-items promo-expanded';
    } else {
        promoItemsClass = 'promo-items promo-centered';
    }

    promoContainer.innerHTML = `
        <div class="promo-section-header" style="text-align:center; margin-bottom:12px;">
            <span style="color:var(--text-muted); font-size:1.05rem; font-weight:800;">Confira as promoções da semana:</span>
        </div>
        <div class="promo-day-selector" style="margin-bottom:1.5rem; padding-bottom:5px;">
            ${dayBtnsHTML}
        </div>
        <div class="promo-banner p-3 p-md-4 rounded-4 shadow-lg text-white" style="background: ${gradients[today]};">
            <h2 class="promo-title h4 h3-md fw-bold mb-4 text-center">
                <i class="fas fa-tags me-2"></i> Promoções de ${diaNome}
            </h2>
            <div class="row g-3 g-md-4 justify-content-center">
                ${itemsHTML}
            </div>
        </div>
    `;
}

function renderCategories() {
    const categories = ['all', ...new Set(menuItems.map(item => item.category))];
    categoryContainer.innerHTML = '';
    categoryContainer.className = 'categories d-flex flex-nowrap justify-content-start justify-content-md-center mb-4';

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
        let imgSrc = item.image;
        if (imgSrc.startsWith('assets/')) {
            imgSrc = './' + imgSrc;
        }

        const promo = todaysPromos.find(p => p.id === item.id);
        const isPromo = !!promo;
        const displayPrice = isPromo ? promo.promoPrice : item.price;
        const promoStyles = isPromo ? `color: #ff5252;` : '';
        const originalPriceHTML = isPromo ? `<span style="text-decoration: line-through; color: #999; font-size: 0.9rem; margin-right: 5px;">R$ ${item.price.toFixed(2).replace('.', ',')}</span>` : '';

        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden product-card ${isPromo ? 'promo-border' : ''}" style="animation-delay: ${index * 0.05}s">
                <div class="position-relative">
                    ${isPromo ? '<span class="badge bg-instagram position-absolute top-0 end-0 m-3 shadow-sm" style="z-index: 2;">PROMOÇÃO</span>' : ''}
                    <img src="${imgSrc}" class="card-img-top" alt="${item.name}" style="height: 200px; object-fit: cover;" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indisponivel'">
                </div>
                <div class="card-body d-flex flex-column text-center">
                    <h5 class="card-title fw-bold mb-2">${item.name}</h5>
                    <p class="card-text text-muted small flex-grow-1">${item.description}</p>
                    <div class="mt-auto pt-3 border-top w-100">
                        <div class="price-wrapper">
                            <span class="d-block text-uppercase fw-bold text-muted mb-1" style="font-size: 0.65rem;">a partir de</span>
                            <div class="d-flex justify-content-center align-items-center gap-2">
                                ${originalPriceHTML}
                                <span class="h4 fw-bold mb-0" style="${promoStyles}">R$ ${displayPrice.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
searchInput.addEventListener('input', (e) => {
    const activePill = document.querySelector('.category-pill.active');
    const activeCategory = activePill ? activePill.dataset.category : 'all';
    renderMenu(activeCategory, e.target.value);
});

// Carregamento inicial
window.onload = loadMenu;

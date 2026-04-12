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
    2: [ // Terça: Croissant, Bauru e Pizzas Brotinho
        { id: "12", promoPrice: 8.00 },
        { id: "23", promoPrice: 8.00 },
        { id: "25", promoPrice: 7.00 },
        { id: "26", promoPrice: 7.00 },
        { id: "27", promoPrice: 7.00 }
    ],
    3: [ // Quarta: Coxinha, Lanches Naturais, Bolo de Maracujá e Arroz Doce de Paçoca
        { id: "1", promoPrice: 7.00 },
        { id: "21", promoPrice: 8.00 },
        { id: "22", promoPrice: 8.00 },
        { id: "19", promoPrice: 7.00 },
        { id: "24", promoPrice: 3.00 }
    ],
    4: [ // Quinta: Pizzas Brotinho e Cachorro Quente
        { id: "25", promoPrice: 7.00 },
        { id: "26", promoPrice: 7.00 },
        { id: "27", promoPrice: 7.00 },
        { id: "29", promoPrice: 7.00 }
    ],
    5: [ // Sexta: Sobremesas, Kibe, Enroladinho e Torta
        { id: "20", promoPrice: 6.00 },
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
                <div class="product-card promo-product-card">
                    <div class="product-image-container">
                        <div class="promo-badge">HOJE</div>
                        <img src="${imgSrc}" alt="${item.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indisponivel'">
                    </div>
                    <div class="product-info">
                        <h3>${item.name}</h3>
                        <p>${item.description}</p>
                        <div class="product-footer">
                            <div class="price-wrapper">
                                <span class="price-label">a partir de</span>
                                ${originalPriceHTML}
                                <span class="price" style="color: #ff5252;">R$ ${promo.promoPrice.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    if (itemsHTML === '') return;

    const gradients = {
        1: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)', // Segunda: Laranja
        2: 'linear-gradient(135deg, #e8321f 0%, #ff5252 100%)', // Terça: Vermelho (AGS default)
        3: 'linear-gradient(135deg, #00BCD4 0%, #2196F3 100%)', // Quarta: Azul
        4: 'linear-gradient(135deg, #4CAF50 0%, #009688 100%)', // Quinta: Verde
        5: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)', // Sexta: Roxo
        0: 'linear-gradient(135deg, #e8321f 0%, #ff5252 100%)', // Domingo
        6: 'linear-gradient(135deg, #e8321f 0%, #ff5252 100%)'  // Sábado
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
        <div class="promo-banner" style="background: ${gradients[today]};">
            <h2 class="promo-title"><i class="fas fa-tags"></i> Promoções de ${diaNome}</h2>
            <div class="${promoItemsClass}" style="--promo-count: ${promoCount};">
                ${itemsHTML}
            </div>
        </div>
    `;
}

function renderCategories() {
    const categories = ['all', ...new Set(menuItems.map(item => item.category))];
    categoryContainer.innerHTML = '';

    categories.forEach(cat => {
        const pill = document.createElement('div');
        pill.className = `category-pill ${cat === 'all' ? 'active' : ''}`;
        pill.dataset.category = cat;
        pill.textContent = categoryLabels[cat] || cat;

        pill.onclick = () => {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            renderMenu(cat, searchInput.value);
        };

        categoryContainer.appendChild(pill);
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
        // Correção de caminho para GitHub Pages
        let imgSrc = item.image;
        if (imgSrc.startsWith('assets/')) {
            imgSrc = './' + imgSrc;
        }

        const promo = todaysPromos.find(p => p.id === item.id);
        const isPromo = !!promo;
        const displayPrice = isPromo ? promo.promoPrice : item.price;
        const promoStyles = isPromo ? `color: #ff5252;` : '';
        const originalPriceHTML = isPromo ? `<span style="text-decoration: line-through; color: #999; font-size: 0.9rem; margin-right: 5px;">R$ ${item.price.toFixed(2).replace('.', ',')}</span>` : '';

        const card = document.createElement('div');
        card.className = 'product-card';
        if (isPromo) card.style.border = '2px solid #ff5252';
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="product-image-container">
                ${isPromo ? '<div class="promo-badge">PROMOÇÃO</div>' : ''}
                <img src="${imgSrc}" alt="${item.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indisponivel'">
            </div>
            <div class="product-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="product-footer">
                    <div class="price-wrapper">
                        <span class="price-label">a partir de</span>
                        ${originalPriceHTML}
                        <span class="price" style="${promoStyles}">R$ ${displayPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            </div>
        `;
        menuGrid.appendChild(card);
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

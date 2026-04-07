let menuItems = [];

// Elementos do DOM
const menuGrid = document.getElementById('menuGrid');
const categoryContainer = document.getElementById('categoryContainer');
const searchInput = document.getElementById('searchInput');

// Configuração das promoções da semana
const dailyPromotions = {
    1: [ // Segunda: Hamburguinhos
        { id: "0", promoPrice: 8.00 },
        { id: "4", promoPrice: 9.00 }
    ],
    2: [ // Terça: Croissant e Bauru
        { id: "12", promoPrice: 8.00 },
        { id: "23", promoPrice: 8.00 }
    ],
    3: [ // Quarta: Lanches Naturais
        { id: "21", promoPrice: 8.00 },
        { id: "22", promoPrice: 8.00 }
    ],
    4: [ // Quinta: Coxinha e Bolinho
        { id: "1", promoPrice: 7.00 },
        { id: "7", promoPrice: 6.00 }
    ],
    5: [ // Sexta: Sobremesas
        { id: "20", promoPrice: 5.00 },
        { id: "18", promoPrice: 7.00 }
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
    'lanches': '🥪 Naturais',
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
    
    const today = new Date().getDay(); // 0(Dom) a 6(Sab)
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
            
            itemsHTML += `
                <div class="promo-card">
                    <img src="${imgSrc}" alt="${item.name}" class="promo-img" onerror="this.src='https://via.placeholder.com/60x60'">
                    <div class="promo-details">
                        <h4>${item.name}</h4>
                        <div>
                            <span class="promo-price">R$ ${promo.promoPrice.toFixed(2).replace('.', ',')}</span>
                            <span class="original-price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    if (itemsHTML === '') return;

    promoContainer.innerHTML = `
        <div class="promo-banner">
            <h2><i class="fas fa-tags"></i> Promoções de ${diaNome}</h2>
            <div class="promo-items">
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

    const today = new Date().getDay();
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
                ${isPromo ? '<div style="position:absolute; top:10px; right:10px; background: linear-gradient(135deg, #ff5252 0%, #e8321f 100%); color:white; padding:6px 14px; border-radius:30px; font-weight:900; font-size:0.85rem; z-index:10; box-shadow: 0 6px 15px rgba(255, 82, 82, 0.5); letter-spacing: 1px;">PROMOÇÃO</div>' : ''}
                <img src="${imgSrc}" alt="${item.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indisponivel'">
            </div>
            <div class="product-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="product-footer">
                    <div class="price-wrapper">
                        <span class="price-label">a partir de</span><br>
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
let menuItems = [];

// Elementos do DOM
const menuGrid = document.getElementById('menuGrid');
const categoryContainer = document.getElementById('categoryContainer');
const searchInput = document.getElementById('searchInput');

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
    renderCategories();
    renderMenu();
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

    filteredItems.forEach((item, index) => {
        // Correção de caminho para GitHub Pages
        let imgSrc = item.image;
        if (imgSrc.startsWith('assets/')) {
            imgSrc = './' + imgSrc;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${imgSrc}" alt="${item.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indisponivel'">
            </div>
            <div class="product-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="product-footer">
                    <div class="price-wrapper">
                        <span class="price-label">a partir de</span>
                        <span class="price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
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
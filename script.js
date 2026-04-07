let menuItems = [];

// DOM Elements
const menuGrid = document.getElementById('menuGrid');
const categoryContainer = document.getElementById('categoryContainer');
const searchInput = document.getElementById('searchInput');

// Configurações de Labels (Devem ser iguais às categorias do seu XML/menuData)
const categoryLabels = {
    'all': '🍽️ Todos',
    'burgers': '🍔 Burgers',
    'coxinha': '🍗 Coxinha',
    'bolinho': '🥟 Bolinho',
    'esfirra': '🫓 Esfirra',
    'croissant': '🥐 Croissant',
    'drinks': '🥤 Bebidas',
    'desserts': '🍮 Sobremesas'
};

// Carregamento do Menu
async function loadMenu() {
    try {
        // No GitHub Pages, usamos caminhos relativos ./
        const response = await fetch('./items.xml?v=' + Date.now());
        if (response.ok) {
            const str = await response.text();
            const data = new window.DOMParser().parseFromString(str, "text/xml");
            const items = data.getElementsByTagName("item");

            if (items.length > 0) {
                menuItems = Array.from(items).map(item => ({
                    id: item.getElementsByTagName("id")[0]?.textContent || '',
                    name: item.getElementsByTagName("name")[0]?.textContent || '',
                    category: item.getElementsByTagName("category")[0]?.textContent?.toLowerCase() || '',
                    price: parseFloat(item.getElementsByTagName("price")[0]?.textContent) || 0,
                    description: item.getElementsByTagName("description")[0]?.textContent || '',
                    image: item.getElementsByTagName("image")[0]?.textContent || ''
                }));
                renderAll();
                return;
            }
        }
    } catch (e) {
        console.warn("XML não encontrado. Tentando menuData.js...");
    }

    if (window.menuItemsData && window.menuItemsData.length > 0) {
        menuItems = window.menuItemsData;
        renderAll();
    } else {
        menuGrid.innerHTML = '<p style="text-align:center; color:white;">Erro ao carregar produtos.</p>';
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

        pill.addEventListener('click', () => {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            renderMenu(cat, searchInput.value);
        });
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

    filteredItems.forEach((item, index) => {
        // Correção de caminho para o GitHub Pages
        let imgSrc = item.image;
        
        // Se a imagem começa com 'assets/', garantimos que o caminho comece com './assets/'
        if (imgSrc.startsWith('assets/')) {
            imgSrc = './' + imgSrc;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${imgSrc}" alt="${item.name}" class="product-image" 
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Imagem+Indisponivel';">
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

    renderWhatsAppBanner();
}

function renderWhatsAppBanner() {
    const banner = document.createElement('div');
    banner.className = 'whatsapp-group-banner';
    banner.innerHTML = `
        <div class="wg-banner-content">
            <div class="wg-icon"><i class="fab fa-whatsapp"></i></div>
            <div class="wg-text">
                <strong>Quer receber nossas ofertas diárias? 🎉</strong><br>
                <span>Entre no nosso grupo e aproveite!</span>
            </div>
            <a href="https://chat.whatsapp.com/HgplOITiLRwKua9uh7a7Qv" target="_blank" class="wg-btn">Entrar</a>
        </div>
    `;
    menuGrid.appendChild(banner);
}

// Eventos e Inicialização
searchInput.addEventListener('input', (e) => {
    const activePill = document.querySelector('.category-pill.active');
    renderMenu(activePill ? activePill.dataset.category : 'all', e.target.value);
});

window.onload = loadMenu;

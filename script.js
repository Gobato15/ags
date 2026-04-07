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
    'drinks': '🥤 Bebidas',
    'desserts': '🍮 Sobremesas'
};

// Carregamento do Menu (XML com Fallback)
async function loadMenu() {
    try {
        const response = await fetch('./items.xml?v=' + Date.now());
        if (response.ok) {
            const str = await response.text();
            const data = new window.DOMParser().parseFromString(str, "text/xml");

            // Verifica erro de parse
            if (data.getElementsByTagName("parsererror").length > 0) throw new Error("Erro no XML");

            const items = data.getElementsByTagName("item");
            if (items.length > 0) {
                menuItems = Array.from(items).map(item => ({
                    id: item.getElementsByTagName("id")[0]?.textContent || '',
                    name: item.getElementsByTagName("name")[0]?.textContent || '',
                    category: item.getElementsByTagName("category")[0]?.textContent || '',
                    price: parseFloat(item.getElementsByTagName("price")[0]?.textContent) || 0,
                    description: item.getElementsByTagName("description")[0]?.textContent || '',
                    image: item.getElementsByTagName("image")[0]?.textContent || ''
                }));
                renderAll();
                return;
            }
        }
    } catch (e) {
        console.warn("XML falhou, tentando menuData.js:", e.message);
    }

    // Fallback para dados locais
    if (window.menuItemsData) {
        menuItems = window.menuItemsData;
        renderAll();
    }
}

function renderAll() {
    renderCategories();
    renderMenu();
}

// Gera os filtros de categoria
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

// Renderiza os cards do menu
function renderMenu(filter = 'all', searchQuery = '') {
    menuGrid.innerHTML = '';

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = filter === 'all' || item.category === filter;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filteredItems.length === 0) {
        menuGrid.innerHTML = `<div class="empty-state"><p>Nenhum item encontrado.</p></div>`;
        return;
    }

    filteredItems.forEach((item, index) => {
        // Ajuste de caminho para imagens locais
        let imgSrc = item.image;
        if (imgSrc.startsWith('assets/')) imgSrc = './' + imgSrc;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${imgSrc}" alt="${item.name}" class="product-image" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indisponivel'">
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
                <strong>Quer receber nossas ofertas diárias? 🎉</strong>
                <span>Entre no nosso grupo e fique por dentro das promoções!</span>
            </div>
            <a href="https://chat.whatsapp.com/HgplOITiLRwKua9uh7a7Qv" target="_blank" class="wg-btn">Entrar no Grupo</a>
        </div>
    `;
    menuGrid.appendChild(banner);
}

// Efeito de scroll
window.onscroll = () => {
    const header = document.querySelector('header');
    if (header) {
        window.scrollY > 20 ? header.classList.add('scrolled', 'glass') : header.classList.remove('scrolled', 'glass');
    }
};

// Pesquisa
searchInput.oninput = (e) => {
    const activePill = document.querySelector('.category-pill.active');
    renderMenu(activePill?.dataset.category || 'all', e.target.value);
};

window.onload = loadMenu;
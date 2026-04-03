let menuItems = [];

// DOM Elements
const menuGrid = document.getElementById('menuGrid');
const categoryContainer = document.getElementById('categoryContainer');
const searchInput = document.getElementById('searchInput');

// Labels para as categorias (opcional, para exibir nomes mais bonitos)
const categoryLabels = {
    'all': 'Todos',
    'burgers': 'Burgers',
    'esfirra': 'Esfirra',
    'croissant': 'Croissant',
    'drinks': 'Bebidas',
    'desserts': 'Sobremesas'
};

// Fetch and Parse XML
async function loadMenu() {
    console.log("Iniciando carregamento do cardápio...");

    try {
        console.log("Tentando carregar items.xml...");
        const response = await fetch('items.xml?v=' + Date.now());
        
        if (response.ok) {
            const str = await response.text();
            const data = new window.DOMParser().parseFromString(str, "text/xml");
            
            const parseError = data.getElementsByTagName("parsererror");
            if (parseError.length > 0) throw new Error("Erro de XML");

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
                
                renderCategories();
                renderMenu();
                return;
            }
        }
    } catch (e) {
        console.warn("Fetch XML falhou, tentando fallback...", e.message);
    }

    if (window.menuItemsData) {
        menuItems = window.menuItemsData;
        renderCategories();
        renderMenu();
    }
}

// Generate Categories dynamically
function renderCategories() {
    const categories = ['all', ...new Set(menuItems.map(item => item.category))];
    
    categoryContainer.innerHTML = '';
    
    categories.forEach(cat => {
        const pill = document.createElement('div');
        pill.className = `category-pill ${cat === 'all' ? 'active' : ''}`;
        pill.dataset.category = cat;
        
        // Usa o label mapeado ou coloca a primeira letra em maiúsculo
        const label = categoryLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
        pill.textContent = label;
        
        pill.addEventListener('click', () => {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            renderMenu(cat, searchInput.value);
        });
        
        categoryContainer.appendChild(pill);
    });
}

// Initial Render
function renderMenu(filter = 'all', searchQuery = '') {
    menuGrid.innerHTML = '';
    
    const filteredItems = menuItems.filter(item => {
        const matchesCategory = filter === 'all' || item.category === filter;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filteredItems.length === 0) {
        menuGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem;">Nenhum item encontrado.</p>';
        return;
    }

    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card glass';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="product-image">
            <div class="product-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="product-footer">
                    <span class="price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        `;
        menuGrid.appendChild(card);
    });
}

searchInput.addEventListener('input', (e) => {
    const activePill = document.querySelector('.category-pill.active');
    const activeCategory = activePill ? activePill.dataset.category : 'all';
    renderMenu(activeCategory, e.target.value);
});

// Initial load
window.onload = () => {
    loadMenu();
};

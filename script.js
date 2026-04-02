let menuItems = [];

// DOM Elements
const menuGrid = document.getElementById('menuGrid');
const categoryPills = document.querySelectorAll('.category-pill');
const searchInput = document.getElementById('searchInput');

// Fetch and Parse XML
async function loadMenu() {
    console.log("Iniciando carregamento do cardápio...");

    const isLocalFile = window.location.protocol === 'file:';

    // Se menuItemsData estiver disponível ou se estivermos em arquivo local sem servidor, use os dados JS
    if (window.menuItemsData || isLocalFile) {
        if (window.menuItemsData) {
            console.log("Modo Local: Carregando dados de menuData.js...");
            menuItems = window.menuItemsData;
            renderMenu();
            return;
        } else if (isLocalFile) {
            console.error("ERRO: menuData.js não foi carregado corretamente.");
            menuGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #cc0000; border: 1px dashed #ff4d4d; border-radius: 12px; background: #fff5f5;">
                    <h3>Dados não encontrados!</h3>
                    <p>O arquivo <strong>menuData.js</strong> parece estar faltando ou vazio.</p>
                </div>
            `;
            return;
        }
    }

    try {
        const response = await fetch('items.xml');
        console.log("Status da resposta XML:", response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - Verifique se você está usando um servidor como o Apache do XAMPP.`);
        }

        const str = await response.text();
        const data = new window.DOMParser().parseFromString(str, "text/xml");
        
        // Verifica se houve erro de parse no XML
        const parseError = data.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            console.error("Erro de parse no XML:", parseError[0].textContent);
            throw new Error("O arquivo items.xml contém erros de sintaxe.");
        }

        const items = data.getElementsByTagName("item");
        console.log(`Itens encontrados no XML: ${items.length}`);
        
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

        renderMenu();
    } catch (error) {
        console.error("DEBUG - Detalhes do Erro:", error);
        menuGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #cc0000; border: 1px dashed #ff4d4d; border-radius: 12px; background: #fff5f5;">
                <h3>Oops! Não conseguimos carregar o menu.</h3>
                <p>${error.message}</p>
                <p style="font-size: 0.8rem; margin-top: 1rem; color: #666;">Dica: Certifique-se de acessar via <strong>http://localhost/ags/index.html</strong> e não diretamente pelo arquivo.</p>
            </div>
        `;
    }
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

// Event Listeners
categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderMenu(pill.dataset.category, searchInput.value);
    });
});

searchInput.addEventListener('input', (e) => {
    const activeCategory = document.querySelector('.category-pill.active').dataset.category;
    renderMenu(activeCategory, e.target.value);
});

// Initial load
window.onload = () => {
    loadMenu();
};

let menuItems = [];
let cart = [];

// Estado da aba de promoções
let currentPromoDay = new Date().getDay();
if (currentPromoDay < 1 || currentPromoDay > 5) currentPromoDay = 1;

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
    1: [ // Segunda: Hamburguinhos, Pão Caseiro e Doce de Abacaxi
        { id: "0", promoPrice: 7.00 },
        { id: "4", promoPrice: 10.00 },
        { id: "31", promoPrice: 11.00 },
        { id: "28", promoPrice: 6.00 }
    ],
    2: [ // Terça: Croissant e Pizzas Brotinho
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
    5: [ // Sexta: Bolo Prestigio e Torta de Frango
        { id: "18", promoPrice: 7.00 },
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

    return `
        <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden product-card ${isPromo ? 'promo-border' : ''}" style="animation: slideUp 0.5s ease forwards; animation-delay: ${index * 0.05}s">
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
                            <span class="d-block text-uppercase fw-bold text-muted mb-1" style="font-size: 0.6rem; letter-spacing: 0.5px;">a partir de</span>
                            <div class="d-flex align-items-center">
                                ${originalPriceHTML}
                                <span class="h5 fw-bold mb-0 ${promoClasses}">R$ ${displayPrice.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                        <button class="btn-add-cart" onclick="addToCart('${item.id}', '${item.name}', ${displayPrice})" aria-label="Adicionar ao carrinho">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

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
        6: 'linear-gradient(135deg, #e8321f 0%, #ff5252 100%)'
    };

    let itemsHTML = '';
    todaysPromos.forEach((promo, index) => {
        const item = menuItems.find(i => i.id === promo.id);
        if (item) {
            itemsHTML += `
                <div class="promo-product-card" style="flex: 0 1 320px; width: 100%;">
                    ${createProductCard(item, true, promo.promoPrice, index)}
                </div>
            `;
        }
    });

    const dayBtnsHTML = [1, 2, 3, 4, 5].map(d => {
        const names = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
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
            <div class="promo-items d-flex flex-wrap justify-content-center gap-4">
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
window.addToCart = function (id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCartUI();

    // Feedback visual no ícone
    if (event && event.currentTarget) {
        const btn = event.currentTarget;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.classList.add('active');
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-plus"></i>';
            btn.classList.remove('active');
        }, 1000);
    }
};

window.toggleDeliveryFields = function () {
    const isEntrega = document.getElementById('modeEntrega').checked;
    const deliveryFields = document.getElementById('deliveryAddressFields');
    const freightRow = document.getElementById('freightRow');

    if (isEntrega) {
        deliveryFields.style.display = 'block';
        freightRow.style.setProperty('display', 'flex', 'important');
    } else {
        deliveryFields.style.display = 'none';
        freightRow.style.setProperty('display', 'none', 'important');
    }
    updateCartUI();
};

window.checkCep = function (input) {
    let cep = input.value.replace(/\D/g, '');
    if (cep.length > 5) {
        input.value = cep.substring(0, 5) + '-' + cep.substring(5, 8);
    } else {
        input.value = cep;
    }

    if (cep.length === 8) {
        fetchAddress(cep);
    }
};

async function fetchAddress(cep) {
    const cityField = document.getElementById('deliveryCity');
    const streetField = document.getElementById('deliveryStreet');

    cityField.value = "Buscando...";
    streetField.value = "Buscando...";

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
            cityField.value = `${data.localidade} - ${data.bairro}`;
            streetField.value = data.logradouro;
            calculateFreight(cep);
        } else {
            alert("CEP não encontrado!");
            cityField.value = "";
            streetField.value = "";
        }
    } catch (e) {
        console.error("Erro ao buscar CEP", e);
        cityField.value = "";
        streetField.value = "";
    }
}

let deliveryFee = 0;
let deliveryDistance = 0;

window.calculateFreight = function (cep) {
    if (!cep) cep = document.getElementById('deliveryCep').value.replace(/\D/g, '');
    const freightElement = document.getElementById('cartFreight');

    if (cep.length === 8) {
        // Simulação de distância (Integrado à lógica de entrega inteligente)
        const lastDigits = parseInt(cep.substring(5));
        deliveryDistance = 1 + (lastDigits % 10);

        // Regra de Negócio Atualizada:
        // Base: R$ 7,00 (Válido para qualquer entrega até 3 km)
        // Adicional: R$ 0,60 por km rodado que exceder os 3 km iniciais
        let baseFee = 7.00;
        let increment = 0;

        if (deliveryDistance > 3) {
            increment = (deliveryDistance - 3) * 0.60;
        }

        deliveryFee = baseFee + increment;

        freightElement.textContent = `R$ ${deliveryFee.toFixed(2).replace('.', ',')} (${deliveryDistance.toFixed(1)}km)`;
    } else {
        deliveryFee = 0;
        deliveryDistance = 0;
        freightElement.textContent = 'R$ 0,00';
    }
    updateCartUI();
};

window.removeFromCart = function (index) {
    cart.splice(index, 1);
    updateCartUI();
};

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartFreight = document.getElementById('cartFreight');

    if (!cartItemsContainer || !cartCount || !cartTotal) return;

    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted text-center my-4 py-4 bg-light rounded-4">Seu carrinho está vazio.</p>';
        cartTotal.textContent = 'R$ 0,00';
        if (cartSubtotal) cartSubtotal.textContent = 'R$ 0,00';
        if (cartFreight) cartFreight.textContent = 'R$ 0,00';
        return;
    }

    let itemsHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        itemsHTML += `
            <div class="cart-item shadow-sm border p-3 rounded-4 mb-2">
                <div class="flex-grow-1">
                    <h6 class="fw-bold mb-0">${item.name}</h6>
                    <small class="text-muted">${item.quantity}x R$ ${item.price.toFixed(2).replace('.', ',')}</small>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-success mb-1">R$ ${itemTotal.toFixed(2).replace('.', ',')}</div>
                    <button class="btn btn-sm btn-outline-danger border-0 rounded-circle" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = itemsHTML;

    const isEntrega = document.getElementById('modeEntrega') ? document.getElementById('modeEntrega').checked : false;
    const currentFreight = isEntrega ? deliveryFee : 0;
    const finalTotal = subtotal + currentFreight;

    if (cartSubtotal) cartSubtotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if (cartFreight) cartFreight.textContent = `R$ ${currentFreight.toFixed(2).replace('.', ',')}`;
    cartTotal.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
}

window.copyPix = function () {
    const pixKey = document.getElementById('pixKey');
    pixKey.select();
    pixKey.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(pixKey.value);

    const btn = event.currentTarget;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check me-1"></i> Copiado!';
    btn.classList.replace('btn-primary', 'btn-success');

    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.replace('btn-success', 'btn-primary');
    }, 2000);
};

window.checkout = function () {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const isEntrega = document.getElementById('modeEntrega').checked;

    if (!name || !phone) {
        alert("Por favor, preencha seu nome e telefone!");
        return;
    }

    const chavePix = "00ede306-8a84-4955-939c-ead6e5a81781";

    let modalidadeStr = isEntrega ? 'Entrega' : 'Retirada';
    if (isEntrega) {
        const street = document.getElementById('deliveryStreet').value;
        const number = document.getElementById('deliveryNumber').value;
        const note = document.getElementById('deliveryNote').value;
        modalidadeStr += ` (${street}, ${number}${note ? ' - ' + note : ''})`;
    }

    let message = `*Novo Pedido — AGS Delivery*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `*Cliente:* ${name}\n`;
    message += `*Contato:* ${phone}\n`;
    message += `*Modalidade:* ${modalidadeStr}\n\n`;

    message += `*Itens:*\n`;
    cart.forEach(item => {
        message += `• ${item.quantity}x ${item.name}\n`;
    });

    const currentFreight = isEntrega ? deliveryFee : 0;
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const total = subtotal + currentFreight;

    message += `\n*Total a Pagar: R$ ${total.toFixed(2).replace('.', ',')}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `*Pagamento via PIX*\n`;
    message += `Chave Aleatória: \`${chavePix}\`\n`;
    message += `Favorecido: Mauricio R. Gobato\n`;
    message += `*Banco Santander*\n\n`;
    message += `_Por favor, anexe o comprovante abaixo._`;

    const whatsappUrl = `https://wa.me/5519997035700?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
};

// Carregamento inicial
window.onload = loadMenu;

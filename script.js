// ========================================
// CONFIGURAÇÕES INICIAIS
// ========================================
let cart = [];
let appliedCoupon = false;
let discountAmount = 0;
const VALID_COUPON = "MAQUINA10";
const DISCOUNT_PERCENTAGE = 10;

// Estoque inicial dos produtos
let stock = {
    'air-cooler': 15,
    'fonte-notebook': 8,
    'fonte-kmex': 3,
    'water-cooler': 22
};

// ========================================
// FUNÇÕES DE NAVEGAÇÃO
// ========================================
function showPage(pageId) {
    console.log('Mostrando página:', pageId);
    
    // Esconde todas as páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostra a página selecionada
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Atualiza header
        updateHeader(pageId);
        
        // Atualiza conteúdo específico
        if (pageId === 'cart-page') {
            renderCart();
        } else if (pageId === 'checkout-page') {
            renderCheckoutItems();
        } else if (pageId === 'confirmation-page') {
            renderConfirmation();
        }
        
        // Rola para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateHeader(pageId) {
    const header = document.getElementById('main-header');
    if (header) {
        if (pageId === 'home-page' || pageId === 'confirmation-page') {
            header.style.display = 'none';
        } else {
            header.style.display = 'block';
        }
    }
}

// ========================================
// DESCRIÇÕES DOS PRODUTOS
// ========================================
function showDescription(productId) {
    const descElement = document.getElementById(`desc-${productId}`);
    if (descElement) {
        descElement.style.transform = 'translateY(0)';
        descElement.style.opacity = '1';
        descElement.style.visibility = 'visible';
    }
}

function hideDescription(productId) {
    const descElement = document.getElementById(`desc-${productId}`);
    if (descElement) {
        descElement.style.transform = 'translateY(-100%)';
        descElement.style.opacity = '0';
        descElement.style.visibility = 'hidden';
    }
}

// ========================================
// FUNÇÕES DO CARRINHO E ESTOQUE
// ========================================
function addToCart(productName, price, productId) {
    console.log('Adicionando ao carrinho:', productName, 'Produto ID:', productId);
    
    // Verifica se tem estoque
    const currentStock = stock[productId] || 0;
    
    if (currentStock <= 0) {
        showNotification('❌ Produto esgotado!', 'error');
        updateStockDisplay(productId);
        return;
    }
    
    // Verifica quantos já estão no carrinho
    const cartQuantity = cart.reduce((total, item) => {
        if (item.productId === productId) return total + item.quantity;
        return total;
    }, 0);
    
    if (cartQuantity >= currentStock) {
        showNotification('❌ Quantidade máxima em estoque atingida!', 'error');
        return;
    }
    
    // Verifica se o produto já está no carrinho
    const existingItem = cart.find(item => item.name === productName && item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: productName,
            price: price,
            quantity: 1,
            productId: productId
        });
    }
    
    // Não diminui o estoque ainda - só na finalização
    // O estoque é atualizado apenas visualmente
    updateStockDisplay(productId);
    updateCartCount();
    updateCartSummary();
    showNotification(`✅ ${productName} adicionado ao carrinho!`);
    
    // Atualiza botões de acordo com o estoque
    updateProductButtons();
}

function updateStockDisplay(productId) {
    const stockElement = document.getElementById(`stock-${productId}`);
    if (stockElement) {
        const currentStock = stock[productId] || 0;
        const cartQuantity = cart.reduce((total, item) => {
            if (item.productId === productId) return total + item.quantity;
            return total;
        }, 0);
        
        const availableStock = currentStock - cartQuantity;
        stockElement.textContent = availableStock;
        
        // Atualiza estilo baseado no estoque
        const stockInfo = stockElement.closest('.stock-info');
        if (stockInfo) {
            stockInfo.classList.remove('low-stock', 'out-of-stock');
            
            if (availableStock <= 0) {
                stockInfo.classList.add('out-of-stock');
                stockElement.textContent = 'ESGOTADO';
            } else if (availableStock <= 5) {
                stockInfo.classList.add('low-stock');
            }
        }
    }
}

function updateProductButtons() {
    // Atualiza todos os botões baseado no estoque
    Object.keys(stock).forEach(productId => {
        const button = document.querySelector(`button[onclick*="${productId}"]`);
        const currentStock = stock[productId] || 0;
        const cartQuantity = cart.reduce((total, item) => {
            if (item.productId === productId) return total + item.quantity;
            return total;
        }, 0);
        
        if (button) {
            if (currentStock - cartQuantity <= 0) {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-times"></i> ESGOTADO';
            } else if (currentStock - cartQuantity <= 3) {
                button.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ÚLTIMAS ${currentStock - cartQuantity} UNIDADES`;
            }
        }
    });
}

function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = total;
    
    // Atualiza botão de checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = total === 0;
    }
}

function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateDiscount(subtotal) {
    if (appliedCoupon) {
        discountAmount = (subtotal * DISCOUNT_PERCENTAGE) / 100;
        return discountAmount;
    }
    return 0;
}

function calculateShipping(subtotal) {
    return subtotal > 500 ? 0 : 25.90;
}

function calculateTotal() {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    const shipping = calculateShipping(subtotal - discount);
    return (subtotal - discount) + shipping;
}

function formatPrice(price) {
    return price.toFixed(2).replace('.', ',');
}

function updateCartSummary() {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    const shipping = calculateShipping(subtotal - discount);
    const total = calculateTotal();
    
    document.getElementById('subtotal-price').textContent = formatPrice(subtotal);
    document.getElementById('shipping-price').textContent = formatPrice(shipping);
    document.getElementById('total-price').textContent = formatPrice(total);
    
    // Atualiza seção de desconto
    const discountSection = document.getElementById('discount-section');
    const discountAmountElement = document.getElementById('discount-amount');
    
    if (discount > 0) {
        discountAmountElement.textContent = formatPrice(discount);
        discountSection.style.display = 'flex';
    } else {
        discountSection.style.display = 'none';
    }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ccc;"></i>
                <h3 style="color: #666; margin: 15px 0;">Seu carrinho está vazio</h3>
                <button onclick="showPage('products-page')" style="margin-top: 20px; padding: 12px 30px; background: #667eea; color: white; border: none; border-radius: 25px; cursor: pointer;">
                    <i class="fas fa-store"></i> Ver Produtos
                </button>
            </div>
        `;
    } else {
        let html = '';
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            const currentStock = stock[item.productId] || 0;
            const maxQuantity = currentStock;
            
            html += `
                <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #eee;">
                    <div style="flex: 1;">
                        <strong style="color: #333; font-size: 1.1rem;">${item.name}</strong>
                        <div style="color: #666; font-size: 0.9rem; margin-top: 5px;">
                            <i class="fas fa-box"></i> Disponível: ${maxQuantity - item.quantity} unidades
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px; margin-top: 10px;">
                            <div style="display: flex; align-items: center; gap: 10px; background: #f5f7fa; padding: 5px 15px; border-radius: 20px;">
                                <button onclick="updateQuantity(${index}, -1)" style="background: none; border: none; color: #667eea; cursor: pointer; font-size: 1.2rem;" ${item.quantity <= 1 ? 'disabled style="color: #ccc;"' : ''}>-</button>
                                <span style="font-weight: bold; min-width: 30px; text-align: center;">${item.quantity}</span>
                                <button onclick="updateQuantity(${index}, 1)" style="background: none; border: none; color: #667eea; cursor: pointer; font-size: 1.2rem;" ${item.quantity >= maxQuantity ? 'disabled style="color: #ccc;"' : ''}>+</button>
                            </div>
                            <span style="color: #667eea; font-weight: bold;">R$ ${formatPrice(item.price)} cada</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2rem; color: #667eea; font-weight: bold; margin-bottom: 10px;">
                            R$ ${formatPrice(itemTotal)}
                        </div>
                        <button onclick="removeFromCart(${index})" style="background: #ff6b6b; color: white; border: none; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-size: 0.9rem;">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    updateCartSummary();
}

function updateQuantity(index, change) {
    if (index < 0 || index >= cart.length) return;
    
    const item = cart[index];
    const currentStock = stock[item.productId] || 0;
    const maxQuantity = currentStock;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    if (newQuantity > maxQuantity) {
        showNotification(`❌ Máximo de ${maxQuantity} unidades disponíveis!`, 'error');
        return;
    }
    
    item.quantity = newQuantity;
    updateCartCount();
    renderCart();
    updateCartSummary();
    updateStockDisplay(item.productId);
    updateProductButtons();
}

function removeFromCart(index) {
    if (index < 0 || index >= cart.length) return;
    
    const removedItem = cart[index];
    cart.splice(index, 1);
    
    updateCartCount();
    renderCart();
    updateCartSummary();
    updateStockDisplay(removedItem.productId);
    updateProductButtons();
    showNotification('🗑️ Produto removido do carrinho');
}

function goToCart() {
    if (cart.length === 0) {
        showNotification('🛒 Adicione produtos ao carrinho primeiro!', 'info');
    } else {
        showPage('cart-page');
    }
}

function showCart() {
    showPage('cart-page');
}

// ========================================
// CUPOM DE DESCONTO
// ========================================
function applyCoupon() {
    const couponInput = document.getElementById('coupon-code');
    const couponMessage = document.getElementById('coupon-message');
    
    if (!couponInput || !couponMessage) return;
    
    const enteredCoupon = couponInput.value.trim().toUpperCase();
    
    if (!enteredCoupon) {
        couponMessage.className = 'coupon-message error';
        couponMessage.textContent = 'Digite um código de cupom';
        couponMessage.style.display = 'block';
        return;
    }
    
    if (enteredCoupon === VALID_COUPON) {
        if (appliedCoupon) {
            couponMessage.className = 'coupon-message error';
            couponMessage.textContent = 'Cupom já aplicado!';
            couponMessage.style.display = 'block';
        } else {
            appliedCoupon = true;
            couponMessage.className = 'coupon-message success';
            couponMessage.textContent = `🎉 Cupom aplicado! ${DISCOUNT_PERCENTAGE}% de desconto concedido!`;
            couponMessage.style.display = 'block';
            couponInput.disabled = true;
            
            // Atualiza totais
            updateCartSummary();
            
            // Mostra notificação
            showNotification(`🎁 Cupom MAQUINA10 aplicado! ${DISCOUNT_PERCENTAGE}% de desconto!`);
        }
    } else {
        couponMessage.className = 'coupon-message error';
        couponMessage.textContent = 'Cupom inválido ou expirado';
        couponMessage.style.display = 'block';
    }
}

// ========================================
// CHECKOUT
// ========================================
function renderCheckoutItems() {
    const container = document.getElementById('checkout-items');
    if (!container) return;
    
    if (cart.length === 0) return;
    
    let html = '<div style="background: white; border-radius: 15px; padding: 25px; margin-bottom: 30px;">';
    html += '<h3 style="color: #667eea; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;"><i class="fas fa-box"></i> RESUMO DOS ITENS</h3>';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div>
                    <strong style="color: #333;">${item.name}</strong>
                    <div style="color: #666; font-size: 0.9rem;">Quantidade: ${item.quantity}</div>
                </div>
                <span style="color: #667eea; font-weight: bold;">R$ ${formatPrice(itemTotal)}</span>
            </div>
        `;
    });
    
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    const shipping = calculateShipping(subtotal - discount);
    const total = calculateTotal();
    
    html += `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #667eea;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Subtotal:</span>
                <span>R$ ${formatPrice(subtotal)}</span>
            </div>
    `;
    
    if (discount > 0) {
        html += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #4caf50;">
                <span>Desconto:</span>
                <span>- R$ ${formatPrice(discount)}</span>
            </div>
        `;
    }
    
    html += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Frete:</span>
                <span>${shipping === 0 ? 'GRÁTIS' : `R$ ${formatPrice(shipping)}`}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold; color: #667eea; padding-top: 10px; border-top: 1px solid #eee;">
                <span>Total:</span>
                <span>R$ ${formatPrice(total)}</span>
            </div>
        </div>
    </div>
    `;
    
    container.innerHTML = html;
}

document.getElementById('checkout-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validação simples
    const required = ['customer-name', 'customer-cpf', 'customer-email', 'customer-phone', 'customer-cep', 'customer-street', 'customer-number', 'customer-city', 'payment-method'];
    let isValid = true;
    
    required.forEach(id => {
        const field = document.getElementById(id);
        if (!field || !field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#ff6b6b';
        } else {
            field.style.borderColor = '';
        }
    });
    
    if (!isValid) {
        showNotification('⚠️ Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    // Validação de email
    const email = document.getElementById('customer-email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('⚠️ Digite um email válido!', 'error');
        return;
    }
    
    // Verifica se ainda há estoque (caso alguém compre ao mesmo tempo)
    let hasStock = true;
    cart.forEach(item => {
        const currentStock = stock[item.productId] || 0;
        if (item.quantity > currentStock) {
            hasStock = false;
            showNotification(`❌ ${item.name} não tem estoque suficiente!`, 'error');
        }
    });
    
    if (!hasStock) return;
    
    // Mostra página de confirmação
    showNotification('⏳ Processando seu pedido...', 'info');
    
    // Simula processamento
    setTimeout(() => {
        // Atualiza estoque (simulação de compra real)
        cart.forEach(item => {
            if (stock[item.productId] !== undefined) {
                stock[item.productId] -= item.quantity;
                if (stock[item.productId] < 0) stock[item.productId] = 0;
            }
        });
        
        showPage('confirmation-page');
        showNotification('✅ Pedido confirmado com sucesso!', 'success');
    }, 1000);
});

// ========================================
// CONFIRMAÇÃO
// ========================================
function renderConfirmation() {
    // Atualiza data
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('current-date').textContent = dateStr;
    
    // Gera número do pedido
    const orderNumber = 'GTECH-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    document.getElementById('order-number').textContent = orderNumber;
    
    // Renderiza itens
    const container = document.getElementById('confirmation-items');
    if (container) {
        let html = '';
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            html += `<li>${item.name} (x${item.quantity}) - R$ ${formatPrice(itemTotal)}</li>`;
        });
        
        // Adiciona descontos
        const discount = calculateDiscount(subtotal);
        if (discount > 0) {
            html += `<li style="color: #4caf50;"><i class="fas fa-tag"></i> Desconto Cupom - R$ ${formatPrice(discount)}</li>`;
        }
        
        // Adiciona frete
        const shipping = calculateShipping(subtotal - discount);
        html += `<li><i class="fas fa-truck"></i> Frete - R$ ${formatPrice(shipping)}</li>`;
        
        container.innerHTML = html;
        
        // Atualiza total
        const total = calculateTotal();
        document.getElementById('confirmation-total').textContent = formatPrice(total);
    }
}

function resetStore() {
    // Limpa carrinho
    cart = [];
    appliedCoupon = false;
    discountAmount = 0;
    updateCartCount();
    
    // Limpa cupom
    const couponInput = document.getElementById('coupon-code');
    const couponMessage = document.getElementById('coupon-message');
    if (couponInput) {
        couponInput.value = '';
        couponInput.disabled = false;
    }
    if (couponMessage) {
        couponMessage.style.display = 'none';
    }
    
    // Limpa formulário
    document.getElementById('checkout-form')?.reset();
    
    // Atualiza displays de estoque
    Object.keys(stock).forEach(productId => {
        updateStockDisplay(productId);
    });
    
    updateProductButtons();
    
    // Volta para início
    showPage('home-page');
    showNotification('🔄 Loja reiniciada! Adicione novos produtos.', 'info');
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container') || (() => {
        const div = document.createElement('div');
        div.id = 'notification-container';
        document.body.appendChild(div);
        return div;
    })();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? '#ff6b6b' : 
                                   type === 'info' ? '#2196f3' : '#4caf50';
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 
                           type === 'info' ? 'info-circle' : 'check-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Remove após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// FUNÇÕES DO RODAPÉ E MODAIS
// ========================================
function showSocialMessage(platform) {
    showNotification(`📱 Visite-nos no ${platform}! Em breve essa função estará disponível.`, 'info');
}

function showContactModal() {
    document.getElementById('contact-modal').style.display = 'flex';
}

function closeContactModal() {
    document.getElementById('contact-modal').style.display = 'none';
}

function sendContactMessage() {
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;
    
    if (!name || !email || !message) {
        showNotification('⚠️ Preencha todos os campos do formulário!', 'error');
        return;
    }
    
    showNotification(`📩 Mensagem enviada com sucesso, ${name}! Responderemos em breve.`);
    closeContactModal();
    
    // Limpa o formulário
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-email').value = '';
    document.getElementById('contact-message').value = '';
}

function showTermsModal() {
    document.getElementById('terms-modal').style.display = 'flex';
}

function closeTermsModal() {
    document.getElementById('terms-modal').style.display = 'none';
}

function showPrivacyModal() {
    document.getElementById('privacy-modal').style.display = 'flex';
}

function closePrivacyModal() {
    document.getElementById('privacy-modal').style.display = 'none';
}

function showAboutModal() {
    document.getElementById('about-modal').style.display = 'flex';
}

function closeAboutModal() {
    document.getElementById('about-modal').style.display = 'none';
}

function subscribeNewsletter() {
    const emailInput = document.getElementById('newsletter-email');
    const messageElement = document.getElementById('newsletter-message');
    
    if (!emailInput || !emailInput.value.trim()) {
        messageElement.textContent = 'Digite seu email primeiro!';
        messageElement.className = 'newsletter-message error';
        messageElement.style.display = 'block';
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
        messageElement.textContent = 'Digite um email válido!';
        messageElement.className = 'newsletter-message error';
        messageElement.style.display = 'block';
        return;
    }
    
    messageElement.textContent = '🎉 Inscrição realizada com sucesso! Ofertas especiais a caminho!';
    messageElement.className = 'newsletter-message success';
    messageElement.style.display = 'block';
    emailInput.value = '';
    
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// ========================================
// SCROLL FUNCTIONS
// ========================================
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Verifica se deve mostrar o botão de voltar ao topo
window.addEventListener('scroll', function() {
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }
});

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 GTECH iniciado! Cupom disponível: MAQUINA10');
    
    // Configurações iniciais
    updateCartCount();
    
    // Atualiza displays de estoque inicial
    Object.keys(stock).forEach(productId => {
        updateStockDisplay(productId);
    });
    
    updateProductButtons();
    
    // Atualiza ano no footer
    const currentYear = new Date().getFullYear();
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = currentYear;
    }
    
    // Garante que a home page está ativa
    showPage('home-page');
    
    // Adiciona tecla Enter para cupom
    const couponInput = document.getElementById('coupon-code');
    if (couponInput) {
        couponInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyCoupon();
            }
        });
    }
    
    // Adiciona tecla Enter para newsletter
    const newsletterInput = document.getElementById('newsletter-email');
    if (newsletterInput) {
        newsletterInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                subscribeNewsletter();
            }
        });
    }
    
    // Adiciona tecla Enter para modal de contato
    const contactMessage = document.getElementById('contact-message');
    if (contactMessage) {
        contactMessage.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                sendContactMessage();
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Pega os parâmetros da URL para encontrar o ID do produto
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        // Se não houver ID, redireciona para a página inicial
        window.location.href = 'index.html';
        return;
    }

    loadProductDetails(productId);
});

async function loadProductDetails(productId) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    // Busca um único produto no Supabase usando o ID
    const { data: product, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single(); // .single() garante que esperamos apenas um resultado

    if (error || !product) {
        console.error('Erro ao buscar produto:', error);
        container.innerHTML = '<h2>Produto não encontrado</h2><p>O produto que você está procurando não existe ou foi removido.</p>';
        return;
    }

    // Formata os preços
    const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price);
    let priceHTML = `<span class="product-detail-price">${formattedPrice}</span>`;
    if (product.old_price) {
        const formattedOldPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.old_price);
        priceHTML = `<span class="product-detail-old-price">${formattedOldPrice}</span> ${priceHTML}`;
    }

    // Cria o HTML final para a página de detalhes
    const productDetailHTML = `
        <div class="product-detail-image">
            <img src="${product.image_url}" alt="${product.name}">
        </div>
        <div class="product-detail-info">
            <h1>${product.name}</h1>
            <div class="price-container">
                ${priceHTML}
            </div>
            <p class="product-detail-description">${product.description}</p>
            <button class="btn-primary add-to-cart-detail" data-product-id="${product.id}">Adicionar ao Carrinho</button>
        </div>
    `;

    container.innerHTML = productDetailHTML;

    // Adiciona o evento de clique ao novo botão "Adicionar ao Carrinho"
    const addToCartBtn = container.querySelector('.add-to-cart-detail');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCartClick);
    }
}


// A função handleAddToCartClick é uma cópia da que está em products.js
// Em um projeto maior, poderíamos movê-la para um arquivo compartilhado (utils.js)
async function handleAddToCartClick(event) {
    if (!event.target.matches('[data-product-id]')) { return; }
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { alert('Você precisa estar logado para adicionar itens ao carrinho.'); window.location.href = 'login.html'; return; }
    const userId = session.user.id;
    const productId = event.target.dataset.productId;
    const { data: existingItem, error: selectError } = await supabaseClient.from('cart_items').select('id, quantity').eq('user_id', userId).eq('product_id', productId).single();
    if (selectError && selectError.code !== 'PGRST116') { console.error('Erro ao verificar item no carrinho:', selectError); alert('Ocorreu um erro. Tente novamente.'); return; }
    if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        const { error: updateError } = await supabaseClient.from('cart_items').update({ quantity: newQuantity }).eq('id', existingItem.id);
        if (updateError) { console.error('Erro ao atualizar a quantidade:', updateError); alert('Não foi possível atualizar o item no carrinho.');
        } else { alert('Quantidade atualizada no carrinho!'); }
    } else {
        const { error: insertError } = await supabaseClient.from('cart_items').insert({ user_id: userId, product_id: productId, quantity: 1 });
        if (insertError) { console.error('Erro ao adicionar ao carrinho:', insertError); alert('Não foi possível adicionar o item ao carrinho.');
        } else { alert('Produto adicionado ao carrinho com sucesso!'); }
    }
    updateCartIconCount();
}
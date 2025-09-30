document.addEventListener('DOMContentLoaded', () => {
    // Pega os parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search'); // Procura por um parâmetro 'search'

    loadProducts(searchTerm); // Passa o termo de busca para a função

    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        productGrid.addEventListener('click', handleAddToCartClick);
    }
});

// A função agora aceita um 'searchTerm' opcional
async function loadProducts(searchTerm = null) {
    const productGrid = document.querySelector('.product-grid');
    const showcaseTitle = document.getElementById('showcase-title');
    if (!productGrid || !showcaseTitle) return;

    // Inicia a construção da query no Supabase
    let query = supabaseClient.from('products').select('*');

    // Se um termo de busca foi fornecido, adiciona um filtro à query
    if (searchTerm) {
        showcaseTitle.textContent = `Resultados para: "${searchTerm}"`;
        // '.or()' busca em múltiplas colunas. 'ilike' é case-insensitive (não diferencia maiúsculas/minúsculas)
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    } else {
        showcaseTitle.textContent = 'Promoções da Semana';
    }

    // Executa a query final
    const { data: products, error } = await query;

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        return;
    }

    productGrid.innerHTML = '';

    if (products.length === 0) {
        productGrid.innerHTML = '<p>Nenhum produto encontrado.</p>';
        return;
    }

    products.forEach(product => {
        // (O restante do código para criar os cards permanece o mesmo)
        const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price);
        let priceHTML = `<span class="new-price">${formattedPrice}</span>`;
        if (product.old_price) {
            const formattedOldPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.old_price);
            priceHTML = `<span class="old-price">${formattedOldPrice}</span> ${priceHTML}`;
        }
            const productCardHTML = `
            <article class="product-card">
                <a href="produto.html?id=${product.id}" class="product-link">
                    <img src="${product.image_url}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <div class="price">${priceHTML}</div>
                </a>
                <button class="btn-secondary" data-product-id="${product.id}">Adicionar ao Carrinho</button>
            </article>
        `;
        productGrid.insertAdjacentHTML('beforeend', productCardHTML);
    });
}

// A função handleAddToCartClick permanece a mesma
async function handleAddToCartClick(event) {
    // ...código existente, sem alterações...
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
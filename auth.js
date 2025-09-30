// --- INICIALIZAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://esumxtdobgtfnouownwq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdW14dGRvYmd0Zm5vdW93bndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTAyOTgsImV4cCI6MjA3NDc2NjI5OH0.7J4kXMP64GXbetvLI39fcDojfsoEN89scsyWtQfZmM4';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- LÓGICA DA PÁGINA DE LOGIN/CADASTRO ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.contains(document.getElementById('login-form'))) {
        // ... (todo o código dos formulários de login/cadastro permanece o mesmo)
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const loginContainer = document.getElementById('login-form-container');
        const signupContainer = document.getElementById('signup-form-container');
        const showSignupLink = document.getElementById('show-signup');
        const showLoginLink = document.getElementById('show-login');
        showSignupLink.addEventListener('click', (e) => { e.preventDefault(); loginContainer.style.display = 'none'; signupContainer.style.display = 'block'; });
        showLoginLink.addEventListener('click', (e) => { e.preventDefault(); loginContainer.style.display = 'block'; signupContainer.style.display = 'none'; });
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const messageEl = signupForm.querySelector('.form-message');
            const { data, error } = await supabaseClient.auth.signUp({ email: email, password: password });
            if (error) { messageEl.textContent = 'Erro: ' + error.message; messageEl.className = 'form-message error';
            } else { messageEl.textContent = 'Cadastro realizado com sucesso! Você já pode fazer o login.'; messageEl.className = 'form-message success'; signupForm.reset(); setTimeout(() => { loginContainer.style.display = 'block'; signupContainer.style.display = 'none'; }, 2000); }
        });
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const messageEl = loginForm.querySelector('.form-message');
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
            if (error) { messageEl.textContent = 'Erro: E-mail ou senha inválidos.'; messageEl.className = 'form-message error';
            } else { window.location.href = 'index.html'; }
        });
    }
});


// --- FUNÇÕES GLOBAIS DE AUTENTICAÇÃO E CARRINHO ---

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}

// NOVA FUNÇÃO para atualizar o contador do carrinho
async function updateCartIconCount() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const cartCountEl = document.querySelector('.cart-count');

    if (session && cartCountEl) {
        const { data, error, count } = await supabaseClient
            .from('cart_items')
            .select('*', { count: 'exact', head: true }) // Apenas conta as linhas
            .eq('user_id', session.user.id);
        
        if (error) {
            console.error("Erro ao contar itens do carrinho:", error);
            cartCountEl.textContent = '0';
        } else {
            cartCountEl.textContent = count;
        }
    } else if (cartCountEl) {
        cartCountEl.textContent = '0';
    }
}

function updateHeader(session) {
    const userAuthDiv = document.querySelector('.user-auth');
    const userProfileDiv = document.querySelector('.user-profile-container');

    if (session) {
        if (userAuthDiv) userAuthDiv.style.display = 'none';
        if (userProfileDiv) {
            userProfileDiv.style.display = 'flex';
            const userEmail = session.user.email;
            userProfileDiv.innerHTML = `<a href="perfil.html" class="user-profile"><i class="fas fa-user"></i><span>Olá, ${userEmail.split('@')[0]}</span></a><button id="logout-btn" class="logout-button" title="Sair"><i class="fas fa-sign-out-alt"></i></button>`;
            document.getElementById('logout-btn').addEventListener('click', logout);
        }
    } else {
        if (userAuthDiv) userAuthDiv.style.display = 'flex';
        if (userProfileDiv) userProfileDiv.style.display = 'none';
    }
}

// --- VERIFICAÇÃO DE ESTADO DO USUÁRIO EM TODAS AS PÁGINAS ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateHeader(session);
    updateCartIconCount(); // <-- CHAMADA AQUI
});

supabaseClient.auth.onAuthStateChange((event, session) => {
    updateHeader(session);
    updateCartIconCount(); // <-- E CHAMADA AQUI
});
// --- LÓGICA DA BARRA DE BUSCA ---
document.addEventListener('DOMContentLoaded', () => {
    // Procura pelo formulário de busca no cabeçalho
    const searchForm = document.querySelector('.search-bar');
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Impede o recarregamento padrão da página
            const searchInput = searchForm.querySelector('input[type="text"]');
            const searchTerm = searchInput.value.trim(); // Pega o valor e remove espaços extras

            if (searchTerm) {
                // Redireciona para a página inicial com o termo de busca como um parâmetro na URL
                window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    }
});
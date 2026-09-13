/* =========================================
   PIZZARIA ALMEIDA

   CARRINHO + SUPABASE + CHECKOUT
   CATEGORIAS DINÂMICAS + REALTIME
   ENTREGA + CÁLCULO DE DISTÂNCIA
   WHATSAPP DA LOJA VIA SUPABASE
   CEP + PREENCHIMENTO AUTOMÁTICO
   TROCO SOMENTE PARA DINHEIRO
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       ELEMENTOS DO CARRINHO
    ========================================= */

    const cartButton =
        document.querySelector(".cart-button");

    const cartPanel =
        document.querySelector(".cart-panel");

    const closeCartButton =
        document.querySelector(".close-cart");

    const cartOverlay =
        document.querySelector(".cart-overlay");

    const cartItemsContainer =
        document.querySelector(".cart-items");

    const cartCountElement =
        document.querySelector(".cart-count");

    const cartSubtotalElement =
        document.querySelector(".cart-total strong");

    const clearCartButton =
        document.querySelector(".clear-cart");

    const checkoutButton =
        document.querySelector(".checkout-button");


    /* =========================================
       ELEMENTOS DO CARDÁPIO
    ========================================= */

    const productsContainer =
        document.querySelector(".menu-products");

    const categoriesContainer =
        document.querySelector(".menu-categories");


    /* =========================================
       ESTADO DO CARRINHO
    ========================================= */

    let cart =
        loadLocalStorage(
            "pizzariaAlmeidaCart",
            []
        );


    /* =========================================
       DADOS DO CLIENTE
    ========================================= */

    let customerData =
        loadLocalStorage(
            "pizzariaAlmeidaCustomer",
            {}
        );


    /* =========================================
       DADOS DA ENTREGA
    ========================================= */

    let deliveryDistanceKm =
        Number(
            customerData.deliveryDistanceKm
        ) || null;

    let deliveryFee =
        Number(
            customerData.deliveryFee
        ) || 0;

    let deliveryAvailable =
        customerData.deliveryAvailable === true;

    let calculatedDeliveryAddress =
        "";


    /* =========================================
       WHATSAPP DA LOJA
    ========================================= */

    let storeWhatsapp =
        "";


    /* =========================================
       FILTRO ATUAL
    ========================================= */

    let currentFilter =
        "todos";


    /* =========================================
       DADOS DO SUPABASE
    ========================================= */

    let supabaseProducts = [];

    let supabaseCategories = [];


    /* =========================================
       FORMATAR PREÇO
    ========================================= */

    function formatPrice(value) {

        return Number(value).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

    }


    /* =========================================
       CONVERTER PREÇO
    ========================================= */

    function parsePrice(priceText) {

        return Number(
            String(priceText)
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
                .trim()
        );

    }


    /* =========================================
       LOCALSTORAGE
    ========================================= */

    function loadLocalStorage(
        key,
        fallback
    ) {

        try {

            const saved =
                localStorage.getItem(
                    key
                );


            if (!saved) {

                return fallback;

            }


            return JSON.parse(
                saved
            );

        } catch (error) {

            console.error(
                `Erro ao carregar ${key}:`,
                error
            );


            return fallback;

        }

    }


    /* =========================================
       SALVAR CARRINHO
    ========================================= */

    function saveCart() {

        localStorage.setItem(
            "pizzariaAlmeidaCart",
            JSON.stringify(cart)
        );

    }


    /* =========================================
       SALVAR CLIENTE
    ========================================= */

    function saveCustomerData() {

        localStorage.setItem(
            "pizzariaAlmeidaCustomer",
            JSON.stringify(customerData)
        );

    }


    /* =========================================
       ABRIR CARRINHO
    ========================================= */

    function openCart() {

        if (cartPanel) {

            cartPanel.classList.add(
                "open"
            );

        }


        if (cartOverlay) {

            cartOverlay.classList.add(
                "open"
            );

        }


        document.body.classList.add(
            "cart-open"
        );

    }


    /* =========================================
       FECHAR CARRINHO
    ========================================= */

    function closeCart() {

        if (cartPanel) {

            cartPanel.classList.remove(
                "open"
            );

        }


        if (cartOverlay) {

            cartOverlay.classList.remove(
                "open"
            );

        }


        document.body.classList.remove(
            "cart-open"
        );

    }


    /* =========================================
       EVENTO BOTÃO CARRINHO
    ========================================= */

    if (cartButton) {

        cartButton.addEventListener(
            "click",
            openCart
        );

    }


    /* =========================================
       EVENTO FECHAR CARRINHO
    ========================================= */

    if (closeCartButton) {

        closeCartButton.addEventListener(
            "click",
            closeCart
        );

    }


    /* =========================================
       CLICAR FORA
    ========================================= */

    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCart
        );

    }


    /* =========================================
       CARREGAR WHATSAPP DA LOJA
    ========================================= */

    async function loadStoreWhatsapp() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "supabaseClient não foi encontrado."
            );


            return false;

        }


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .rpc(
                        "get_store_whatsapp"
                    );


            if (error) {

                console.error(
                    "Erro ao carregar WhatsApp da loja:",
                    error
                );


                return false;

            }


            storeWhatsapp =
                typeof data ===
                    "string"
                    ? data.trim()
                    : "";


            if (!storeWhatsapp) {

                console.warn(
                    "WhatsApp da loja não está cadastrado."
                );


                return false;

            }


            console.log(
                "WhatsApp da loja carregado."
            );


            return true;

        } catch (error) {

            console.error(
                "Erro inesperado ao carregar WhatsApp:",
                error
            );


            return false;

        }

    }


    /* =========================================
       CARREGAR PRODUTOS DO SUPABASE
    ========================================= */

    async function loadProductsFromSupabase() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "supabaseClient não foi encontrado."
            );


            return;

        }


        const {
            data,
            error
        } =
            await supabaseClient
                .from("products")
                .select(
                    "id, slug, name, description, price, category, image_url, active"
                )
                .eq(
                    "active",
                    true
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Erro ao carregar produtos do Supabase:",
                error
            );


            return;

        }


        supabaseProducts =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "Produtos carregados do Supabase:",
            supabaseProducts
        );


        renderProducts(
            supabaseProducts
        );

    }


    /* =========================================
       CARREGAR CATEGORIAS
    ========================================= */

    async function loadCategoriesFromSupabase() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "supabaseClient não foi encontrado."
            );


            return;

        }


        if (!categoriesContainer) {

            return;

        }


        const {
            data,
            error
        } =
            await supabaseClient
                .from("categories")
                .select(
                    "id, name, slug, active"
                )
                .eq(
                    "active",
                    true
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Erro ao carregar categorias:",
                error
            );


            return;

        }


        supabaseCategories =
            Array.isArray(data)
                ? data
                : [];


        if (
            currentFilter !==
            "todos"
        ) {

            const categoryExists =
                supabaseCategories.some(
                    (category) =>
                        category.slug ===
                        currentFilter
                );


            if (!categoryExists) {

                currentFilter =
                    "todos";

            }

        }


        renderCategoryFilters();

    }


    /* =========================================
       RENDERIZAR FILTROS
    ========================================= */

    function renderCategoryFilters() {

        if (!categoriesContainer) {

            return;

        }


        categoriesContainer.innerHTML =
            "";


        const allButton =
            document.createElement(
                "button"
            );


        allButton.type =
            "button";


        allButton.dataset.filter =
            "todos";


        allButton.textContent =
            "Todos";


        if (
            currentFilter ===
            "todos"
        ) {

            allButton.classList.add(
                "active"
            );

        }


        allButton.addEventListener(
            "click",
            () => {

                currentFilter =
                    "todos";


                updateFilterButtons();

                applyCurrentFilter();

            }
        );


        categoriesContainer.appendChild(
            allButton
        );


        supabaseCategories.forEach(
            (category) => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.dataset.filter =
                    category.slug;


                button.textContent =
                    category.name;


                if (
                    currentFilter ===
                    category.slug
                ) {

                    button.classList.add(
                        "active"
                    );

                }


                button.addEventListener(
                    "click",
                    () => {

                        currentFilter =
                            category.slug;


                        updateFilterButtons();

                        applyCurrentFilter();

                    }
                );


                categoriesContainer.appendChild(
                    button
                );

            }
        );

    }


    /* =========================================
       ATUALIZAR BOTÃO ATIVO
    ========================================= */

    function updateFilterButtons() {

        if (!categoriesContainer) {

            return;

        }


        const buttons =
            categoriesContainer.querySelectorAll(
                "button"
            );


        buttons.forEach(
            (button) => {

                button.classList.toggle(
                    "active",
                    button.dataset.filter ===
                    currentFilter
                );

            }
        );

    }


    /* =========================================
       REALTIME DOS PRODUTOS
    ========================================= */

    function subscribeToProductsChanges() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "supabaseClient não foi encontrado para o Realtime."
            );


            return;

        }


        supabaseClient
            .channel(
                "products-realtime"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "products"
                },
                async (payload) => {

                    console.log(
                        "Alteração recebida nos produtos:",
                        payload
                    );


                    await loadProductsFromSupabase();

                }
            )
            .subscribe(
                (status) => {

                    console.log(
                        "Realtime products:",
                        status
                    );

                }
            );

    }


    /* =========================================
       REALTIME DAS CATEGORIAS
    ========================================= */

    function subscribeToCategoriesChanges() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "supabaseClient não foi encontrado para o Realtime das categorias."
            );


            return;

        }


        supabaseClient
            .channel(
                "categories-realtime"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "categories"
                },
                async (payload) => {

                    console.log(
                        "Alteração recebida nas categorias:",
                        payload
                    );


                    await loadCategoriesFromSupabase();

                }
            )
            .subscribe(
                (status) => {

                    console.log(
                        "Realtime categories:",
                        status
                    );

                }
            );

    }


    /* =========================================
       RENDERIZAR PRODUTOS
    ========================================= */

    function renderProducts(
        products
    ) {

        if (!productsContainer) {

            return;

        }


        productsContainer.innerHTML =
            "";


        products.forEach(
            (product) => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "product-card";


                card.dataset.category =
                    product.category;


                card.dataset.product =
                    product.slug;


                const imageContainer =
                    document.createElement(
                        "div"
                    );


                imageContainer.className =
                    "product-image";


                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    product.image_url;


                image.alt =
                    product.name;


                image.loading =
                    "lazy";


                imageContainer.appendChild(
                    image
                );


                const content =
                    document.createElement(
                        "div"
                    );


                content.className =
                    "product-content";


                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    product.name;


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    product.description ||
                    "";


                const footer =
                    document.createElement(
                        "div"
                    );


                footer.className =
                    "product-footer";


                const price =
                    document.createElement(
                        "strong"
                    );


                price.textContent =
                    formatPrice(
                        product.price
                    );


                const button =
                    document.createElement(
                        "button"
                    );


                button.className =
                    "add-product";


                button.type =
                    "button";


                button.textContent =
                    "Adicionar";


                footer.appendChild(
                    price
                );


                footer.appendChild(
                    button
                );


                content.appendChild(
                    title
                );


                content.appendChild(
                    description
                );


                content.appendChild(
                    footer
                );


                card.appendChild(
                    imageContainer
                );


                card.appendChild(
                    content
                );


                productsContainer.appendChild(
                    card
                );

            }
        );


        initializeProductButtons();

        applyCurrentFilter();

    }


    /* =========================================
       BOTÕES DOS PRODUTOS
    ========================================= */

    function initializeProductButtons() {

        const addButtons =
            productsContainer?.querySelectorAll(
                ".add-product"
            );


        if (!addButtons) {

            return;

        }


        addButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const productCard =
                            button.closest(
                                ".product-card"
                            );


                        if (!productCard) {

                            return;

                        }


                        const productSlug =
                            productCard.dataset.product;


                        const product =
                            supabaseProducts.find(
                                (item) =>
                                    item.slug ===
                                    productSlug
                            );


                        if (!product) {

                            console.error(
                                "Produto não encontrado:",
                                productSlug
                            );


                            return;

                        }


                        addProductToCart(
                            product
                        );

                    }
                );

            }
        );

    }


    /* =========================================
       ADICIONAR PRODUTO
    ========================================= */

    function addProductToCart(
        product
    ) {

        const existingProduct =
            cart.find(
                (item) =>
                    item.id ===
                    product.slug
            );


        if (existingProduct) {

            existingProduct.quantity +=
                1;

        } else {

            cart.push({

                id:
                    product.slug,

                name:
                    product.name,

                description:
                    product.description ||
                    "",

                price:
                    Number(
                        product.price
                    ),

                quantity:
                    1

            });

        }


        saveCart();

        renderCart();

        openCart();

    }


    /* =========================================
       CALCULAR SUBTOTAL
    ========================================= */

    function calculateSubtotal() {

        return cart.reduce(
            (
                total,
                product
            ) => {

                return total +
                    (
                        Number(
                            product.price
                        ) *
                        Number(
                            product.quantity
                        )
                    );

            },
            0
        );

    }


    /* =========================================
       CALCULAR TOTAL
    ========================================= */

    function calculateTotal() {

        return (
            calculateSubtotal() +
            (
                Number(
                    deliveryFee
                ) || 0
            )
        );

    }


    /* =========================================
       ATUALIZAR CONTADOR
    ========================================= */

    function updateCartCount() {

        const totalItems =
            cart.reduce(
                (
                    total,
                    product
                ) => {

                    return total +
                        Number(
                            product.quantity
                        );

                },
                0
            );


        if (cartCountElement) {

            cartCountElement.textContent =
                totalItems;

        }

    }


    /* =========================================
       ATUALIZAR SUBTOTAL
    ========================================= */

    function updateCartSubtotal() {

        if (!cartSubtotalElement) {

            return;

        }


        cartSubtotalElement.textContent =
            formatPrice(
                calculateSubtotal()
            );

    }


    /* =========================================
       ÍCONE LIXEIRA
    ========================================= */

    function createTrashIcon() {

        const svg =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );


        svg.setAttribute(
            "width",
            "18"
        );


        svg.setAttribute(
            "height",
            "18"
        );


        svg.setAttribute(
            "viewBox",
            "0 0 24 24"
        );


        svg.setAttribute(
            "fill",
            "none"
        );


        const path =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );


        path.setAttribute(
            "d",
            "M9 3H15M4 7H20M10 11V17M14 11V17M6 7L7 21H17L18 7"
        );


        path.setAttribute(
            "stroke",
            "currentColor"
        );


        path.setAttribute(
            "stroke-width",
            "2"
        );


        path.setAttribute(
            "stroke-linecap",
            "round"
        );


        path.setAttribute(
            "stroke-linejoin",
            "round"
        );


        svg.appendChild(
            path
        );


        return svg;

    }


    /* =========================================
       RENDERIZAR CARRINHO
    ========================================= */

    function renderCart() {

        if (!cartItemsContainer) {

            return;

        }


        cartItemsContainer.innerHTML =
            "";


        if (
            cart.length ===
            0
        ) {

            const emptyMessage =
                document.createElement(
                    "p"
                );


            emptyMessage.className =
                "cart-empty";


            emptyMessage.textContent =
                "Seu carrinho está vazio.";


            cartItemsContainer.appendChild(
                emptyMessage
            );


            updateCartCount();

            updateCartSubtotal();

            return;

        }


        cart.forEach(
            (product) => {

                const cartItem =
                    document.createElement(
                        "div"
                    );


                cartItem.className =
                    "cart-item";


                const productInfo =
                    document.createElement(
                        "div"
                    );


                productInfo.className =
                    "cart-product-info";


                const productName =
                    document.createElement(
                        "h3"
                    );


                productName.textContent =
                    product.name;


                const productPrice =
                    document.createElement(
                        "span"
                    );


                productPrice.textContent =
                    formatPrice(
                        Number(
                            product.price
                        ) *
                        Number(
                            product.quantity
                        )
                    );


                productInfo.appendChild(
                    productName
                );


                productInfo.appendChild(
                    productPrice
                );


                const controls =
                    document.createElement(
                        "div"
                    );


                controls.className =
                    "cart-product-controls";


                const decreaseButton =
                    document.createElement(
                        "button"
                    );


                decreaseButton.type =
                    "button";


                decreaseButton.textContent =
                    "−";


                decreaseButton.setAttribute(
                    "aria-label",
                    `Diminuir quantidade de ${product.name}`
                );


                const quantity =
                    document.createElement(
                        "span"
                    );


                quantity.textContent =
                    product.quantity;


                const increaseButton =
                    document.createElement(
                        "button"
                    );


                increaseButton.type =
                    "button";


                increaseButton.textContent =
                    "+";


                increaseButton.setAttribute(
                    "aria-label",
                    `Aumentar quantidade de ${product.name}`
                );


                const removeButton =
                    document.createElement(
                        "button"
                    );


                removeButton.type =
                    "button";


                removeButton.className =
                    "remove-item";


                removeButton.appendChild(
                    createTrashIcon()
                );


                removeButton.setAttribute(
                    "aria-label",
                    `Remover ${product.name}`
                );


                decreaseButton.addEventListener(
                    "click",
                    () => {

                        if (
                            product.quantity >
                            1
                        ) {

                            product.quantity -=
                                1;

                        } else {

                            cart =
                                cart.filter(
                                    (item) =>
                                        item.id !==
                                        product.id
                                );

                        }


                        saveCart();

                        renderCart();

                    }
                );


                increaseButton.addEventListener(
                    "click",
                    () => {

                        product.quantity +=
                            1;


                        saveCart();

                        renderCart();

                    }
                );


                removeButton.addEventListener(
                    "click",
                    () => {

                        cart =
                            cart.filter(
                                (item) =>
                                    item.id !==
                                    product.id
                            );


                        saveCart();

                        renderCart();

                    }
                );


                controls.appendChild(
                    decreaseButton
                );


                controls.appendChild(
                    quantity
                );


                controls.appendChild(
                    increaseButton
                );


                controls.appendChild(
                    removeButton
                );


                cartItem.appendChild(
                    productInfo
                );


                cartItem.appendChild(
                    controls
                );


                cartItemsContainer.appendChild(
                    cartItem
                );

            }
        );


        updateCartCount();

        updateCartSubtotal();

    }


    /* =========================================
       LIMPAR CARRINHO
    ========================================= */

    if (clearCartButton) {

        clearCartButton.addEventListener(
            "click",
            () => {

                if (
                    cart.length ===
                    0
                ) {

                    return;

                }


                const confirmed =
                    window.confirm(
                        "Tem certeza que deseja limpar seu carrinho?"
                    );


                if (!confirmed) {

                    return;

                }


                cart = [];


                saveCart();

                renderCart();

            }
        );

    }


    /* =========================================
       APLICAR FILTRO
    ========================================= */

    function applyCurrentFilter() {

        if (!productsContainer) {

            return;

        }


        const cards =
            productsContainer.querySelectorAll(
                ".product-card"
            );


        cards.forEach(
            (card) => {

                const category =
                    card.dataset.category;


                const showCard =
                    currentFilter ===
                    "todos" ||
                    category ===
                    currentFilter;


                card.style.display =
                    showCard
                        ? "flex"
                        : "none";

            }
        );

    }


    /* =========================================
       FORMATAR CEP
    ========================================= */

    function formatCep(value) {

        const digits =
            String(value)
                .replace(
                    /\D/g,
                    ""
                )
                .slice(
                    0,
                    8
                );


        if (
            digits.length <=
            5
        ) {

            return digits;

        }


        return (
            digits.slice(
                0,
                5
            ) +
            "-" +
            digits.slice(
                5
            )

        );

    }


    /* =========================================
       LIMPAR ENDEREÇO
    ========================================= */

    function clearAddressFields(
        streetInput,
        neighborhoodInput,
        cityInput,
        stateInput
    ) {

        streetInput.value =
            "";

        neighborhoodInput.value =
            "";

        cityInput.value =
            "";

        stateInput.value =
            "";


        setAddressFieldsReadonly(
            streetInput,
            neighborhoodInput,
            cityInput,
            stateInput,
            false
        );

    }


    /* =========================================
       BLOQUEAR / LIBERAR ENDEREÇO
    ========================================= */

    function setAddressFieldsReadonly(
        streetInput,
        neighborhoodInput,
        cityInput,
        stateInput,
        readonly
    ) {

        streetInput.readOnly =
            readonly;

        neighborhoodInput.readOnly =
            readonly;

        cityInput.readOnly =
            readonly;

        stateInput.readOnly =
            readonly;

    }


    /* =========================================
       BUSCAR CEP NO VIACEP
    ========================================= */

    async function searchCep(
        cepInput,
        streetInput,
        neighborhoodInput,
        cityInput,
        stateInput,
        statusElement
    ) {

        const rawCep =
            cepInput.value ||
            "";


        const cep =
            rawCep.replace(
                /\D/g,
                ""
            );


        if (
            !/^[0-9]{8}$/.test(
                cep
            )
        ) {

            statusElement.textContent =
                "Digite um CEP válido.";


            statusElement.className =
                "cep-status error";


            clearAddressFields(
                streetInput,
                neighborhoodInput,
                cityInput,
                stateInput
            );


            return false;

        }


        statusElement.textContent =
            "Consultando CEP...";


        statusElement.className =
            "cep-status loading";


        try {

            const response =
                await fetch(
                    `https://viacep.com.br/ws/${cep}/json/`
                );


            if (!response.ok) {

                throw new Error(
                    "Não foi possível consultar o CEP."
                );

            }


            const data =
                await response.json();


            if (data.erro) {

                clearAddressFields(
                    streetInput,
                    neighborhoodInput,
                    cityInput,
                    stateInput
                );


                statusElement.textContent =
                    "CEP não encontrado.";


                statusElement.className =
                    "cep-status error";


                window.alert(
                    "CEP não encontrado."
                );


                return false;

            }


            streetInput.value =
                data.logradouro ||
                "";


            neighborhoodInput.value =
                data.bairro ||
                "";


            cityInput.value =
                data.localidade ||
                "";


            stateInput.value =
                data.uf ||
                "";


            cepInput.value =
                formatCep(
                    cep
                );


            setAddressFieldsReadonly(
                streetInput,
                neighborhoodInput,
                cityInput,
                stateInput,
                true
            );


            statusElement.textContent =
                "Endereço encontrado.";


            statusElement.className =
                "cep-status success";


            customerData.cep =
                cepInput.value;


            customerData.street =
                streetInput.value.trim();


            customerData.neighborhood =
                neighborhoodInput.value.trim();


            customerData.city =
                cityInput.value.trim();


            customerData.state =
                stateInput.value.trim();


            customerData.deliveryAvailable =
                false;


            customerData.deliveryFee =
                0;


            customerData.deliveryDistanceKm =
                null;


            deliveryAvailable =
                false;


            deliveryFee =
                0;


            deliveryDistanceKm =
                null;


            calculatedDeliveryAddress =
                "";


            saveCustomerData();


            return true;

        } catch (error) {

            console.error(
                "Erro ao consultar CEP:",
                error
            );


            statusElement.textContent =
                "Erro ao consultar o CEP.";


            statusElement.className =
                "cep-status error";


            window.alert(
                "Não foi possível consultar o CEP. Tente novamente."
            );


            return false;

        }

    }


    /* =========================================
       CALCULAR ENTREGA
    ========================================= */

    async function calculateDeliveryFee() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "supabaseClient não foi encontrado."
            );


            window.alert(
                "Não foi possível calcular a entrega."
            );


            return false;

        }


        const addressParts = [

            customerData.street,

            customerData.number,

            customerData.neighborhood,

            customerData.city,

            customerData.state,

            customerData.cep,

            "Brasil"

        ];


        const address =
            addressParts
                .filter(
                    (value) =>
                        value !== null &&
                        value !== undefined &&
                        String(value).trim() !== ""
                )
                .map(
                    (value) =>
                        String(value).trim()
                )
                .join(
                    ", "
                );


        if (!address) {

            window.alert(
                "Informe um endereço de entrega válido."
            );


            return false;

        }


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .functions
                    .invoke(
                        "swift-endpoint",
                        {
                            body: {
                                address:
                                    address
                            }
                        }
                    );


            if (error) {

                console.error(
                    "Erro ao calcular entrega:",
                    error
                );


                window.alert(
                    "Não foi possível calcular a taxa de entrega. Tente novamente."
                );


                return false;

            }


            if (!data) {

                console.error(
                    "A Edge Function não retornou dados."
                );


                window.alert(
                    "Não foi possível calcular a entrega."
                );


                return false;

            }


            console.log(
                "Resultado da entrega:",
                data
            );


            if (
                data.deliveryAvailable !==
                true
            ) {

                deliveryAvailable =
                    false;


                deliveryFee =
                    0;


                deliveryDistanceKm =
                    Number(
                        data.distanceKm
                    ) || null;


                customerData.deliveryAvailable =
                    false;


                customerData.deliveryFee =
                    0;


                customerData.deliveryDistanceKm =
                    deliveryDistanceKm;


                saveCustomerData();


                window.alert(
                    "No momento, não realizamos entregas neste endereço."
                );


                return false;

            }


            deliveryAvailable =
                true;


            deliveryFee =
                Number(
                    data.deliveryFee
                ) || 0;


            deliveryDistanceKm =
                Number(
                    data.distanceKm
                ) || 0;


            customerData.deliveryAvailable =
                true;


            customerData.deliveryFee =
                deliveryFee;


            customerData.deliveryDistanceKm =
                deliveryDistanceKm;


            saveCustomerData();


            console.log(
                "Entrega calculada:",
                {
                    distanceKm:
                        deliveryDistanceKm,

                    deliveryFee:
                        deliveryFee
                }
            );


            return true;

        } catch (error) {

            console.error(
                "Erro inesperado ao calcular entrega:",
                error
            );


            window.alert(
                "Não foi possível calcular a entrega. Tente novamente."
            );


            return false;

        }

    }


    /* =========================================
       CHECKOUT
    ========================================= */

    let checkoutOverlay =
        null;


    /* =========================================
       CRIAR CHECKOUT
    ========================================= */

    function createCheckout() {

        if (checkoutOverlay) {

            return;

        }


        checkoutOverlay =
            document.createElement(
                "div"
            );


        checkoutOverlay.className =
            "checkout-overlay";


        checkoutOverlay.innerHTML = `

            <div class="checkout-box">

                <div class="checkout-header">

                    <h2>
                        Finalizar pedido
                    </h2>


                    <button
                        type="button"
                        class="close-checkout"
                        aria-label="Fechar checkout"
                    >
                        ×
                    </button>

                </div>


                <!-- ETAPA 1 -->

                <div
                    class="checkout-step active"
                    data-step="1"
                >

                    <h3>
                        Seus dados
                    </h3>


                    <form
                        class="checkout-form"
                        id="customerForm"
                    >

                        <div class="form-group">

                            <label for="customerName">
                                Nome
                            </label>


                            <input
                                type="text"
                                id="customerName"
                                placeholder="Digite seu nome"
                                autocomplete="name"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="customerPhone">
                                WhatsApp
                            </label>


                            <input
                                type="tel"
                                id="customerPhone"
                                placeholder="(11) 99999-9999"
                                autocomplete="tel"
                                required
                            >

                        </div>


                        <div class="form-group cep-group">

                            <label for="customerCep">
                                CEP
                            </label>


                            <div class="cep-input-row">

                                <input
                                    type="text"
                                    id="customerCep"
                                    placeholder="00000-000"
                                    maxlength="9"
                                    inputmode="numeric"
                                    autocomplete="postal-code"
                                    required
                                >

                            </div>


                            <small
                                id="cepStatus"
                                class="cep-status"
                            ></small>

                        </div>


                        <div class="form-group">

                            <label for="customerStreet">
                                Rua / Avenida
                            </label>


                            <input
                                type="text"
                                id="customerStreet"
                                placeholder="Rua / Avenida"
                                autocomplete="street-address"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="customerNumber">
                                Número
                            </label>


                            <input
                                type="text"
                                id="customerNumber"
                                placeholder="Número"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="customerComplement">
                                Complemento
                            </label>


                            <input
                                type="text"
                                id="customerComplement"
                                placeholder="Casa, apartamento..."
                            >

                        </div>


                        <div class="form-group">

                            <label for="customerNeighborhood">
                                Bairro
                            </label>


                            <input
                                type="text"
                                id="customerNeighborhood"
                                placeholder="Seu bairro"
                                autocomplete="address-level3"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="customerCity">
                                Cidade
                            </label>


                            <input
                                type="text"
                                id="customerCity"
                                value="Suzano"
                                autocomplete="address-level2"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="customerState">
                                Estado
                            </label>


                            <input
                                type="text"
                                id="customerState"
                                value="SP"
                                maxlength="2"
                                autocomplete="address-level1"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="orderNote">
                                Observação
                            </label>


                            <textarea
                                id="orderNote"
                                rows="3"
                                placeholder="Alguma observação?"
                            ></textarea>

                        </div>


                        <button
                            type="submit"
                            class="checkout-next"
                        >
                            Continuar
                        </button>

                    </form>

                </div>


                <!-- ETAPA 2 -->

                <div
                    class="checkout-step"
                    data-step="2"
                >

                    <h3>
                        Forma de pagamento
                    </h3>


                    <div class="payment-options">

                        <label>

                            <input
                                type="radio"
                                name="payment"
                                value="Pix"
                                checked
                            >

                            Pix

                        </label>


                        <label>

                            <input
                                type="radio"
                                name="payment"
                                value="Dinheiro"
                            >

                            Dinheiro

                        </label>


                        <label>

                            <input
                                type="radio"
                                name="payment"
                                value="Cartão"
                            >

                            Cartão

                        </label>

                    </div>


                    <div
                        class="cash-change"
                        style="display: none;"
                    >

                        <label for="changeFor">
                            Troco para
                        </label>


                        <input
                            type="text"
                            id="changeFor"
                            placeholder="Ex.: R$ 100,00"
                        >

                    </div>


                    <div class="checkout-buttons">

                        <button
                            type="button"
                            class="checkout-back"
                        >
                            Voltar
                        </button>


                        <button
                            type="button"
                            class="checkout-next-payment"
                        >
                            Revisar pedido
                        </button>

                    </div>

                </div>


                <!-- ETAPA 3 -->

                <div
                    class="checkout-step"
                    data-step="3"
                >

                    <h3>
                        Revise seu pedido
                    </h3>


                    <div
                        class="review-items"
                    ></div>


                    <div
                        class="review-address"
                    ></div>


                    <div
                        class="review-payment"
                    ></div>


                    <div class="review-total">

                        <div class="review-subtotal">

                            <span>
                                Subtotal
                            </span>


                            <strong>
                                R$ 0,00
                            </strong>

                        </div>


                        <div class="review-delivery">

                            <span>
                                Taxa de entrega
                            </span>


                            <strong>
                                R$ 0,00
                            </strong>

                        </div>


                        <div class="review-total-final">

                            <span>
                                Total
                            </span>


                            <strong>
                                R$ 0,00
                            </strong>

                        </div>

                    </div>


                    <div class="checkout-buttons">

                        <button
                            type="button"
                            class="checkout-back-payment"
                        >
                            Voltar
                        </button>


                        <button
                            type="button"
                            class="confirm-order"
                        >
                            Confirmar pedido
                        </button>

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(
            checkoutOverlay
        );


        initializeCheckout();

    }


    /* =========================================
       INICIALIZAR CHECKOUT
    ========================================= */

    function initializeCheckout() {

        const closeCheckoutButton =
            checkoutOverlay.querySelector(
                ".close-checkout"
            );


        const customerForm =
            checkoutOverlay.querySelector(
                "#customerForm"
            );


        const checkoutSteps =
            checkoutOverlay.querySelectorAll(
                ".checkout-step"
            );


        const checkoutBack =
            checkoutOverlay.querySelector(
                ".checkout-back"
            );


        const nextPayment =
            checkoutOverlay.querySelector(
                ".checkout-next-payment"
            );


        const backPayment =
            checkoutOverlay.querySelector(
                ".checkout-back-payment"
            );


        const confirmOrder =
            checkoutOverlay.querySelector(
                ".confirm-order"
            );


        const cashChange =
            checkoutOverlay.querySelector(
                ".cash-change"
            );


        const changeForInput =
            checkoutOverlay.querySelector(
                "#changeFor"
            );


        const paymentInputs =
            checkoutOverlay.querySelectorAll(
                'input[name="payment"]'
            );


        const cepInput =
            checkoutOverlay.querySelector(
                "#customerCep"
            );


        const streetInput =
            checkoutOverlay.querySelector(
                "#customerStreet"
            );


        const neighborhoodInput =
            checkoutOverlay.querySelector(
                "#customerNeighborhood"
            );


        const cityInput =
            checkoutOverlay.querySelector(
                "#customerCity"
            );


        const stateInput =
            checkoutOverlay.querySelector(
                "#customerState"
            );


        const numberInput =
            checkoutOverlay.querySelector(
                "#customerNumber"
            );


        const cepStatus =
            checkoutOverlay.querySelector(
                "#cepStatus"
            );


        /* =========================================
           FECHAR CHECKOUT
        ========================================= */

        closeCheckoutButton.addEventListener(
            "click",
            closeCheckout
        );


        /* =========================================
           TROCO SOMENTE PARA DINHEIRO
        ========================================= */

        function updateCashChangeVisibility() {

            const selectedPayment =
                checkoutOverlay.querySelector(
                    'input[name="payment"]:checked'
                );


            if (!cashChange) {

                return;

            }


            if (
                selectedPayment &&
                selectedPayment.value ===
                "Dinheiro"
            ) {

                cashChange.style.display =
                    "flex";

            } else {

                cashChange.style.display =
                    "none";


                if (changeForInput) {

                    changeForInput.value =
                        "";

                }


                customerData.changeFor =
                    "";

                saveCustomerData();

            }

        }


        paymentInputs.forEach(
            (input) => {

                input.addEventListener(
                    "change",
                    updateCashChangeVisibility
                );

            }
        );


        updateCashChangeVisibility();


        /* =========================================
           CEP - BUSCA AUTOMÁTICA
        ========================================= */

        cepInput.addEventListener(
            "input",
            async () => {

                cepInput.value =
                    formatCep(
                        cepInput.value
                    );


                setAddressFieldsReadonly(
                    streetInput,
                    neighborhoodInput,
                    cityInput,
                    stateInput,
                    false
                );


                cepStatus.textContent =
                    "";

                cepStatus.className =
                    "cep-status";


                deliveryAvailable =
                    false;

                deliveryFee =
                    0;

                deliveryDistanceKm =
                    null;


                customerData.deliveryAvailable =
                    false;

                customerData.deliveryFee =
                    0;

                customerData.deliveryDistanceKm =
                    null;


                calculatedDeliveryAddress =
                    "";


                const cep =
                    cepInput.value.replace(
                        /\D/g,
                        ""
                    );


                if (
                    cep.length ===
                    8
                ) {

                    await searchCep(
                        cepInput,
                        streetInput,
                        neighborhoodInput,
                        cityInput,
                        stateInput,
                        cepStatus
                    );

                }

            }
        );


        /* =========================================
           NÚMERO - CALCULAR ENTREGA AUTOMATICAMENTE
        ========================================= */

        let deliveryCalculationTimer =
            null;


        numberInput.addEventListener(
            "input",
            () => {

                customerData.number =
                    numberInput.value.trim();


                deliveryAvailable =
                    false;

                deliveryFee =
                    0;

                deliveryDistanceKm =
                    null;


                customerData.deliveryAvailable =
                    false;

                customerData.deliveryFee =
                    0;

                customerData.deliveryDistanceKm =
                    null;


                calculatedDeliveryAddress =
                    "";


                saveCustomerData();


                clearTimeout(
                    deliveryCalculationTimer
                );


                const number =
                    numberInput.value.trim();


                if (
                    !number ||
                    !customerData.street ||
                    !customerData.neighborhood ||
                    !customerData.city ||
                    !customerData.state ||
                    !customerData.cep
                ) {

                    return;

                }


                deliveryCalculationTimer =
                    setTimeout(
                        async () => {

                            const addressKey =
                                [
                                    customerData.street,
                                    number,
                                    customerData.neighborhood,
                                    customerData.city,
                                    customerData.state,
                                    customerData.cep
                                ]
                                    .join("|");


                            try {

                                const result =
                                    await calculateDeliveryFee();


                                if (
                                    result
                                ) {

                                    calculatedDeliveryAddress =
                                        addressKey;

                                }

                            } catch (error) {

                                console.error(
                                    "Erro no cálculo automático da entrega:",
                                    error
                                );

                            }

                        },
                        300
                    );

            }
        );


        /* =========================================
           TROCAR ETAPA
        ========================================= */

        function showCheckoutStep(
            stepNumber
        ) {

            checkoutSteps.forEach(
                (step) => {

                    const currentStep =
                        Number(
                            step.dataset.step
                        );


                    step.classList.toggle(
                        "active",
                        currentStep ===
                        stepNumber
                    );

                }
            );


            if (
                stepNumber ===
                3
            ) {

                renderReview();

            }

        }


        /* =========================================
           FORMULÁRIO CLIENTE
        ========================================= */

        customerForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const submitButton =
                    customerForm.querySelector(
                        ".checkout-next"
                    );


                const cep =
                    cepInput.value
                        .replace(
                            /\D/g,
                            ""
                        );


                if (
                    !/^[0-9]{8}$/.test(
                        cep
                    )
                ) {

                    window.alert(
                        "Informe um CEP válido."
                    );


                    cepInput.focus();


                    return;

                }


                if (
                    !streetInput.value.trim() ||
                    !neighborhoodInput.value.trim() ||
                    !cityInput.value.trim() ||
                    !stateInput.value.trim()
                ) {

                    window.alert(
                        "Digite um CEP válido para preencher o endereço."
                    );


                    cepInput.focus();


                    return;

                }


                if (
                    !numberInput.value.trim()
                ) {

                    window.alert(
                        "Informe o número do endereço."
                    );


                    numberInput.focus();


                    return;

                }


                if (submitButton) {

                    submitButton.disabled =
                        true;


                    submitButton.textContent =
                        "Verificando entrega...";

                }


                customerData = {

                    name:
                        checkoutOverlay
                            .querySelector(
                                "#customerName"
                            )
                            .value
                            .trim(),

                    phone:
                        checkoutOverlay
                            .querySelector(
                                "#customerPhone"
                            )
                            .value
                            .trim(),

                    cep:
                        cepInput.value
                            .trim(),

                    street:
                        streetInput.value
                            .trim(),

                    number:
                        numberInput.value
                            .trim(),

                    complement:
                        checkoutOverlay
                            .querySelector(
                                "#customerComplement"
                            )
                            .value
                            .trim(),

                    neighborhood:
                        neighborhoodInput
                            .value
                            .trim(),

                    city:
                        cityInput.value
                            .trim(),

                    state:
                        stateInput.value
                            .trim()
                            .toUpperCase(),

                    note:
                        checkoutOverlay
                            .querySelector(
                                "#orderNote"
                            )
                            .value
                            .trim(),

                    payment:
                        "Pix",

                    changeFor:
                        "",

                    deliveryAvailable:
                        deliveryAvailable,

                    deliveryFee:
                        deliveryFee,

                    deliveryDistanceKm:
                        deliveryDistanceKm

                };


                saveCustomerData();


                const addressKey =
                    [
                        customerData.street,
                        customerData.number,
                        customerData.neighborhood,
                        customerData.city,
                        customerData.state,
                        customerData.cep
                    ]
                        .join("|");


                if (
                    calculatedDeliveryAddress !==
                    addressKey
                ) {

                    const deliveryValid =
                        await calculateDeliveryFee();


                    if (!deliveryValid) {

                        if (submitButton) {

                            submitButton.disabled =
                                false;


                            submitButton.textContent =
                                "Continuar";

                        }


                        return;

                    }


                    calculatedDeliveryAddress =
                        addressKey;

                }


                if (submitButton) {

                    submitButton.disabled =
                        false;


                    submitButton.textContent =
                        "Continuar";

                }


                if (
                    deliveryAvailable !==
                    true
                ) {

                    window.alert(
                        "No momento, não realizamos entregas neste endereço."
                    );


                    return;

                }


                showCheckoutStep(
                    2
                );

            }
        );


        /* =========================================
           VOLTAR
        ========================================= */

        checkoutBack.addEventListener(
            "click",
            () => {

                showCheckoutStep(
                    1
                );

            }
        );


        /* =========================================
           PAGAMENTO
        ========================================= */

        nextPayment.addEventListener(
            "click",
            () => {

                const payment =
                    checkoutOverlay.querySelector(
                        'input[name="payment"]:checked'
                    );


                customerData.payment =
                    payment
                        ? payment.value
                        : "Pix";


                if (
                    customerData.payment ===
                    "Dinheiro"
                ) {

                    customerData.changeFor =
                        changeForInput
                            ? changeForInput
                                .value
                                .trim()
                            : "";

                } else {

                    customerData.changeFor =
                        "";

                }


                saveCustomerData();


                showCheckoutStep(
                    3
                );

            }
        );


        /* =========================================
           VOLTAR DA REVISÃO
        ========================================= */

        backPayment.addEventListener(
            "click",
            () => {

                showCheckoutStep(
                    2
                );

            }
        );


        /* =========================================
           CONFIRMAR
        ========================================= */

        confirmOrder.addEventListener(
            "click",
            () => {

                if (
                    deliveryAvailable !==
                    true
                ) {

                    window.alert(
                        "No momento, não realizamos entregas neste endereço."
                    );


                    showCheckoutStep(
                        1
                    );


                    return;

                }


                sendOrderToWhatsApp();

            }
        );


        /* =========================================
           CARREGAR DADOS SALVOS
        ========================================= */

        loadCustomerData();

    }


    /* =========================================
       PREPARAR NOVO PEDIDO
    ========================================= */

    function prepareNewOrder() {

        customerData = {

            name:
                customerData.name || "",

            phone:
                customerData.phone || "",

            cep:
                "",

            street:
                "",

            number:
                "",

            complement:
                "",

            neighborhood:
                "",

            city:
                "Suzano",

            state:
                "SP",

            note:
                "",

            payment:
                "Pix",

            changeFor:
                "",

            deliveryAvailable:
                false,

            deliveryFee:
                0,

            deliveryDistanceKm:
                null

        };


        deliveryAvailable =
            false;


        deliveryFee =
            0;


        deliveryDistanceKm =
            null;


        calculatedDeliveryAddress =
            "";


        saveCustomerData();

    }


    /* =========================================
       ABRIR CHECKOUT
    ========================================= */

    function openCheckout() {

        if (
            cart.length ===
            0
        ) {

            window.alert(
                "Adicione pelo menos um produto ao carrinho."
            );


            return;

        }


        prepareNewOrder();


        createCheckout();


        closeCart();


        checkoutOverlay.classList.add(
            "open"
        );


        document.body.classList.add(
            "checkout-open"
        );


        loadCustomerData();


        const checkoutSteps =
            checkoutOverlay.querySelectorAll(
                ".checkout-step"
            );


        checkoutSteps.forEach(
            (step) => {

                step.classList.toggle(
                    "active",
                    step.dataset.step ===
                    "1"
                );

            }
        );


        const pixRadio =
            checkoutOverlay.querySelector(
                'input[name="payment"][value="Pix"]'
            );


        if (pixRadio) {

            pixRadio.checked =
                true;

        }


        const cashChange =
            checkoutOverlay.querySelector(
                ".cash-change"
            );


        if (cashChange) {

            cashChange.style.display =
                "none";

        }


        const cepStatus =
            checkoutOverlay.querySelector(
                "#cepStatus"
            );


        if (cepStatus) {

            cepStatus.textContent =
                "";

            cepStatus.className =
                "cep-status";

        }

    }


    /* =========================================
       FECHAR CHECKOUT
    ========================================= */

    function closeCheckout() {

        if (!checkoutOverlay) {

            return;

        }


        checkoutOverlay.classList.remove(
            "open"
        );


        document.body.classList.remove(
            "checkout-open"
        );

    }


    /* =========================================
       CARREGAR DADOS CLIENTE
    ========================================= */

    function loadCustomerData() {

        if (!checkoutOverlay) {

            return;

        }


        const fields = {

            customerName:
                customerData.name ||
                "",

            customerPhone:
                customerData.phone ||
                "",

            customerCep:
                customerData.cep ||
                "",

            customerStreet:
                customerData.street ||
                "",

            customerNumber:
                customerData.number ||
                "",

            customerComplement:
                customerData.complement ||
                "",

            customerNeighborhood:
                customerData.neighborhood ||
                "",

            customerCity:
                customerData.city ||
                "Suzano",

            customerState:
                customerData.state ||
                "SP",

            orderNote:
                customerData.note ||
                ""

        };


        Object.entries(
            fields
        ).forEach(
            ([id, value]) => {

                const field =
                    checkoutOverlay.querySelector(
                        `#${id}`
                    );


                if (field) {

                    field.value =
                        value;

                }

            }
        );


        const paymentRadio =
            checkoutOverlay.querySelector(
                `input[name="payment"][value="${customerData.payment || "Pix"}"]`
            );


        if (paymentRadio) {

            paymentRadio.checked =
                true;

        }


        const changeFor =
            checkoutOverlay.querySelector(
                "#changeFor"
            );


        if (changeFor) {

            changeFor.value =
                customerData.payment ===
                    "Dinheiro"
                    ? (
                        customerData.changeFor ||
                        ""
                    )
                    : "";

        }


        const cashChange =
            checkoutOverlay.querySelector(
                ".cash-change"
            );


        if (cashChange) {

            cashChange.style.display =
                customerData.payment ===
                    "Dinheiro"
                    ? "flex"
                    : "none";

        }


        const streetInput =
            checkoutOverlay.querySelector(
                "#customerStreet"
            );


        const neighborhoodInput =
            checkoutOverlay.querySelector(
                "#customerNeighborhood"
            );


        const cityInput =
            checkoutOverlay.querySelector(
                "#customerCity"
            );


        const stateInput =
            checkoutOverlay.querySelector(
                "#customerState"
            );


        const cepStatus =
            checkoutOverlay.querySelector(
                "#cepStatus"
            );


        if (
            customerData.cep &&
            customerData.street &&
            customerData.neighborhood &&
            customerData.city &&
            customerData.state
        ) {

            setAddressFieldsReadonly(
                streetInput,
                neighborhoodInput,
                cityInput,
                stateInput,
                true
            );


            if (cepStatus) {

                cepStatus.textContent =
                    "Endereço salvo.";


                cepStatus.className =
                    "cep-status success";

            }

        } else {

            setAddressFieldsReadonly(
                streetInput,
                neighborhoodInput,
                cityInput,
                stateInput,
                false
            );

        }

    }


    /* =========================================
       RENDERIZAR REVISÃO
    ========================================= */

    function renderReview() {

        if (!checkoutOverlay) {

            return;

        }


        const reviewItems =
            checkoutOverlay.querySelector(
                ".review-items"
            );


        const reviewAddress =
            checkoutOverlay.querySelector(
                ".review-address"
            );


        const reviewPayment =
            checkoutOverlay.querySelector(
                ".review-payment"
            );


        const reviewTotalContainer =
            checkoutOverlay.querySelector(
                ".review-total"
            );


        if (
            !reviewItems ||
            !reviewAddress ||
            !reviewPayment ||
            !reviewTotalContainer
        ) {

            return;

        }


        reviewItems.innerHTML =
            "";


        cart.forEach(
            (product) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "review-item";


                const itemName =
                    document.createElement(
                        "strong"
                    );


                itemName.textContent =
                    `${product.quantity}x ${product.name}`;


                const itemPrice =
                    document.createElement(
                        "span"
                    );


                itemPrice.textContent =
                    formatPrice(
                        product.price *
                        product.quantity
                    );


                item.appendChild(
                    itemName
                );


                item.appendChild(
                    itemPrice
                );


                reviewItems.appendChild(
                    item
                );

            }
        );


        reviewAddress.innerHTML = `

            <h4>
                Endereço de entrega
            </h4>


            <p>

                ${escapeHtml(
                    customerData.street
                )},

                ${escapeHtml(
                    customerData.number
                )}

                ${customerData.complement
                    ? ` - ${escapeHtml(
                        customerData.complement
                    )}`
                    : ""
                }

            </p>


            <p>

                ${escapeHtml(
                    customerData.neighborhood
                )}

                -

                ${escapeHtml(
                    customerData.city
                )}

                /

                ${escapeHtml(
                    customerData.state
                )}

            </p>


            <p>

                CEP:

                ${escapeHtml(
                    customerData.cep
                )}

            </p>

        `;


        reviewPayment.innerHTML = `

            <h4>
                Forma de pagamento
            </h4>


            <p>

                ${escapeHtml(
                    customerData.payment ||
                    "Pix"
                )}

            </p>


            ${customerData.payment ===
                "Dinheiro" &&
                customerData.changeFor
                ? `

                        <p>

                            Troco para:

                            ${escapeHtml(
                                customerData.changeFor
                            )}

                        </p>

                    `
                : ""
            }

        `;


        reviewTotalContainer.innerHTML = `

            <div class="review-subtotal">

                <span>
                    Subtotal
                </span>


                <strong>
                    ${formatPrice(
                        calculateSubtotal()
                    )}
                </strong>

            </div>


            <div class="review-delivery">

                <span>
                    Taxa de entrega
                </span>


                <strong>
                    ${formatPrice(
                        deliveryFee
                    )}
                </strong>

            </div>


            <div class="review-total-final">

                <span>
                    Total
                </span>


                <strong>
                    ${formatPrice(
                        calculateTotal()
                    )}
                </strong>

            </div>

        `;

    }


    /* =========================================
       ENVIAR PEDIDO PARA WHATSAPP
       E LIMPAR PEDIDO APÓS CONFIRMAÇÃO
    ========================================= */

    function sendOrderToWhatsApp() {

        if (!storeWhatsapp) {

            window.alert(
                "O WhatsApp da pizzaria não está configurado no momento."
            );


            return;

        }


        const whatsappNumber =
            storeWhatsapp.replace(
                /\D/g,
                ""
            );


        if (!whatsappNumber) {

            window.alert(
                "O WhatsApp da pizzaria não está configurado corretamente."
            );


            return;

        }


        const subtotal =
            calculateSubtotal();


        const total =
            calculateTotal();


        let message =
            "Olá! Gostaria de fazer um pedido \n\n";


        message +=
            "*PEDIDO*\n";


        cart.forEach(
            (product) => {

                message +=
                    `${product.quantity}x ${product.name} - ${formatPrice(
                        product.price *
                        product.quantity
                    )}\n`;

            }
        );


        message +=
            `\n*Subtotal: ${formatPrice(
                subtotal
            )}*\n`;


        message +=
            `*Taxa de entrega: ${formatPrice(
                deliveryFee
            )}*\n`;


        message +=
            `*Total: ${formatPrice(
                total
            )}*\n`;


        message +=
            "\n*DADOS DO CLIENTE*\n";


        message +=
            `Nome: ${customerData.name}\n`;


        message +=
            `WhatsApp: ${customerData.phone}\n`;


        message +=
            "\n*ENDEREÇO DE ENTREGA*\n";


        message +=
            `${customerData.street}, ${customerData.number}`;


        if (
            customerData.complement
        ) {

            message +=
                ` - ${customerData.complement}`;

        }


        message +=
            `\n${customerData.neighborhood}`;


        message +=
            `\n${customerData.city} - ${customerData.state}`;


        message +=
            `\nCEP: ${customerData.cep}`;


        if (
            customerData.note
        ) {

            message +=
                `\n\n*OBSERVAÇÃO*\n${customerData.note}`;

        }


        message +=
            `\n\n*FORMA DE PAGAMENTO*\n${customerData.payment || "Pix"}`;


        if (
            customerData.payment ===
            "Dinheiro" &&
            customerData.changeFor
        ) {

            message +=
                `\nTroco para: ${customerData.changeFor}`;

        }


        const whatsappUrl =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                message
            )}`;


        /* =========================================
           ABRIR WHATSAPP
        ========================================= */

        window.open(
            whatsappUrl,
            "_blank"
        );


        /* =========================================
           LIMPAR PEDIDO
        ========================================= */

        cart = [];


        saveCart();


        deliveryAvailable =
            false;


        deliveryFee =
            0;


        deliveryDistanceKm =
            null;


        customerData = {

            name:
                customerData.name || "",

            phone:
                customerData.phone || "",

            cep:
                "",

            street:
                "",

            number:
                "",

            complement:
                "",

            neighborhood:
                "",

            city:
                "Suzano",

            state:
                "SP",

            note:
                "",

            payment:
                "Pix",

            changeFor:
                "",

            deliveryAvailable:
                false,

            deliveryFee:
                0,

            deliveryDistanceKm:
                null

        };


        calculatedDeliveryAddress =
            "";


        saveCustomerData();


        /* =========================================
           ATUALIZAR CARRINHO
        ========================================= */

        renderCart();


        /* =========================================
           FECHAR CHECKOUT
        ========================================= */

        closeCheckout();

    }


    /* =========================================
       ESCAPAR HTML
    ========================================= */

    function escapeHtml(
        value
    ) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =========================================
       ESC PARA FECHAR
    ========================================= */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Escape"
            ) {

                closeCart();

                closeCheckout();

            }

        }
    );


    /* =========================================
       BOTÃO CHECKOUT
    ========================================= */

    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            openCheckout
        );

    }


    /* =========================================
       INICIALIZAÇÃO
    ========================================= */

    renderCart();

    loadStoreWhatsapp();

    loadCategoriesFromSupabase();

    loadProductsFromSupabase();

    subscribeToCategoriesChanges();

    subscribeToProductsChanges();

});
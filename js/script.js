/* =========================================
   PIZZARIA ALMEIDA

   CARRINHO + SUPABASE + CHECKOUT
   CATEGORIAS DINÂMICAS + REALTIME
   ENTREGA + CÁLCULO DE DISTÂNCIA
   WHATSAPP DA LOJA VIA SUPABASE
   CEP + PREENCHIMENTO AUTOMÁTICO
   TROCO SOMENTE PARA DINHEIRO
   PERSONALIZAÇÃO DE PRODUTOS
   PEDIDOS SALVOS NO SUPABASE
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

    const trackOrderButton = document.querySelector(".track-order-button");
    const trackingOverlay = document.querySelector(".tracking-overlay");
    const closeTrackingButton = document.querySelector(".close-tracking");
    const trackingSearchButton = document.querySelector(".tracking-search-button");
    const trackingOrderNumber = document.querySelector("#tracking-order-number");
    const trackingPhoneLast4 = document.querySelector("#tracking-phone-last4");
    const trackingResult = document.querySelector(".tracking-result");
    const orderSuccessOverlay = document.querySelector(".order-success-overlay");
    const successOrderNumber = document.querySelector(".success-order-number");
    const successTrackButton = document.querySelector(".success-track-button");
    const successCloseButton = document.querySelector(".success-close-button");
    const trackingCancelContainer = document.querySelector(".tracking-cancel-container");
    const trackingCancelButton = document.querySelector(".tracking-cancel-button");

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

    if (trackingCancelContainer) {
        trackingCancelContainer.style.display = "none";
    }

    /* =========================================
        BUSCAR PEDIDO
    ========================================= */


    if (trackingSearchButton) {
        trackingSearchButton.addEventListener("click", async () => {

            const orderNumber = trackingOrderNumber.value.trim();
            const phoneLast4 = trackingPhoneLast4.value.trim();

            trackingResult.innerHTML = "";

            if (!orderNumber || !phoneLast4) {
                trackingResult.innerHTML = `
                <p style="color: #c62828;">
                    Informe o número do pedido e os últimos 4 números do telefone.
                </p>
            `;
                return;
            }

            if (!/^\d{4}$/.test(phoneLast4)) {
                trackingResult.innerHTML = `
                <p style="color: #c62828;">
                    Informe exatamente os 4 últimos números do telefone.
                </p>
            `;
                return;
            }

            trackingSearchButton.disabled = true;
            trackingSearchButton.textContent = "Consultando...";

            try {

                const { data, error } = await supabaseClient.rpc(
                    "get_order_tracking",
                    {
                        p_order_number: Number(orderNumber),
                        p_phone_last4: phoneLast4
                    }
                );

                if (error) {
                    console.error("Erro ao consultar pedido:", error);
                    throw error;
                }

                console.log("Resultado do acompanhamento:", data);

                if (!data || data.found !== true) {

                    if (trackingCancelContainer) {
                        trackingCancelContainer.style.display = "none";
                    }

                    trackingResult.innerHTML = `
                        <p style="color: #c62828;">
                            Pedido não encontrado. Confira os dados informados.
                        </p>
                    `;
                    return;
                }

                if (trackingCancelContainer) {
                    trackingCancelContainer.style.display = "block";
                }

                trackingResult.innerHTML = `
                    <div class="tracking-order-found">

                        <h3>
                            Pedido #${data.order_number}
                        </h3>

                        <p>
                            Status atual:
                            <strong>${getTrackingStatusLabel(data.status)}</strong>
                        </p>

                    </div>
                `;

            } catch (error) {

                console.error("Erro no acompanhamento:", error);

                trackingResult.innerHTML = `
                <p style="color: #c62828;">
                    Não foi possível consultar o pedido. Tente novamente.
                </p>
            `;

            } finally {

                trackingSearchButton.disabled = false;
                trackingSearchButton.textContent = "Acompanhar pedido";

            }

        });
    }

    if (trackingCancelButton) {

        trackingCancelButton.addEventListener("click", () => {

            const orderNumber =
                trackingOrderNumber
                    ? trackingOrderNumber.value.trim()
                    : "";

            if (!orderNumber) {
                return;
            }

            if (!storeWhatsapp) {

                window.alert(
                    "O WhatsApp da pizzaria não está configurado no momento."
                );

                return;
            }

            const whatsappNumber =
                storeWhatsapp.replace(/\D/g, "");

            if (!whatsappNumber) {

                window.alert(
                    "O WhatsApp da pizzaria não está configurado corretamente."
                );

                return;
            }

            const message =
                `Olá! Gostaria de solicitar o cancelamento do pedido #${orderNumber}.`;

            const whatsappUrl =
                `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

            window.open(
                whatsappUrl,
                "_blank"
            );

        });

    }

    function getTrackingStatusLabel(status) {

        const statusLabels = {
            received: "Pedido recebido",
            preparing: "Em preparo",
            ready: "Pedido pronto",
            out_for_delivery: "Saiu para entrega",
            delivered: "Pedido entregue",
            cancelled: "Pedido cancelado"
        };

        return statusLabels[status] || "Status desconhecido";
    }

    /* =========================================
        ACOMPANHAR PEDIDO
    ========================================= */


    function openTracking() {
        trackingOverlay.classList.add("active");
        trackingOverlay.setAttribute("aria-hidden", "false");
    }

    function closeTracking() {
        trackingOverlay.classList.remove("active");
        trackingOverlay.setAttribute("aria-hidden", "true");
    }

    if (trackOrderButton) {
        trackOrderButton.addEventListener("click", openTracking);
    }

    if (closeTrackingButton) {
        closeTrackingButton.addEventListener("click", closeTracking);
    }

    if (trackingOverlay) {
        trackingOverlay.addEventListener("click", (event) => {
            if (event.target === trackingOverlay) {
                closeTracking();
            }
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && trackingOverlay?.classList.contains("active")) {
            closeTracking();
        }
    });

    /* =========================================
        PEDIDO REALIZADO
    ========================================= */

    function openOrderSuccess(orderNumber) {

        if (!orderSuccessOverlay) {
            return;
        }

        if (successOrderNumber) {
            successOrderNumber.textContent = `#${orderNumber}`;
        }

        orderSuccessOverlay.classList.add("active");
        orderSuccessOverlay.setAttribute("aria-hidden", "false");
    }

    function closeOrderSuccess() {

        if (!orderSuccessOverlay) {
            return;
        }

        orderSuccessOverlay.classList.remove("active");
        orderSuccessOverlay.setAttribute("aria-hidden", "true");
    }

    if (successCloseButton) {

        successCloseButton.addEventListener(
            "click",
            closeOrderSuccess
        );

    }

    if (orderSuccessOverlay) {

        orderSuccessOverlay.addEventListener(
            "click",
            (event) => {

                if (event.target === orderSuccessOverlay) {
                    closeOrderSuccess();
                }

            }
        );

    }

    if (successTrackButton) {

        successTrackButton.addEventListener(
            "click",
            () => {

                const orderNumber =
                    successOrderNumber
                        ? successOrderNumber.textContent
                            .replace("#", "")
                            .trim()
                        : "";

                const phoneDigits =
                    String(
                        customerData.phone || ""
                    ).replace(
                        /\D/g,
                        ""
                    );

                const phoneLast4 =
                    phoneDigits.slice(-4);

                if (trackingOrderNumber) {
                    trackingOrderNumber.value = orderNumber;
                }

                if (trackingPhoneLast4) {
                    trackingPhoneLast4.value = phoneLast4;
                }

                closeOrderSuccess();
                openTracking();

            }
        );

    }

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


                        openProductCustomization(
                            product
                        );

                    }
                );

            }
        );

    }


    /* =========================================
       PERSONALIZAÇÃO DO PRODUTO
    ========================================= */

    async function openProductCustomization(
        product,
        existingItem = null
    ) {

        const overlay =
            document.createElement(
                "div"
            );


        overlay.className =
            "customization-overlay";


        overlay.innerHTML = `
            <div class="customization-modal">

                <button
                    type="button"
                    class="close-customization"
                    aria-label="Fechar personalização"
                >
                    ×
                </button>

                <h2>
                    ${product.name}
                </h2>

                <p>
                    ${product.description || ""}
                </p>

            </div>
        `;


        document.body.appendChild(
            overlay
        );


        const modal =
            overlay.querySelector(
                ".customization-modal"
            );


        const closeButton =
            overlay.querySelector(
                ".close-customization"
            );


        /* =========================================
           FECHAR PERSONALIZAÇÃO
        ========================================= */

        function closeCustomization() {

            document.removeEventListener(
                "keydown",
                handleEscape
            );


            overlay.remove();

        }


        function handleEscape(event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeCustomization();

            }

        }


        closeButton.addEventListener(
            "click",
            closeCustomization
        );


        overlay.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    overlay
                ) {

                    closeCustomization();

                }

            }
        );


        document.addEventListener(
            "keydown",
            handleEscape
        );


        /* =========================================
           VALORES INICIAIS
        ========================================= */

        const basePrice =
            Number(
                product.price
            );


        const selectedAddons =
            existingItem?.addons
                ? existingItem.addons.map(
                    (addon) => ({
                        id:
                            addon.id,

                        name:
                            addon.name,

                        price:
                            Number(
                                addon.price
                            )
                    })
                )
                : [];


        const selectedIngredients =
            existingItem?.removedIngredients
                ? existingItem.removedIngredients.map(
                    (ingredient) => ({
                        id:
                            ingredient.id,

                        name:
                            ingredient.name
                    })
                )
                : [];


        let quantity =
            Number(
                existingItem?.quantity
            ) || 1;


        /* =========================================
           ADICIONAIS
        ========================================= */

        modal.insertAdjacentHTML(
            "beforeend",
            `
                <div class="customization-section">

                    <h3>
                        Adicionais
                    </h3>

                    <div class="addons-list"></div>

                </div>
            `
        );


        /* =========================================
           INGREDIENTES
        ========================================= */

        modal.insertAdjacentHTML(
            "beforeend",
            `
                <div class="customization-section">

                    <h3>
                        Remover ingredientes
                    </h3>

                    <div class="ingredients-list"></div>

                </div>
            `
        );


        /* =========================================
           QUANTIDADE
        ========================================= */

        modal.insertAdjacentHTML(
            "beforeend",
            `
                <div class="customization-section">

                    <h3>
                        Quantidade
                    </h3>

                    <div class="customization-quantity">

                        <button
                            type="button"
                            class="quantity-decrease"
                        >
                            −
                        </button>

                        <span class="quantity-value">
                            ${quantity}
                        </span>

                        <button
                            type="button"
                            class="quantity-increase"
                        >
                            +
                        </button>

                    </div>

                </div>
            `
        );


        /* =========================================
           TOTAL
        ========================================= */

        modal.insertAdjacentHTML(
            "beforeend",
            `
                <div class="customization-total">

                    <span>
                        Total
                    </span>

                    <strong>
                        ${formatPrice(
                basePrice +
                selectedAddons.reduce(
                    (
                        total,
                        addon
                    ) =>
                        total +
                        Number(
                            addon.price
                        ),
                    0
                )
            )}
                    </strong>

                </div>
            `
        );


        /* =========================================
           BOTÃO CONFIRMAR
        ========================================= */

        modal.insertAdjacentHTML(
            "beforeend",
            `
                <button
                    type="button"
                    class="customization-confirm"
                >
                    ${existingItem
                ? "Salvar alterações"
                : "Adicionar ao carrinho"
            }
                </button>
            `
        );


        /* =========================================
           ELEMENTOS
        ========================================= */

        const addonsList =
            modal.querySelector(
                ".addons-list"
            );


        const ingredientsList =
            modal.querySelector(
                ".ingredients-list"
            );


        const quantityValue =
            modal.querySelector(
                ".quantity-value"
            );


        const decreaseButton =
            modal.querySelector(
                ".quantity-decrease"
            );


        const increaseButton =
            modal.querySelector(
                ".quantity-increase"
            );


        const totalElement =
            modal.querySelector(
                ".customization-total strong"
            );


        const confirmButton =
            modal.querySelector(
                ".customization-confirm"
            );


        /* =========================================
           CALCULAR TOTAL DOS ADICIONAIS
        ========================================= */

        function calculateAddonsTotal() {

            return selectedAddons.reduce(
                (
                    total,
                    addon
                ) => {

                    return (
                        total +
                        Number(
                            addon.price
                        )
                    );

                },
                0
            );

        }


        /* =========================================
           ATUALIZAR TOTAL
        ========================================= */

        function updateCustomizationTotal() {

            const addonsTotal =
                calculateAddonsTotal();


            const itemPrice =
                basePrice +
                addonsTotal;


            const total =
                itemPrice *
                quantity;


            totalElement.textContent =
                formatPrice(
                    total
                );

        }


        /* =========================================
           CARREGAR ADICIONAIS
        ========================================= */

        const {
            data: addons,
            error: addonsError
        } =
            await supabaseClient
                .from(
                    "product_addons"
                )
                .select(
                    "id, name, price"
                )
                .eq(
                    "product_id",
                    product.id
                )
                .eq(
                    "active",
                    true
                );


        if (addonsError) {

            console.error(
                "Erro ao carregar adicionais:",
                addonsError
            );

        }


        /* =========================================
           MOSTRAR ADICIONAIS
        ========================================= */

        if (
            !addons ||
            addons.length === 0
        ) {

            addonsList.innerHTML = `
                <p>
                    Nenhum adicional disponível.
                </p>
            `;

        }


        (addons || []).forEach(
            (addon) => {

                const item =
                    document.createElement(
                        "label"
                    );


                item.className =
                    "addon-item";


                item.innerHTML = `
                    <input
                        type="checkbox"
                        value="${addon.id}"
                    >

                    <span>
                        ${addon.name}
                    </span>

                    <strong>
                        + ${formatPrice(
                    addon.price
                )}
                    </strong>
                `;


                addonsList.appendChild(
                    item
                );


                const checkbox =
                    item.querySelector(
                        'input[type="checkbox"]'
                    );


                if (
                    selectedAddons.some(
                        (selected) =>
                            selected.id ===
                            addon.id
                    )
                ) {

                    checkbox.checked =
                        true;

                }


                checkbox.addEventListener(
                    "change",
                    () => {

                        if (
                            checkbox.checked
                        ) {

                            const alreadySelected =
                                selectedAddons.some(
                                    (selected) =>
                                        selected.id ===
                                        addon.id
                                );


                            if (
                                !alreadySelected
                            ) {

                                selectedAddons.push(
                                    addon
                                );

                            }

                        } else {

                            const index =
                                selectedAddons.findIndex(
                                    (item) =>
                                        item.id ===
                                        addon.id
                                );


                            if (
                                index !==
                                -1
                            ) {

                                selectedAddons.splice(
                                    index,
                                    1
                                );

                            }

                        }


                        updateCustomizationTotal();


                        console.log(
                            "Adicionais selecionados:",
                            selectedAddons
                        );

                    }
                );

            }
        );


        /* =========================================
           CARREGAR INGREDIENTES
        ========================================= */

        const {
            data: ingredients,
            error: ingredientsError
        } =
            await supabaseClient
                .from(
                    "product_removable_ingredients"
                )
                .select(
                    "id, name"
                )
                .eq(
                    "product_id",
                    product.id
                )
                .eq(
                    "active",
                    true
                );


        if (ingredientsError) {

            console.error(
                "Erro ao carregar ingredientes:",
                ingredientsError
            );

        }


        /* =========================================
           MOSTRAR INGREDIENTES
        ========================================= */

        if (
            !ingredients ||
            ingredients.length === 0
        ) {

            ingredientsList.innerHTML = `
                <p>
                    Nenhum ingrediente removível cadastrado.
                </p>
            `;

        }


        (ingredients || []).forEach(
            (ingredient) => {

                const item =
                    document.createElement(
                        "label"
                    );


                item.className =
                    "ingredient-item";


                item.innerHTML = `
                    <input
                        type="checkbox"
                        value="${ingredient.id}"
                    >

                    <span>
                        ${ingredient.name}
                    </span>
                `;


                ingredientsList.appendChild(
                    item
                );


                const checkbox =
                    item.querySelector(
                        'input[type="checkbox"]'
                    );


                if (
                    selectedIngredients.some(
                        (selected) =>
                            selected.id ===
                            ingredient.id
                    )
                ) {

                    checkbox.checked =
                        true;

                }


                checkbox.addEventListener(
                    "change",
                    () => {

                        if (
                            checkbox.checked
                        ) {

                            const alreadySelected =
                                selectedIngredients.some(
                                    (selected) =>
                                        selected.id ===
                                        ingredient.id
                                );


                            if (
                                !alreadySelected
                            ) {

                                selectedIngredients.push(
                                    ingredient
                                );

                            }

                        } else {

                            const index =
                                selectedIngredients.findIndex(
                                    (item) =>
                                        item.id ===
                                        ingredient.id
                                );


                            if (
                                index !==
                                -1
                            ) {

                                selectedIngredients.splice(
                                    index,
                                    1
                                );

                            }

                        }


                        console.log(
                            "Ingredientes removidos:",
                            selectedIngredients
                        );

                    }
                );

            }
        );


        /* =========================================
           DIMINUIR QUANTIDADE
        ========================================= */

        decreaseButton.addEventListener(
            "click",
            () => {

                if (
                    quantity > 1
                ) {

                    quantity -=
                        1;


                    quantityValue.textContent =
                        quantity;


                    updateCustomizationTotal();

                }

            }
        );


        /* =========================================
           AUMENTAR QUANTIDADE
        ========================================= */

        increaseButton.addEventListener(
            "click",
            () => {

                quantity +=
                    1;


                quantityValue.textContent =
                    quantity;


                updateCustomizationTotal();

            }
        );


        /* =========================================
           ADICIONAR / EDITAR ITEM
        ========================================= */

        confirmButton.addEventListener(
            "click",
            () => {

                const addonsTotal =
                    calculateAddonsTotal();


                const itemPrice =
                    basePrice +
                    addonsTotal;


                const customizedItem = {

                    id:
                        existingItem
                            ? existingItem.id
                            : `${product.slug}-${Date.now()}`,

                    productId:
                        product.id,

                    productSlug:
                        product.slug,

                    name:
                        product.name,

                    description:
                        product.description ||
                        "",

                    price:
                        itemPrice,

                    quantity:
                        quantity,

                    addons:
                        selectedAddons.map(
                            (addon) => ({

                                id:
                                    addon.id,

                                name:
                                    addon.name,

                                price:
                                    Number(
                                        addon.price
                                    )

                            })
                        ),

                    removedIngredients:
                        selectedIngredients.map(
                            (ingredient) => ({

                                id:
                                    ingredient.id,

                                name:
                                    ingredient.name

                            })
                        ),

                    addonsTotal:
                        addonsTotal

                };


                /* =====================================
                   EDITAR ITEM EXISTENTE
                ===================================== */

                if (
                    existingItem
                ) {

                    const index =
                        cart.findIndex(
                            (item) =>
                                item.id ===
                                existingItem.id
                        );


                    if (
                        index !==
                        -1
                    ) {

                        cart[index] =
                            customizedItem;

                    }

                }


                /* =====================================
                   NOVO ITEM
                ===================================== */

                else {

                    cart.push(
                        customizedItem
                    );

                }


                saveCart();

                renderCart();

                closeCustomization();

            }
        );


        /* =========================================
           TOTAL INICIAL
        ========================================= */

        updateCustomizationTotal();

    }


    /* =========================================
       ADICIONAR PRODUTO
       COMPATIBILIDADE
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


        if (
            existingProduct
        ) {

            existingProduct.quantity +=
                1;

        } else {

            cart.push({

                id:
                    product.slug,

                productId:
                    product.id,

                productSlug:
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
                    1,

                addons:
                    [],

                removedIngredients:
                    [],

                addonsTotal:
                    0

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

                return (
                    total +
                    (
                        Number(
                            product.price
                        ) *
                        Number(
                            product.quantity
                        )
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

                    return (
                        total +
                        Number(
                            product.quantity
                        )
                    );

                },
                0
            );


        if (
            cartCountElement
        ) {

            cartCountElement.textContent =
                totalItems;

        }

    }


    /* =========================================
       ATUALIZAR SUBTOTAL
    ========================================= */

    function updateCartSubtotal() {

        if (
            !cartSubtotalElement
        ) {

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

        if (
            !cartItemsContainer
        ) {

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


                /* =====================================
                   INFORMAÇÕES
                ===================================== */

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


                productInfo.appendChild(
                    productName
                );


                /* =====================================
                   ADICIONAIS
                ===================================== */

                if (
                    Array.isArray(
                        product.addons
                    ) &&
                    product.addons.length >
                    0
                ) {

                    const addonsElement =
                        document.createElement(
                            "small"
                        );


                    addonsElement.className =
                        "cart-item-customization";


                    addonsElement.textContent =
                        "Adicionais: " +
                        product.addons
                            .map(
                                (addon) =>
                                    addon.name
                            )
                            .join(
                                ", "
                            );


                    productInfo.appendChild(
                        addonsElement
                    );

                }


                /* =====================================
                   INGREDIENTES REMOVIDOS
                ===================================== */

                if (
                    Array.isArray(
                        product.removedIngredients
                    ) &&
                    product.removedIngredients.length >
                    0
                ) {

                    const removedElement =
                        document.createElement(
                            "small"
                        );


                    removedElement.className =
                        "cart-item-customization";


                    removedElement.textContent =
                        "Sem: " +
                        product.removedIngredients
                            .map(
                                (ingredient) =>
                                    ingredient.name
                            )
                            .join(
                                ", "
                            );


                    productInfo.appendChild(
                        removedElement
                    );

                }


                /* =====================================
                   PREÇO
                ===================================== */

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
                    productPrice
                );


                /* =====================================
                   CONTROLES
                ===================================== */

                const controls =
                    document.createElement(
                        "div"
                    );


                controls.className =
                    "cart-product-controls";


                /* =====================================
                   DIMINUIR
                ===================================== */

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


                /* =====================================
                   QUANTIDADE
                ===================================== */

                const quantity =
                    document.createElement(
                        "span"
                    );


                quantity.textContent =
                    product.quantity;


                /* =====================================
                   AUMENTAR
                ===================================== */

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


                /* =====================================
                   EDITAR
                ===================================== */

                const editButton =
                    document.createElement(
                        "button"
                    );


                editButton.type =
                    "button";


                editButton.className =
                    "edit-item";


                editButton.textContent =
                    "✏️";


                editButton.setAttribute(
                    "aria-label",
                    `Editar ${product.name}`
                );


                /* =====================================
                   REMOVER
                ===================================== */

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


                /* =====================================
                   DIMINUIR
                ===================================== */

                decreaseButton.addEventListener(
                    "click",
                    () => {

                        if (
                            Number(
                                product.quantity
                            ) > 1
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


                /* =====================================
                   AUMENTAR
                ===================================== */

                increaseButton.addEventListener(
                    "click",
                    () => {

                        product.quantity +=
                            1;


                        saveCart();

                        renderCart();

                    }
                );


                /* =====================================
                   EDITAR
                ===================================== */

                editButton.addEventListener(
                    "click",
                    () => {

                        const catalogProduct =
                            supabaseProducts.find(
                                (item) =>
                                    item.id ===
                                    product.productId ||
                                    item.slug ===
                                    product.productSlug ||
                                    item.name ===
                                    product.name
                            );


                        if (
                            !catalogProduct
                        ) {

                            console.error(
                                "Produto original não encontrado para edição:",
                                product
                            );


                            window.alert(
                                "Não foi possível editar este produto."
                            );


                            return;

                        }


                        closeCart();


                        openProductCustomization(
                            catalogProduct,
                            product
                        );

                    }
                );


                /* =====================================
                   REMOVER
                ===================================== */

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


                /* =====================================
                   CONTROLES
                ===================================== */

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
                    editButton
                );


                controls.appendChild(
                    removeButton
                );


                /* =====================================
                   ITEM
                ===================================== */

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

    if (
        clearCartButton
    ) {

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


                if (
                    !confirmed
                ) {

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

        if (
            !productsContainer
        ) {

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
       BUSCAR CEP
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


            if (
                !response.ok
            ) {

                throw new Error(
                    "Não foi possível consultar o CEP."
                );

            }


            const data =
                await response.json();


            if (
                data.erro
            ) {

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


        if (
            !address
        ) {

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


            if (
                error
            ) {

                console.error(
                    "Erro ao calcular entrega:",
                    error
                );


                window.alert(
                    "Não foi possível calcular a taxa de entrega. Tente novamente."
                );


                return false;

            }


            if (
                !data
            ) {

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
       SALVAR PEDIDO NO SUPABASE
    ========================================= */

    async function saveOrderToSupabase() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "supabaseClient não foi encontrado."
            );


            return null;

        }


        try {

            /* =====================================
               DADOS DO CLIENTE
            ===================================== */

            const customer = {

                name:
                    customerData.name,

                phone:
                    customerData.phone,

                cep:
                    customerData.cep,

                street:
                    customerData.street,

                number:
                    customerData.number,

                complement:
                    customerData.complement,

                neighborhood:
                    customerData.neighborhood,

                city:
                    customerData.city,

                state:
                    customerData.state

            };


            /* =====================================
               VALORES DO PEDIDO
            ===================================== */

            const subtotal =
                calculateSubtotal();


            const total =
                calculateTotal();


            const order = {

                subtotal:
                    subtotal,

                delivery_fee:
                    Number(
                        deliveryFee
                    ) || 0,

                total:
                    total,

                payment_method:
                    customerData.payment ||
                    "Pix",

                notes:
                    customerData.note ||
                    ""

            };


            /* =====================================
               ITENS
            ===================================== */

            const items =
                cart.map(
                    (product) => ({

                        product_id:
                            Number(
                                product.productId
                            ),

                        product_name:
                            product.name,

                        quantity:
                            Number(
                                product.quantity
                            ),

                        unit_price:
                            Number(
                                product.price
                            ),

                        addons:
                            Array.isArray(
                                product.addons
                            )
                                ? product.addons
                                : [],

                        removed_ingredients:
                            Array.isArray(
                                product.removedIngredients
                            )
                                ? product.removedIngredients
                                : [],

                        addons_total:
                            Number(
                                product.addonsTotal
                            ) || 0,

                        item_total:
                            Number(
                                product.price
                            ) *
                            Number(
                                product.quantity
                            )

                    })
                );


            /* =====================================
               CHAMAR RPC
            ===================================== */

            const {
                data,
                error
            } =
                await supabaseClient
                    .rpc(
                        "create_order",
                        {
                            p_customer:
                                customer,

                            p_order:
                                order,

                            p_items:
                                items
                        }
                    );


            if (
                error
            ) {

                console.error(
                    "Erro ao criar pedido:",
                    error
                );


                return null;

            }


            if (
                !data
            ) {

                console.error(
                    "O Supabase não retornou os dados do pedido."
                );


                return null;

            }


            console.log(
                "Pedido salvo no Supabase:",
                data
            );


            return {

                id:
                    data.id,

                order_number:
                    data.order_number,

                tracking_token:
                    data.tracking_token

            };

        } catch (error) {

            console.error(
                "Erro inesperado ao salvar pedido:",
                error
            );


            return null;

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

        if (
            checkoutOverlay
        ) {

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
           CONTROLE DE DUPLO CLIQUE
        ========================================= */

        let orderBeingCreated =
            false;


        /* =========================================
           FECHAR CHECKOUT
        ========================================= */

        closeCheckoutButton.addEventListener(
            "click",
            closeCheckout
        );


        /* =========================================
           TROCO
        ========================================= */

        function updateCashChangeVisibility() {

            const selectedPayment =
                checkoutOverlay.querySelector(
                    'input[name="payment"]:checked'
                );


            if (
                !cashChange
            ) {

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


                if (
                    changeForInput
                ) {

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
           CEP
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
           NÚMERO / ENTREGA AUTOMÁTICA
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
           FORMULÁRIO DO CLIENTE
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


                if (
                    submitButton
                ) {

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
                        neighborhoodInput.value
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


                    if (
                        !deliveryValid
                    ) {

                        if (
                            submitButton
                        ) {

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


                if (
                    submitButton
                ) {

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
           VOLTAR ETAPA 2
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
           CONFIRMAR PEDIDO
        ========================================= */

        confirmOrder.addEventListener(
            "click",
            async () => {

                /* =====================================
                   IMPEDIR SEGUNDO CLIQUE
                ===================================== */

                if (
                    orderBeingCreated
                ) {

                    return;

                }


                /* =====================================
                   VALIDAR ENTREGA
                ===================================== */

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


                /* =====================================
                   ABRIR JANELA DO WHATSAPP
                   DURANTE O CLIQUE DO USUÁRIO
                ===================================== */

                let whatsappWindow =
                    null;


                const whatsappNumber =
                    storeWhatsapp
                        ? storeWhatsapp.replace(
                            /\D/g,
                            ""
                        )
                        : "";


                if (
                    whatsappNumber
                ) {

                    whatsappWindow =
                        window.open(
                            "about:blank",
                            "_blank"
                        );

                }


                /* =====================================
                   BLOQUEAR BOTÃO
                ===================================== */

                orderBeingCreated =
                    true;


                confirmOrder.disabled =
                    true;


                confirmOrder.textContent =
                    "Salvando pedido...";


                try {

                    /* =================================
                       CRIAR PEDIDO
                    ================================= */

                    const order =
                        await saveOrderToSupabase();


                    if (
                        !order
                    ) {

                        throw new Error(
                            "Não foi possível salvar o pedido."
                        );

                    }


                    console.log(
                        "Número do pedido:",
                        order.order_number
                    );


                    console.log(
                        "Token de acompanhamento:",
                        order.tracking_token
                    );

                    openOrderSuccess(
                        order.order_number
                    );


                    /* =================================
                       ABRIR WHATSAPP
                    ================================= */

                    sendOrderToWhatsApp(
                        order,
                        whatsappWindow
                    );


                    /* =================================
                       FINALIZAR
                    ================================= */

                    orderBeingCreated =
                        false;


                    confirmOrder.disabled =
                        false;


                    confirmOrder.textContent =
                        "Confirmar pedido";

                } catch (error) {

                    console.error(
                        "Erro ao finalizar pedido:",
                        error
                    );


                    orderBeingCreated =
                        false;


                    confirmOrder.disabled =
                        false;


                    confirmOrder.textContent =
                        "Confirmar pedido";


                    if (
                        whatsappWindow &&
                        !whatsappWindow.closed
                    ) {

                        whatsappWindow.close();

                    }


                    window.alert(
                        "Não foi possível finalizar o pedido. Tente novamente."
                    );

                }

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
                customerData.name ||
                "",

            phone:
                customerData.phone ||
                "",

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


        if (
            pixRadio
        ) {

            pixRadio.checked =
                true;

        }


        const cashChange =
            checkoutOverlay.querySelector(
                ".cash-change"
            );


        if (
            cashChange
        ) {

            cashChange.style.display =
                "none";

        }


        const cepStatus =
            checkoutOverlay.querySelector(
                "#cepStatus"
            );


        if (
            cepStatus
        ) {

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

        if (
            !checkoutOverlay
        ) {

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

        if (
            !checkoutOverlay
        ) {

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


                if (
                    field
                ) {

                    field.value =
                        value;

                }

            }
        );


        const paymentRadio =
            checkoutOverlay.querySelector(
                `input[name="payment"][value="${customerData.payment || "Pix"}"]`
            );


        if (
            paymentRadio
        ) {

            paymentRadio.checked =
                true;

        }


        const changeFor =
            checkoutOverlay.querySelector(
                "#changeFor"
            );


        if (
            changeFor
        ) {

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


        if (
            cashChange
        ) {

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


            if (
                cepStatus
            ) {

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

        if (
            !checkoutOverlay
        ) {

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
                        Number(
                            product.price
                        ) *
                        Number(
                            product.quantity
                        )
                    );


                item.appendChild(
                    itemName
                );


                item.appendChild(
                    itemPrice
                );


                /* =====================================
                   ADICIONAIS
                ===================================== */

                if (
                    Array.isArray(
                        product.addons
                    ) &&
                    product.addons.length >
                    0
                ) {

                    const addons =
                        document.createElement(
                            "small"
                        );


                    addons.textContent =
                        "Adicionais: " +
                        product.addons
                            .map(
                                (addon) =>
                                    addon.name
                            )
                            .join(
                                ", "
                            );


                    item.appendChild(
                        addons
                    );

                }


                /* =====================================
                   INGREDIENTES REMOVIDOS
                ===================================== */

                if (
                    Array.isArray(
                        product.removedIngredients
                    ) &&
                    product.removedIngredients.length >
                    0
                ) {

                    const removed =
                        document.createElement(
                            "small"
                        );


                    removed.textContent =
                        "Sem: " +
                        product.removedIngredients
                            .map(
                                (ingredient) =>
                                    ingredient.name
                            )
                            .join(
                                ", "
                            );


                    item.appendChild(
                        removed
                    );

                }


                reviewItems.appendChild(
                    item
                );

            }
        );


        /* =========================================
           ENDEREÇO
        ========================================= */

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


        /* =========================================
           PAGAMENTO
        ========================================= */

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


        /* =========================================
           TOTAIS
        ========================================= */

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
    ========================================= */

    function sendOrderToWhatsApp(
        order,
        whatsappWindow = null
    ) {

        /* =========================================
           VALIDAR PEDIDO
        ========================================= */

        if (
            !order
        ) {

            console.error(
                "Pedido não recebido para envio ao WhatsApp."
            );


            return;

        }


        const whatsappNumber =
            storeWhatsapp
                ? storeWhatsapp.replace(
                    /\D/g,
                    ""
                )
                : "";


        /* =========================================
           CALCULAR VALORES
        ========================================= */

        const subtotal =
            calculateSubtotal();


        const total =
            calculateTotal();


        /* =========================================
           MONTAR MENSAGEM
        ========================================= */

        let message =
            "Olá! Gostaria de fazer um pedido\n\n";


        message +=
            `*PEDIDO #${order.order_number}*\n`;


        cart.forEach(
            (product) => {

                message +=
                    `${product.quantity}x ${product.name} - ${formatPrice(
                        Number(
                            product.price
                        ) *
                        Number(
                            product.quantity
                        )
                    )}\n`;


                /* =================================
                   ADICIONAIS
                ================================= */

                if (
                    Array.isArray(
                        product.addons
                    ) &&
                    product.addons.length >
                    0
                ) {

                    message +=
                        `  Adicionais: ${product.addons
                            .map(
                                (addon) =>
                                    `${addon.name} (+${formatPrice(
                                        addon.price
                                    )})`
                            )
                            .join(
                                ", "
                            )}\n`;

                }


                /* =================================
                   INGREDIENTES REMOVIDOS
                ================================= */

                if (
                    Array.isArray(
                        product.removedIngredients
                    ) &&
                    product.removedIngredients.length >
                    0
                ) {

                    message +=
                        `  Sem: ${product.removedIngredients
                            .map(
                                (ingredient) =>
                                    ingredient.name
                            )
                            .join(
                                ", "
                            )}\n`;

                }

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


        /* =========================================
           ABRIR WHATSAPP
        ========================================= */

        if (
            whatsappNumber
        ) {

            const whatsappUrl =
                `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    message
                )}`;


            if (
                whatsappWindow &&
                !whatsappWindow.closed
            ) {

                whatsappWindow.location.href =
                    whatsappUrl;

            } else {

                window.open(
                    whatsappUrl,
                    "_blank"
                );

            }

        } else {

            if (
                whatsappWindow &&
                !whatsappWindow.closed
            ) {

                whatsappWindow.close();

            }


            window.alert(
                `Pedido #${order.order_number} criado com sucesso.`
            );

        }


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
                customerData.name ||
                "",

            phone:
                customerData.phone ||
                "",

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

    if (
        checkoutButton
    ) {

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
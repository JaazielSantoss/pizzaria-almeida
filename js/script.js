/* =========================================
   PIZZARIA ALMEIDA
   CARRINHO + CHECKOUT
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
       ESTADO DO CARRINHO
    ========================================= */

    let cart =
        JSON.parse(
            localStorage.getItem(
                "pizzariaAlmeidaCart"
            )
        ) || [];


    /* =========================================
       DADOS DO CLIENTE
    ========================================= */

    let customerData =
        JSON.parse(
            localStorage.getItem(
                "pizzariaAlmeidaCustomer"
            )
        ) || {};


    /* =========================================
       FORMATAÇÃO DE PREÇO
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
            priceText
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
                .trim()
        );

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

        if (!cartPanel) {
            return;
        }


        cartPanel.classList.add("open");


        if (cartOverlay) {

            cartOverlay.classList.add("open");

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
       EVENTO DO BOTÃO DO CARRINHO
    ========================================= */

    if (cartButton) {

        cartButton.addEventListener(
            "click",
            openCart
        );

    }


    /* =========================================
       EVENTO FECHAR
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
   FILTRO DO CARDÁPIO
========================================= */

    const filterButtons =
        document.querySelectorAll(".menu-categories button");

    const productCards =
        document.querySelectorAll(".product-card");


    filterButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const selectedFilter =
                button.dataset.filter;


            /* ATIVA O BOTÃO SELECIONADO */

            filterButtons.forEach((filterButton) => {

                filterButton.classList.remove("active");

            });


            button.classList.add("active");


            /* FILTRA OS PRODUTOS */

            productCards.forEach((card) => {

                const category =
                    card.dataset.category;


                if (
                    selectedFilter === "todos" ||
                    category === selectedFilter
                ) {

                    card.style.display = "flex";

                } else {

                    card.style.display = "none";

                }

            });

        });

    });


    /* =========================================
       ADICIONAR PRODUTO
    ========================================= */

    const addButtons =
        document.querySelectorAll(
            ".add-product"
        );


    addButtons.forEach((button) => {

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


                const id =
                    productCard.dataset.product;


                const name =
                    productCard
                        .querySelector("h3")
                        ?.textContent
                        .trim() || "";


                const description =
                    productCard
                        .querySelector("p")
                        ?.textContent
                        .trim() || "";


                const priceText =
                    productCard
                        .querySelector("strong")
                        ?.textContent
                        .trim() || "";


                const price =
                    parsePrice(
                        priceText
                    );


                const existingProduct =
                    cart.find(
                        (product) =>
                            product.id === id
                    );


                if (existingProduct) {

                    existingProduct.quantity += 1;

                } else {

                    cart.push({

                        id: id,

                        name: name,

                        description:
                            description,

                        price: price,

                        quantity: 1

                    });

                }


                saveCart();

                renderCart();

                openCart();

            }
        );

    });


    /* =========================================
       CALCULAR SUBTOTAL
    ========================================= */

    function calculateSubtotal() {

        return cart.reduce(
            (total, product) => {

                return total +
                    (
                        product.price *
                        product.quantity
                    );

            },
            0
        );

    }


    /* =========================================
       ATUALIZAR CONTADOR
    ========================================= */

    function updateCartCount() {

        const totalItems =
            cart.reduce(
                (total, product) => {

                    return total +
                        product.quantity;

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


        const subtotal =
            calculateSubtotal();


        cartSubtotalElement.textContent =
            formatPrice(
                subtotal
            );

    }


    /* =========================================
       ÍCONE DA LIXEIRA
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


        /* =========================================
           CARRINHO VAZIO
        ========================================= */

        if (cart.length === 0) {

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


        /* =========================================
           PRODUTOS DO CARRINHO
        ========================================= */

        cart.forEach((product) => {

            const cartItem =
                document.createElement(
                    "div"
                );


            cartItem.className =
                "cart-item";


            /* =========================================
               INFORMAÇÕES
            ========================================= */

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
                    product.price *
                    product.quantity
                );


            productInfo.appendChild(
                productName
            );


            productInfo.appendChild(
                productPrice
            );


            /* =========================================
               CONTROLES
            ========================================= */

            const controls =
                document.createElement(
                    "div"
                );


            controls.className =
                "cart-product-controls";


            /* DIMINUIR */

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


            /* QUANTIDADE */

            const quantity =
                document.createElement(
                    "span"
                );


            quantity.textContent =
                product.quantity;


            /* AUMENTAR */

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


            /* LIXEIRA */

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


            /* =========================================
               DIMINUIR
            ========================================= */

            decreaseButton.addEventListener(
                "click",
                () => {

                    if (
                        product.quantity > 1
                    ) {

                        product.quantity -= 1;

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


            /* =========================================
               AUMENTAR
            ========================================= */

            increaseButton.addEventListener(
                "click",
                () => {

                    product.quantity += 1;

                    saveCart();

                    renderCart();

                }
            );


            /* =========================================
               REMOVER
            ========================================= */

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


            /* =========================================
               MONTAR CONTROLES
            ========================================= */

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


            /* =========================================
               MONTAR ITEM
            ========================================= */

            cartItem.appendChild(
                productInfo
            );


            cartItem.appendChild(
                controls
            );


            cartItemsContainer.appendChild(
                cartItem
            );

        });


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

                if (cart.length === 0) {
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
       CHECKOUT
    ========================================= */

    let checkoutOverlay = null;


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

                    <h2>Finalizar pedido</h2>

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

                    <h3>Seus dados</h3>

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
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="customerCep">
                                CEP
                            </label>

                            <input
                                type="text"
                                id="customerCep"
                                placeholder="00000-000"
                                maxlength="9"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="customerStreet">
                                Rua / Avenida
                            </label>

                            <input
                                type="text"
                                id="customerStreet"
                                placeholder="Rua / Avenida"
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


                    <div class="cash-change">

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


                    <div class="review-items"></div>


                    <div class="review-address"></div>


                    <div class="review-payment"></div>


                    <div class="review-total">

                        <span>Total</span>

                        <strong>
                            R$ 0,00
                        </strong>

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


        /* FECHAR CHECKOUT */

        closeCheckoutButton.addEventListener(
            "click",
            closeCheckout
        );


        /* TROCAR ETAPA */

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


            if (stepNumber === 3) {

                renderReview();

            }

        }


        /* SALVAR DADOS */

        customerForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


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
                        checkoutOverlay
                            .querySelector(
                                "#customerCep"
                            )
                            .value
                            .trim(),

                    street:
                        checkoutOverlay
                            .querySelector(
                                "#customerStreet"
                            )
                            .value
                            .trim(),

                    number:
                        checkoutOverlay
                            .querySelector(
                                "#customerNumber"
                            )
                            .value
                            .trim(),

                    complement:
                        checkoutOverlay
                            .querySelector(
                                "#customerComplement"
                            )
                            .value
                            .trim(),

                    neighborhood:
                        checkoutOverlay
                            .querySelector(
                                "#customerNeighborhood"
                            )
                            .value
                            .trim(),

                    city:
                        checkoutOverlay
                            .querySelector(
                                "#customerCity"
                            )
                            .value
                            .trim(),

                    state:
                        checkoutOverlay
                            .querySelector(
                                "#customerState"
                            )
                            .value
                            .trim(),

                    note:
                        checkoutOverlay
                            .querySelector(
                                "#orderNote"
                            )
                            .value
                            .trim(),

                    payment:
                        customerData.payment ||
                        "Pix",

                    changeFor:
                        customerData.changeFor ||
                        ""

                };


                saveCustomerData();

                showCheckoutStep(2);

            }
        );


        /* VOLTAR */

        checkoutBack.addEventListener(
            "click",
            () => {

                showCheckoutStep(1);

            }
        );


        /* PAGAMENTO */

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


                customerData.changeFor =
                    checkoutOverlay
                        .querySelector(
                            "#changeFor"
                        )
                        .value
                        .trim();


                saveCustomerData();

                showCheckoutStep(3);

            }
        );


        /* VOLTAR DA REVISÃO */

        backPayment.addEventListener(
            "click",
            () => {

                showCheckoutStep(2);

            }
        );


        /* CONFIRMAR */

        confirmOrder.addEventListener(
            "click",
            () => {

                sendOrderToWhatsApp();

            }
        );

    }


    /* =========================================
       ABRIR CHECKOUT
    ========================================= */

    function openCheckout() {

        if (cart.length === 0) {

            alert(
                "Adicione pelo menos um produto ao carrinho."
            );

            return;

        }


        createCheckout();

        closeCart();

        checkoutOverlay.classList.add(
            "open"
        );


        document.body.classList.add(
            "checkout-open"
        );


        loadCustomerData();

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
       CARREGAR CLIENTE
    ========================================= */

    function loadCustomerData() {

        if (!checkoutOverlay) {
            return;
        }


        const fields = {

            customerName:
                customerData.name || "",

            customerPhone:
                customerData.phone || "",

            customerCep:
                customerData.cep || "",

            customerStreet:
                customerData.street || "",

            customerNumber:
                customerData.number || "",

            customerComplement:
                customerData.complement || "",

            customerNeighborhood:
                customerData.neighborhood || "",

            customerCity:
                customerData.city ||
                "Suzano",

            customerState:
                customerData.state ||
                "SP",

            orderNote:
                customerData.note || ""

        };


        Object.entries(fields).forEach(
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
                customerData.changeFor ||
                "";

        }

    }


    /* =========================================
       REVISÃO DO PEDIDO
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


        const reviewTotal =
            checkoutOverlay.querySelector(
                ".review-total strong"
            );


        reviewItems.innerHTML =
            "";


        cart.forEach((product) => {

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

        });


        reviewAddress.innerHTML = `

            <h4>
                Endereço de entrega
            </h4>

            <p>
                ${escapeHtml(customerData.street)},
                ${escapeHtml(customerData.number)}
                ${customerData.complement
                ? ` - ${escapeHtml(customerData.complement)}`
                : ""
            }
            </p>

            <p>
                ${escapeHtml(customerData.neighborhood)}
                -
                ${escapeHtml(customerData.city)}
                /
                ${escapeHtml(customerData.state)}
            </p>

            <p>
                CEP:
                ${escapeHtml(customerData.cep)}
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


        reviewTotal.textContent =
            formatPrice(
                calculateSubtotal()
            );

    }


    /* =========================================
       ENVIAR PARA WHATSAPP
    ========================================= */

    function sendOrderToWhatsApp() {

        /*
         * SUBSTITUIR PELO WHATSAPP REAL
         * DA PIZZARIA ALMEIDA.
         */

        const whatsappNumber =
            "5511999999999";


        const subtotal =
            calculateSubtotal();


        let message =
            "Olá! Gostaria de fazer um pedido na Pizzaria Almeida.\n\n";


        message +=
            "*PEDIDO*\n";


        cart.forEach((product) => {

            message +=
                `${product.quantity}x ${product.name} - ${formatPrice(
                    product.price *
                    product.quantity
                )}\n`;

        });


        message +=
            `\n*Subtotal: ${formatPrice(
                subtotal
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


        if (customerData.note) {

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


        window.open(
            whatsappUrl,
            "_blank"
        );

    }


    /* =========================================
       PROTEÇÃO CONTRA HTML INJETADO
    ========================================= */

    function escapeHtml(value) {

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

            if (event.key === "Escape") {

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

});
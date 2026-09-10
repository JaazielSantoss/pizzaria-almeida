document.addEventListener("DOMContentLoaded", async () => {

    /* =========================================
       ELEMENTOS
    ========================================= */

    const navItems =
        document.querySelectorAll(".admin-nav-item");

    const sections =
        document.querySelectorAll(".admin-section");

    const pageTitle =
        document.querySelector("#adminPageTitle");

    const logoutButton =
        document.querySelector("#adminLogout");

    const productsAdminList =
        document.querySelector("#productsAdminList");

    const totalProducts =
        document.querySelector("#totalProducts");

    const newProductButton =
        document.querySelector("#newProductButton");

    const dashboardCards =
        document.querySelectorAll(".admin-card-button");


    /* =========================================
       DASHBOARD - CARDS CLICÁVEIS
    ========================================= */

    dashboardCards.forEach((card) => {

        card.addEventListener("click", () => {

            const sectionName =
                card.dataset.section;

            const navButton =
                document.querySelector(
                    `.admin-nav-item[data-section="${sectionName}"]`
                );

            if (navButton) {
                navButton.click();
            }

        });

    });


    /* =========================================
       NAVEGAÇÃO
    ========================================= */

    navItems.forEach((button) => {

        button.addEventListener("click", () => {

            const sectionName =
                button.dataset.section;

            navItems.forEach((item) => {
                item.classList.remove("active");
            });

            sections.forEach((section) => {
                section.classList.remove("active");
            });

            button.classList.add("active");

            const selectedSection =
                document.querySelector(
                    `#section-${sectionName}`
                );

            if (selectedSection) {
                selectedSection.classList.add("active");
            }

            const titles = {
                dashboard: "Dashboard",
                products: "Produtos",
                orders: "Pedidos",
                customers: "Clientes"
            };

            if (pageTitle) {
                pageTitle.textContent =
                    titles[sectionName] ||
                    "Dashboard";
            }

        });

    });


    /* =========================================
       LOGOUT
    ========================================= */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                const { error } =
                    await supabaseClient.auth.signOut();

                if (error) {

                    console.error(
                        "Erro ao sair:",
                        error
                    );

                    return;

                }

                window.location.href =
                    "index.html";

            }
        );

    }


    /* =========================================
       CARREGAR PRODUTOS
    ========================================= */

    async function loadProducts() {

        if (!productsAdminList) {
            return;
        }

        productsAdminList.innerHTML =
            "<p>Carregando produtos...</p>";

        const { data, error } =
            await supabaseClient
                .from("products")
                .select(
                    "id, slug, name, description, price, category, image_url, active"
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );

        if (error) {

            console.error(
                "Erro ao carregar produtos:",
                error
            );

            productsAdminList.innerHTML =
                "<p>Não foi possível carregar os produtos.</p>";

            return;

        }

        if (totalProducts) {
            totalProducts.textContent =
                data.length;
        }

        if (data.length === 0) {

            productsAdminList.innerHTML =
                "<p>Nenhum produto cadastrado.</p>";

            return;

        }

        productsAdminList.innerHTML =
            "";

        data.forEach((product) => {

            createProductAdminItem(
                product
            );

        });

    }


    /* =========================================
       CRIAR ITEM DO PRODUTO
    ========================================= */

    function createProductAdminItem(product) {

        const productItem =
            document.createElement("div");

        productItem.className =
            "admin-product-item";


        const info =
            document.createElement("div");

        info.className =
            "admin-product-info";


        const name =
            document.createElement("h4");

        name.textContent =
            product.name;


        const description =
            document.createElement("p");

        description.textContent =
            product.description ||
            "";


        const price =
            document.createElement("strong");

        price.textContent =
            Number(
                product.price
            ).toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );


        const status =
            document.createElement("span");

        status.className =
            product.active
                ? "product-status active"
                : "product-status inactive";

        status.textContent =
            product.active
                ? "Ativo"
                : "Inativo";


        info.appendChild(name);
        info.appendChild(description);
        info.appendChild(price);
        info.appendChild(status);


        /* =========================================
           AÇÕES
        ========================================= */

        const actions =
            document.createElement("div");

        actions.className =
            "admin-product-actions";


        /* =========================================
           EDITAR
        ========================================= */

        const editButton =
            document.createElement("button");

        editButton.type =
            "button";

        editButton.className =
            "admin-edit-button";

        editButton.textContent =
            "Editar";


        editButton.addEventListener(
            "click",
            () => {

                openEditProduct(
                    product
                );

            }
        );


        /* =========================================
           EXCLUIR
        ========================================= */

        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "admin-delete-button";

        deleteButton.textContent =
            "Excluir";


        deleteButton.addEventListener(
            "click",
            async () => {

                await deleteProduct(
                    product
                );

            }
        );


        /* =========================================
           SWITCH ATIVO / INATIVO
        ========================================= */

        const statusSwitch =
            document.createElement("label");

        statusSwitch.className =
            "product-status-switch";


        const statusInput =
            document.createElement("input");

        statusInput.type =
            "checkbox";

        statusInput.checked =
            product.active;


        const statusSlider =
            document.createElement("span");

        statusSlider.className =
            "product-status-slider";


        statusSwitch.appendChild(
            statusInput
        );

        statusSwitch.appendChild(
            statusSlider
        );


        const statusText =
            document.createElement("span");

        statusText.className =
            "product-status-text";

        statusText.textContent =
            product.active
                ? "Ativo"
                : "Inativo";


        const statusContainer =
            document.createElement("div");

        statusContainer.className =
            "product-status-control";


        statusContainer.appendChild(
            statusSwitch
        );

        statusContainer.appendChild(
            statusText
        );


        statusInput.addEventListener(
            "change",
            async () => {

                await toggleProductStatus(
                    product,
                    statusInput,
                    statusText
                );

            }
        );


        actions.appendChild(
            statusContainer
        );

        actions.appendChild(
            editButton
        );

        actions.appendChild(
            deleteButton
        );


        productItem.appendChild(
            info
        );

        productItem.appendChild(
            actions
        );

        productsAdminList.appendChild(
            productItem
        );

    }


    /* =========================================
       EXCLUIR PRODUTO
    ========================================= */

    async function deleteProduct(product) {

        const confirmed =
            window.confirm(
                `Tem certeza que deseja excluir "${product.name}"?\n\n` +
                `Os adicionais e ingredientes desse produto também serão excluídos.`
            );


        if (!confirmed) {
            return;
        }


        const {
            error
        } =
            await supabaseClient
                .from("products")
                .delete()
                .eq(
                    "id",
                    product.id
                );


        if (error) {

            console.error(
                "Erro ao excluir produto:",
                error
            );


            alert(
                "Não foi possível excluir o produto."
            );


            return;

        }


        alert(
            "Produto excluído com sucesso."
        );


        await loadProducts();

    }


    /* =========================================
       ATIVAR / DESATIVAR PRODUTO
    ========================================= */

    async function toggleProductStatus(
        product,
        checkbox,
        statusText
    ) {

        const newStatus =
            checkbox.checked;


        checkbox.disabled =
            true;


        const {
            error
        } =
            await supabaseClient
                .from("products")
                .update({
                    active: newStatus
                })
                .eq(
                    "id",
                    product.id
                );


        if (error) {

            console.error(
                "Erro ao alterar status do produto:",
                error
            );


            checkbox.checked =
                product.active;


            statusText.textContent =
                product.active
                    ? "Ativo"
                    : "Inativo";


            alert(
                "Não foi possível alterar o status do produto."
            );


            checkbox.disabled =
                false;


            return;

        }


        product.active =
            newStatus;


        statusText.textContent =
            newStatus
                ? "Ativo"
                : "Inativo";


        checkbox.disabled =
            false;

    }


    /* =========================================
       MODAL BASE
    ========================================= */

    function createProductModal(
        title,
        subtitle,
        buttonText
    ) {

        closeProductModal();


        const overlay =
            document.createElement("div");

        overlay.className =
            "product-modal-overlay";


        overlay.innerHTML = `

            <div class="product-modal">

                <div class="product-modal-header">

                    <div>

                        <h2>
                            ${title}
                        </h2>

                        <p>
                            ${subtitle}
                        </p>

                    </div>


                    <button
                        type="button"
                        class="product-modal-close"
                        aria-label="Fechar"
                    >
                        ×
                    </button>

                </div>


                <form
                    class="product-form"
                    id="productForm"
                >

                    <div class="product-form-group">

                        <label for="productName">
                            Nome
                        </label>

                        <input
                            type="text"
                            id="productName"
                            required
                        >

                    </div>


                    <div class="product-form-group">

                        <label for="productDescription">
                            Descrição
                        </label>

                        <textarea
                            id="productDescription"
                            rows="4"
                            required
                        ></textarea>

                    </div>


                    <div class="product-form-group">

                        <label for="productPrice">
                            Preço
                        </label>

                        <input
                            type="number"
                            id="productPrice"
                            min="0"
                            step="0.01"
                            required
                        >

                    </div>


                    <div class="product-form-group">

                        <label for="productCategory">
                            Categoria
                        </label>

                        <select
                            id="productCategory"
                            required
                        >

                            <option value="pizzas">
                                Pizzas
                            </option>

                            <option value="pizzas-doces">
                                Pizzas Doces
                            </option>

                            <option value="bebidas-2l">
                                Bebidas 2 litros
                            </option>

                            <option value="bebidas-lata">
                                Bebidas Lata
                            </option>

                        </select>

                    </div>


                    <div class="product-form-group">

                        <label for="productImage">
                            Imagem do produto
                        </label>

                        <input
                            type="file"
                            id="productImage"
                            accept="image/jpeg,image/png,image/webp"
                        >

                        <small class="product-image-help">
                            JPG, PNG ou WebP. Máximo de 5 MB.
                        </small>

                    </div>


                    <div class="product-image-preview-container">

                        <span>
                            Pré-visualização
                        </span>

                        <img
                            id="productImagePreview"
                            alt="Pré-visualização do produto"
                        >

                    </div>


                    <!-- ADICIONAIS -->

                    <div class="product-options-section">

                        <div class="product-options-header">

                            <div>

                                <h3>
                                    Adicionais
                                </h3>

                                <p>
                                    Opções que aumentam o preço.
                                </p>

                            </div>


                            <button
                                type="button"
                                class="product-add-option-button"
                                id="addAddonButton"
                            >
                                + Adicionar adicional
                            </button>

                        </div>


                        <div
                            class="product-options-list"
                            id="addonsList"
                        >

                            <p class="product-options-empty">
                                Nenhum adicional cadastrado.
                            </p>

                        </div>

                    </div>


                    <!-- INGREDIENTES -->

                    <div class="product-options-section">

                        <div class="product-options-header">

                            <div>

                                <h3>
                                    Ingredientes removíveis
                                </h3>

                                <p>
                                    Ingredientes que o cliente pode retirar.
                                </p>

                            </div>


                            <button
                                type="button"
                                class="product-add-option-button"
                                id="addIngredientButton"
                            >
                                + Adicionar ingrediente
                            </button>

                        </div>


                        <div
                            class="product-options-list"
                            id="ingredientsList"
                        >

                            <p class="product-options-empty">
                                Nenhum ingrediente cadastrado.
                            </p>

                        </div>

                    </div>


                    <div class="product-form-status">

                        <label>

                            <input
                                type="checkbox"
                                id="productActive"
                                checked
                            >

                            Produto ativo

                        </label>

                    </div>


                    <div class="product-form-actions">

                        <button
                            type="button"
                            class="product-cancel-button"
                        >
                            Cancelar
                        </button>


                        <button
                            type="submit"
                            class="product-save-button"
                        >
                            ${buttonText}
                        </button>

                    </div>

                </form>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        return overlay;

    }


    /* =========================================
       NOVO PRODUTO
    ========================================= */

    function openNewProduct() {

        const overlay =
            createProductModal(
                "Novo produto",
                "Cadastre um novo item no cardápio.",
                "Cadastrar produto"
            );


        const form =
            overlay.querySelector(
                "#productForm"
            );

        const imageInput =
            overlay.querySelector(
                "#productImage"
            );

        const imagePreview =
            overlay.querySelector(
                "#productImagePreview"
            );

        const addonsList =
            overlay.querySelector(
                "#addonsList"
            );

        const ingredientsList =
            overlay.querySelector(
                "#ingredientsList"
            );

        const addAddonButton =
            overlay.querySelector(
                "#addAddonButton"
            );

        const addIngredientButton =
            overlay.querySelector(
                "#addIngredientButton"
            );


        setupModalCloseEvents(
            overlay
        );


        setupImagePreview(
            imageInput,
            imagePreview
        );


        addAddonButton.addEventListener(
            "click",
            () => {

                createUnsavedAddonRow(
                    addonsList
                );

            }
        );


        addIngredientButton.addEventListener(
            "click",
            () => {

                createUnsavedIngredientRow(
                    ingredientsList
                );

            }
        );


        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                await createNewProduct(
                    form
                );

            }
        );

    }


    /* =========================================
       CRIAR NOVO PRODUTO
    ========================================= */

    async function createNewProduct(
        form
    ) {

        const name =
            form.querySelector(
                "#productName"
            )
                .value
                .trim();


        const description =
            form.querySelector(
                "#productDescription"
            )
                .value
                .trim();


        const price =
            Number(
                form.querySelector(
                    "#productPrice"
                ).value
            );


        const category =
            form.querySelector(
                "#productCategory"
            ).value;


        const active =
            form.querySelector(
                "#productActive"
            ).checked;


        const imageInput =
            form.querySelector(
                "#productImage"
            );


        const file =
            imageInput.files[0];


        if (
            !name ||
            !description ||
            !category ||
            !Number.isFinite(price) ||
            price < 0
        ) {

            alert(
                "Preencha os campos obrigatórios corretamente."
            );

            return;

        }


        if (
            file &&
            !isValidImage(file)
        ) {

            return;

        }


        const saveButton =
            form.querySelector(
                ".product-save-button"
            );


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Cadastrando...";


        try {

            const slug =
                await createUniqueSlug(
                    name
                );


            let imageUrl =
                null;


            if (file) {

                saveButton.textContent =
                    "Enviando imagem...";


                imageUrl =
                    await uploadProductImage(
                        file,
                        slug
                    );

            }


            saveButton.textContent =
                "Salvando produto...";


            const {
                data: product,
                error: productError
            } =
                await supabaseClient
                    .from("products")
                    .insert({

                        slug:
                            slug,

                        name:
                            name,

                        description:
                            description,

                        price:
                            price,

                        category:
                            category,

                        image_url:
                            imageUrl,

                        active:
                            active

                    })
                    .select(
                        "id, slug, name, description, price, category, image_url, active"
                    )
                    .single();


            if (productError) {
                throw productError;
            }


            const addons =
                collectNewAddons(
                    form
                );


            if (addons.length) {

                const {
                    error
                } =
                    await supabaseClient
                        .from(
                            "product_addons"
                        )
                        .insert(
                            addons.map(
                                (addon) => ({

                                    product_id:
                                        product.id,

                                    name:
                                        addon.name,

                                    price:
                                        addon.price,

                                    active:
                                        true

                                })
                            )
                        );


                if (error) {
                    throw error;
                }

            }


            const ingredients =
                collectNewIngredients(
                    form
                );


            if (ingredients.length) {

                const {
                    error
                } =
                    await supabaseClient
                        .from(
                            "product_removable_ingredients"
                        )
                        .insert(
                            ingredients.map(
                                (ingredient) => ({

                                    product_id:
                                        product.id,

                                    name:
                                        ingredient.name,

                                    active:
                                        true

                                })
                            )
                        );


                if (error) {
                    throw error;
                }

            }


            closeProductModal();

            await loadProducts();

            alert(
                "Produto cadastrado com sucesso."
            );

        } catch (error) {

            console.error(
                "Erro ao cadastrar produto:",
                error
            );


            alert(
                "Não foi possível cadastrar o produto."
            );


            saveButton.disabled =
                false;


            saveButton.textContent =
                "Cadastrar produto";

        }

    }


    /* =========================================
       GERAR SLUG ÚNICO
    ========================================= */

    async function createUniqueSlug(
        name
    ) {

        const baseSlug =
            sanitizeFileName(name) ||
            `produto-${Date.now()}`;


        let slug =
            baseSlug;


        let counter =
            2;


        while (true) {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("products")
                    .select("id")
                    .eq(
                        "slug",
                        slug
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (!data) {
                return slug;
            }


            slug =
                `${baseSlug}-${counter}`;

            counter += 1;

        }

    }


    /* =========================================
       NOVO ADICIONAL
    ========================================= */

    function createUnsavedAddonRow(
        container
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "product-option-row new-option";

        row.dataset.newAddon =
            "true";


        const nameInput =
            document.createElement(
                "input"
            );

        nameInput.type =
            "text";

        nameInput.className =
            "product-option-name";

        nameInput.placeholder =
            "Nome do adicional";


        const priceInput =
            document.createElement(
                "input"
            );

        priceInput.type =
            "number";

        priceInput.className =
            "product-option-price";

        priceInput.min =
            "0";

        priceInput.step =
            "0.01";

        priceInput.placeholder =
            "Preço";


        const removeButton =
            document.createElement(
                "button"
            );

        removeButton.type =
            "button";

        removeButton.className =
            "product-option-delete-button";

        removeButton.textContent =
            "Remover";


        removeButton.addEventListener(
            "click",
            () => {

                row.remove();

            }
        );


        row.appendChild(
            nameInput
        );

        row.appendChild(
            priceInput
        );

        row.appendChild(
            removeButton
        );


        container.appendChild(
            row
        );


        nameInput.focus();

    }


    /* =========================================
       NOVO INGREDIENTE
    ========================================= */

    function createUnsavedIngredientRow(
        container
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "product-option-row new-option";

        row.dataset.newIngredient =
            "true";


        const nameInput =
            document.createElement(
                "input"
            );

        nameInput.type =
            "text";

        nameInput.className =
            "product-option-name";

        nameInput.placeholder =
            "Nome do ingrediente";


        const removeButton =
            document.createElement(
                "button"
            );

        removeButton.type =
            "button";

        removeButton.className =
            "product-option-delete-button";

        removeButton.textContent =
            "Remover";


        removeButton.addEventListener(
            "click",
            () => {

                row.remove();

            }
        );


        row.appendChild(
            nameInput
        );

        row.appendChild(
            removeButton
        );


        container.appendChild(
            row
        );


        nameInput.focus();

    }


    /* =========================================
       COLETAR ADICIONAIS
    ========================================= */

    function collectNewAddons(
        form
    ) {

        const rows =
            form.querySelectorAll(
                '[data-new-addon="true"]'
            );


        const addons = [];


        rows.forEach((row) => {

            const name =
                row.querySelector(
                    ".product-option-name"
                )
                    .value
                    .trim();


            const price =
                Number(
                    row.querySelector(
                        ".product-option-price"
                    ).value
                );


            if (
                name &&
                Number.isFinite(price) &&
                price >= 0
            ) {

                addons.push({

                    name:
                        name,

                    price:
                        price

                });

            }

        });


        return addons;

    }


    /* =========================================
       COLETAR INGREDIENTES
    ========================================= */

    function collectNewIngredients(
        form
    ) {

        const rows =
            form.querySelectorAll(
                '[data-new-ingredient="true"]'
            );


        const ingredients = [];


        rows.forEach((row) => {

            const name =
                row.querySelector(
                    ".product-option-name"
                )
                    .value
                    .trim();


            if (name) {

                ingredients.push({

                    name:
                        name

                });

            }

        });


        return ingredients;

    }


    /* =========================================
       ABRIR EDIÇÃO
    ========================================= */

    async function openEditProduct(product) {

        const overlay =
            createProductModal(
                "Editar produto",
                "Altere as informações do produto.",
                "Salvar alterações"
            );


        const form =
            overlay.querySelector(
                "#productForm"
            );

        const imageInput =
            overlay.querySelector(
                "#productImage"
            );

        const imagePreview =
            overlay.querySelector(
                "#productImagePreview"
            );

        const addonsList =
            overlay.querySelector(
                "#addonsList"
            );

        const ingredientsList =
            overlay.querySelector(
                "#ingredientsList"
            );

        const addAddonButton =
            overlay.querySelector(
                "#addAddonButton"
            );

        const addIngredientButton =
            overlay.querySelector(
                "#addIngredientButton"
            );


        form.querySelector(
            "#productName"
        ).value =
            product.name;


        form.querySelector(
            "#productDescription"
        ).value =
            product.description ||
            "";


        form.querySelector(
            "#productPrice"
        ).value =
            Number(
                product.price
            ).toFixed(2);


        form.querySelector(
            "#productCategory"
        ).value =
            product.category;


        form.querySelector(
            "#productActive"
        ).checked =
            product.active;


        if (product.image_url) {

            const imageUrl =
                product.image_url.startsWith(
                    "http"
                )
                    ? product.image_url
                    : `/${product.image_url.replace(
                        /^\/+/,
                        ""
                    )}`;


            imagePreview.src =
                imageUrl;


            imagePreview.classList.add(
                "show"
            );

        }


        setupModalCloseEvents(
            overlay
        );


        setupImagePreview(
            imageInput,
            imagePreview
        );


        await loadProductAddons(
            product.id,
            addonsList
        );


        await loadProductRemovableIngredients(
            product.id,
            ingredientsList
        );


        addAddonButton.addEventListener(
            "click",
            () => {

                createAddonEditorRow(
                    addonsList,
                    product.id
                );

            }
        );


        addIngredientButton.addEventListener(
            "click",
            () => {

                createIngredientEditorRow(
                    ingredientsList,
                    product.id
                );

            }
        );


        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                await updateExistingProduct(
                    product,
                    form
                );

            }
        );

    }


    /* =========================================
       CARREGAR ADICIONAIS
    ========================================= */

    async function loadProductAddons(
        productId,
        container
    ) {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("product_addons")
                .select(
                    "id, name, price, active"
                )
                .eq(
                    "product_id",
                    productId
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Erro ao carregar adicionais:",
                error
            );


            container.innerHTML =
                `
                    <p class="product-options-empty">
                        Erro ao carregar adicionais.
                    </p>
                `;


            return;

        }


        container.innerHTML =
            "";


        if (!data.length) {

            container.innerHTML =
                `
                    <p class="product-options-empty">
                        Nenhum adicional cadastrado.
                    </p>
                `;

            return;

        }


        data.forEach((addon) => {

            createAddonRow(
                addon,
                container
            );

        });

    }


    /* =========================================
       ADICIONAL EXISTENTE
    ========================================= */

    function createAddonRow(
        addon,
        container
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "product-option-row";


        const nameInput =
            document.createElement(
                "input"
            );

        nameInput.type =
            "text";

        nameInput.className =
            "product-option-name";

        nameInput.value =
            addon.name;


        const priceInput =
            document.createElement(
                "input"
            );

        priceInput.type =
            "number";

        priceInput.className =
            "product-option-price";

        priceInput.min =
            "0";

        priceInput.step =
            "0.01";

        priceInput.value =
            Number(
                addon.price
            ).toFixed(2);


        const activeLabel =
            document.createElement(
                "label"
            );

        activeLabel.className =
            "product-option-active";


        const activeCheckbox =
            document.createElement(
                "input"
            );

        activeCheckbox.type =
            "checkbox";

        activeCheckbox.checked =
            addon.active;


        activeLabel.appendChild(
            activeCheckbox
        );

        activeLabel.appendChild(
            document.createTextNode(
                "Ativo"
            )
        );


        const saveButton =
            document.createElement(
                "button"
            );

        saveButton.type =
            "button";

        saveButton.className =
            "product-option-save-button";

        saveButton.textContent =
            "Salvar";


        saveButton.addEventListener(
            "click",
            async () => {

                await updateAddon(
                    addon.id,
                    nameInput.value,
                    priceInput.value,
                    activeCheckbox.checked
                );

            }
        );


        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.type =
            "button";

        deleteButton.className =
            "product-option-delete-button";

        deleteButton.textContent =
            "Excluir";


        deleteButton.addEventListener(
            "click",
            async () => {

                await deleteAddon(
                    addon.id,
                    row
                );

            }
        );


        row.appendChild(nameInput);
        row.appendChild(priceInput);
        row.appendChild(activeLabel);
        row.appendChild(saveButton);
        row.appendChild(deleteButton);


        container.appendChild(
            row
        );

    }


    /* =========================================
       NOVO ADICIONAL NA EDIÇÃO
    ========================================= */

    function createAddonEditorRow(
        container,
        productId
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "product-option-row new-option";


        const nameInput =
            document.createElement(
                "input"
            );

        nameInput.type =
            "text";

        nameInput.className =
            "product-option-name";

        nameInput.placeholder =
            "Nome do adicional";


        const priceInput =
            document.createElement(
                "input"
            );

        priceInput.type =
            "number";

        priceInput.className =
            "product-option-price";

        priceInput.min =
            "0";

        priceInput.step =
            "0.01";

        priceInput.placeholder =
            "Preço";


        const saveButton =
            document.createElement(
                "button"
            );

        saveButton.type =
            "button";

        saveButton.className =
            "product-option-save-button";

        saveButton.textContent =
            "Adicionar";


        saveButton.addEventListener(
            "click",
            async () => {

                await createAddon(
                    productId,
                    nameInput.value,
                    priceInput.value,
                    row
                );

            }
        );


        const cancelButton =
            document.createElement(
                "button"
            );

        cancelButton.type =
            "button";

        cancelButton.className =
            "product-option-delete-button";

        cancelButton.textContent =
            "Cancelar";


        cancelButton.addEventListener(
            "click",
            () => {

                row.remove();

            }
        );


        row.appendChild(nameInput);
        row.appendChild(priceInput);
        row.appendChild(saveButton);
        row.appendChild(cancelButton);


        container.appendChild(
            row
        );


        nameInput.focus();

    }


    /* =========================================
       CRIAR ADICIONAL
    ========================================= */

    async function createAddon(
        productId,
        name,
        price,
        row
    ) {

        const cleanName =
            String(name)
                .trim();


        const numericPrice =
            Number(price);


        if (
            !cleanName ||
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {

            alert(
                "Informe o nome e um preço válido."
            );

            return;

        }


        const {
            error
        } =
            await supabaseClient
                .from(
                    "product_addons"
                )
                .insert({

                    product_id:
                        productId,

                    name:
                        cleanName,

                    price:
                        numericPrice,

                    active:
                        true

                });


        if (error) {

            console.error(
                "Erro ao criar adicional:",
                error
            );


            alert(
                "Não foi possível adicionar o adicional."
            );


            return;

        }


        const container =
            row.parentElement;


        await loadProductAddons(
            productId,
            container
        );

    }


    /* =========================================
       ATUALIZAR ADICIONAL
    ========================================= */

    async function updateAddon(
        addonId,
        name,
        price,
        active
    ) {

        const cleanName =
            String(name)
                .trim();


        const numericPrice =
            Number(price);


        if (
            !cleanName ||
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {

            alert(
                "Informe o nome e um preço válido."
            );

            return;

        }


        const {
            error
        } =
            await supabaseClient
                .from(
                    "product_addons"
                )
                .update({

                    name:
                        cleanName,

                    price:
                        numericPrice,

                    active:
                        active

                })
                .eq(
                    "id",
                    addonId
                );


        if (error) {

            console.error(
                "Erro ao atualizar adicional:",
                error
            );


            alert(
                "Não foi possível salvar o adicional."
            );


            return;

        }


        alert(
            "Adicional salvo com sucesso."
        );

    }


    /* =========================================
       EXCLUIR ADICIONAL
    ========================================= */

    async function deleteAddon(
        addonId,
        row
    ) {

        const confirmed =
            window.confirm(
                "Deseja excluir este adicional?"
            );


        if (!confirmed) {
            return;
        }


        const {
            error
        } =
            await supabaseClient
                .from(
                    "product_addons"
                )
                .delete()
                .eq(
                    "id",
                    addonId
                );


        if (error) {

            console.error(
                "Erro ao excluir adicional:",
                error
            );


            alert(
                "Não foi possível excluir o adicional."
            );


            return;

        }


        row.remove();

    }


    /* =========================================
       CARREGAR INGREDIENTES
    ========================================= */

    async function loadProductRemovableIngredients(
        productId,
        container
    ) {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "product_removable_ingredients"
                )
                .select(
                    "id, name, active"
                )
                .eq(
                    "product_id",
                    productId
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Erro ao carregar ingredientes:",
                error
            );


            container.innerHTML =
                `
                    <p class="product-options-empty">
                        Erro ao carregar ingredientes.
                    </p>
                `;

            return;

        }


        container.innerHTML =
            "";


        if (!data.length) {

            container.innerHTML =
                `
                    <p class="product-options-empty">
                        Nenhum ingrediente cadastrado.
                    </p>
                `;

            return;

        }


        data.forEach((ingredient) => {

            createIngredientRow(
                ingredient,
                container
            );

        });

    }


    /* =========================================
       INGREDIENTE EXISTENTE
    ========================================= */

    function createIngredientRow(
        ingredient,
        container
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "product-option-row";


        const nameInput =
            document.createElement(
                "input"
            );

        nameInput.type =
            "text";

        nameInput.className =
            "product-option-name";

        nameInput.value =
            ingredient.name;


        const activeLabel =
            document.createElement(
                "label"
            );

        activeLabel.className =
            "product-option-active";


        const activeCheckbox =
            document.createElement(
                "input"
            );

        activeCheckbox.type =
            "checkbox";

        activeCheckbox.checked =
            ingredient.active;


        activeLabel.appendChild(
            activeCheckbox
        );

        activeLabel.appendChild(
            document.createTextNode(
                "Ativo"
            )
        );


        const saveButton =
            document.createElement(
                "button"
            );

        saveButton.type =
            "button";

        saveButton.className =
            "product-option-save-button";

        saveButton.textContent =
            "Salvar";


        saveButton.addEventListener(
            "click",
            async () => {

                await updateIngredient(
                    ingredient.id,
                    nameInput.value,
                    activeCheckbox.checked
                );

            }
        );


        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.type =
            "button";

        deleteButton.className =
            "product-option-delete-button";

        deleteButton.textContent =
            "Excluir";


        deleteButton.addEventListener(
            "click",
            async () => {

                await deleteIngredient(
                    ingredient.id,
                    row
                );

            }
        );


        row.appendChild(nameInput);
        row.appendChild(activeLabel);
        row.appendChild(saveButton);
        row.appendChild(deleteButton);


        container.appendChild(
            row
        );

    }


    /* =========================================
       NOVO INGREDIENTE NA EDIÇÃO
    ========================================= */

    function createIngredientEditorRow(
        container,
        productId
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "product-option-row new-option";


        const nameInput =
            document.createElement(
                "input"
            );

        nameInput.type =
            "text";

        nameInput.className =
            "product-option-name";

        nameInput.placeholder =
            "Nome do ingrediente";


        const saveButton =
            document.createElement(
                "button"
            );

        saveButton.type =
            "button";

        saveButton.className =
            "product-option-save-button";

        saveButton.textContent =
            "Adicionar";


        saveButton.addEventListener(
            "click",
            async () => {

                await createIngredient(
                    productId,
                    nameInput.value,
                    row
                );

            }
        );


        const cancelButton =
            document.createElement(
                "button"
            );

        cancelButton.type =
            "button";

        cancelButton.className =
            "product-option-delete-button";

        cancelButton.textContent =
            "Cancelar";


        cancelButton.addEventListener(
            "click",
            () => {

                row.remove();

            }
        );


        row.appendChild(
            nameInput
        );

        row.appendChild(
            saveButton
        );

        row.appendChild(
            cancelButton
        );


        container.appendChild(
            row
        );


        nameInput.focus();

    }


    /* =========================================
       CRIAR INGREDIENTE
    ========================================= */

    async function createIngredient(
        productId,
        name,
        row
    ) {

        const cleanName =
            String(name)
                .trim();


        if (!cleanName) {

            alert(
                "Informe o nome do ingrediente."
            );

            return;

        }


        const {
            error
        } =
            await supabaseClient
                .from(
                    "product_removable_ingredients"
                )
                .insert({

                    product_id:
                        productId,

                    name:
                        cleanName,

                    active:
                        true

                });


        if (error) {

            console.error(
                "Erro ao criar ingrediente:",
                error
            );


            alert(
                "Não foi possível adicionar o ingrediente."
            );


            return;

        }


        const container =
            row.parentElement;


        await loadProductRemovableIngredients(
            productId,
            container
        );

    }


    /* =========================================
       ATUALIZAR INGREDIENTE
    ========================================= */

    async function updateIngredient(
        ingredientId,
        name,
        active
    ) {

        const cleanName =
            String(name)
                .trim();


        if (!cleanName) {

            alert(
                "Informe o nome do ingrediente."
            );

            return;

        }


        const {
            error
        } =
            await supabaseClient
                .from(
                    "product_removable_ingredients"
                )
                .update({

                    name:
                        cleanName,

                    active:
                        active

                })
                .eq(
                    "id",
                    ingredientId
                );


        if (error) {

            console.error(
                "Erro ao atualizar ingrediente:",
                error
            );


            alert(
                "Não foi possível salvar o ingrediente."
            );


            return;

        }


        alert(
            "Ingrediente salvo com sucesso."
        );

    }


    /* =========================================
       EXCLUIR INGREDIENTE
    ========================================= */

    async function deleteIngredient(
        ingredientId,
        row
    ) {

        const confirmed =
            window.confirm(
                "Deseja excluir este ingrediente?"
            );


        if (!confirmed) {
            return;
        }


        const {
            error
        } =
            await supabaseClient
                .from(
                    "product_removable_ingredients"
                )
                .delete()
                .eq(
                    "id",
                    ingredientId
                );


        if (error) {

            console.error(
                "Erro ao excluir ingrediente:",
                error
            );


            alert(
                "Não foi possível excluir o ingrediente."
            );


            return;

        }


        row.remove();

    }


    /* =========================================
       ATUALIZAR PRODUTO
    ========================================= */

    async function updateExistingProduct(
        product,
        form
    ) {

        const name =
            form.querySelector(
                "#productName"
            )
                .value
                .trim();


        const description =
            form.querySelector(
                "#productDescription"
            )
                .value
                .trim();


        const price =
            Number(
                form.querySelector(
                    "#productPrice"
                ).value
            );


        const category =
            form.querySelector(
                "#productCategory"
            ).value;


        const active =
            form.querySelector(
                "#productActive"
            ).checked;


        const imageInput =
            form.querySelector(
                "#productImage"
            );


        const file =
            imageInput.files[0];


        if (
            !name ||
            !description ||
            !category ||
            !Number.isFinite(price) ||
            price < 0
        ) {

            alert(
                "Preencha os campos obrigatórios corretamente."
            );

            return;

        }


        if (
            file &&
            !isValidImage(file)
        ) {

            return;

        }


        const saveButton =
            form.querySelector(
                ".product-save-button"
            );


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Salvando...";


        try {

            let imageUrl =
                product.image_url ||
                null;


            if (file) {

                saveButton.textContent =
                    "Enviando imagem...";


                imageUrl =
                    await uploadProductImage(
                        file,
                        product.slug ||
                        name
                    );

            }


            saveButton.textContent =
                "Salvando produto...";


            const {
                error
            } =
                await supabaseClient
                    .from("products")
                    .update({

                        name:
                            name,

                        description:
                            description,

                        price:
                            price,

                        category:
                            category,

                        image_url:
                            imageUrl,

                        active:
                            active

                    })
                    .eq(
                        "id",
                        product.id
                    );


            if (error) {
                throw error;
            }


            closeProductModal();

            await loadProducts();

            alert(
                "Produto atualizado com sucesso."
            );

        } catch (error) {

            console.error(
                "Erro ao salvar produto:",
                error
            );


            alert(
                "Não foi possível salvar o produto."
            );


            saveButton.disabled =
                false;


            saveButton.textContent =
                "Salvar alterações";

        }

    }


    /* =========================================
       FECHAR MODAL
    ========================================= */

    function setupModalCloseEvents(
        overlay
    ) {

        const closeButton =
            overlay.querySelector(
                ".product-modal-close"
            );


        const cancelButton =
            overlay.querySelector(
                ".product-cancel-button"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeProductModal
            );

        }


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                closeProductModal
            );

        }


        overlay.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    overlay
                ) {

                    closeProductModal();

                }

            }
        );

    }


    /* =========================================
       PREVIEW DE IMAGEM
    ========================================= */

    function setupImagePreview(
        imageInput,
        imagePreview
    ) {

        imageInput.addEventListener(
            "change",
            () => {

                const file =
                    imageInput.files[0];


                if (!file) {
                    return;
                }


                if (
                    !isValidImage(file)
                ) {

                    imageInput.value =
                        "";

                    return;

                }


                const previewUrl =
                    URL.createObjectURL(
                        file
                    );


                imagePreview.src =
                    previewUrl;


                imagePreview.classList.add(
                    "show"
                );

            }
        );

    }


    /* =========================================
       VALIDAR IMAGEM
    ========================================= */

    function isValidImage(
        file
    ) {

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            alert(
                "A imagem deve ter no máximo 5 MB."
            );

            return false;

        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Escolha uma imagem JPG, PNG ou WebP."
            );

            return false;

        }


        return true;

    }


    /* =========================================
       UPLOAD DA IMAGEM
    ========================================= */

    async function uploadProductImage(
        file,
        productSlug
    ) {

        const extension =
            getFileExtension(
                file.name
            );


        const safeSlug =
            sanitizeFileName(
                productSlug
            );


        const fileName =
            `${safeSlug}-${Date.now()}.${extension}`;


        const filePath =
            `products/${fileName}`;


        const {
            error
        } =
            await supabaseClient
                .storage
                .from(
                    "product-images"
                )
                .upload(
                    filePath,
                    file,
                    {

                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            file.type

                    }
                );


        if (error) {

            console.error(
                "Erro ao enviar imagem:",
                error
            );


            throw error;

        }


        const {
            data
        } =
            supabaseClient
                .storage
                .from(
                    "product-images"
                )
                .getPublicUrl(
                    filePath
                );


        return data.publicUrl;

    }


    /* =========================================
       FECHAR MODAL
    ========================================= */

    function closeProductModal() {

        const modal =
            document.querySelector(
                ".product-modal-overlay"
            );


        if (modal) {
            modal.remove();
        }

    }


    /* =========================================
       EXTENSÃO
    ========================================= */

    function getFileExtension(
        fileName
    ) {

        const parts =
            fileName
                .toLowerCase()
                .split(".");


        return parts.length > 1
            ? parts.pop()
            : "jpg";

    }


    /* =========================================
       LIMPAR NOME
    ========================================= */

    function sanitizeFileName(
        value
    ) {

        return String(value)
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
            )
            .replace(
                /-+/g,
                "-"
            )
            .replace(
                /^-|-$/g,
                ""
            )
            .toLowerCase();

    }


    /* =========================================
       ESC
    ========================================= */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Escape"
            ) {

                closeProductModal();

            }

        }
    );


    /* =========================================
       NOVO PRODUTO
    ========================================= */

    if (newProductButton) {

        newProductButton.addEventListener(
            "click",
            () => {

                openNewProduct();

            }
        );

    }


    /* =========================================
       INICIALIZAÇÃO
    ========================================= */

    await loadProducts();

});
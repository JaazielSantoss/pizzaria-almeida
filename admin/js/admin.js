document.addEventListener("DOMContentLoaded", async () => {

    /* =========================================
       ELEMENTOS
    ========================================= */

    const navItems =
        document.querySelectorAll(
            ".admin-nav-item"
        );

    const sections =
        document.querySelectorAll(
            ".admin-section"
        );

    const pageTitle =
        document.querySelector(
            "#adminPageTitle"
        );

    const logoutButton =
        document.querySelector(
            "#adminLogout"
        );

    const productsAdminList =
        document.querySelector(
            "#productsAdminList"
        );

    const totalProducts =
        document.querySelector(
            "#totalProducts"
        );


    /* =========================================
       NAVEGAÇÃO
    ========================================= */

    navItems.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const sectionName =
                    button.dataset.section;


                navItems.forEach((item) => {

                    item.classList.remove(
                        "active"
                    );

                });


                sections.forEach((section) => {

                    section.classList.remove(
                        "active"
                    );

                });


                button.classList.add(
                    "active"
                );


                const selectedSection =
                    document.querySelector(
                        `#section-${sectionName}`
                    );


                if (selectedSection) {

                    selectedSection.classList.add(
                        "active"
                    );

                }


                const titles = {

                    dashboard:
                        "Dashboard",

                    products:
                        "Produtos",

                    orders:
                        "Pedidos",

                    customers:
                        "Clientes"

                };


                if (pageTitle) {

                    pageTitle.textContent =
                        titles[sectionName] ||
                        "Dashboard";

                }

            }
        );

    });


    /* =========================================
       LOGOUT
    ========================================= */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .signOut();


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


        const {
            data,
            error
        } =
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


        totalProducts.textContent =
            data.length;


        if (data.length === 0) {

            productsAdminList.innerHTML =
                "<p>Nenhum produto cadastrado.</p>";


            return;

        }


        productsAdminList.innerHTML =
            "";


        data.forEach((product) => {

            const productItem =
                document.createElement(
                    "div"
                );


            productItem.className =
                "admin-product-item";


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "admin-product-info";


            const name =
                document.createElement(
                    "h4"
                );


            name.textContent =
                product.name;


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                product.description ||
                "";


            const price =
                document.createElement(
                    "strong"
                );


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
                document.createElement(
                    "span"
                );


            status.className =
                product.active
                    ? "product-status active"
                    : "product-status inactive";


            status.textContent =
                product.active
                    ? "Ativo"
                    : "Inativo";


            info.appendChild(
                name
            );

            info.appendChild(
                description
            );

            info.appendChild(
                price
            );

            info.appendChild(
                status
            );


            productItem.appendChild(
                info
            );


            productsAdminList.appendChild(
                productItem
            );

        });

    }


    /* =========================================
       INICIALIZAÇÃO
    ========================================= */

    await loadProducts();

});
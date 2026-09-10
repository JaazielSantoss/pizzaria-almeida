document.addEventListener("DOMContentLoaded", () => {

    console.log("auth.js carregado");

    const loginForm =
        document.querySelector("#adminLoginForm");

    if (!loginForm) {
        console.error("Formulário de login não encontrado.");
        return;
    }

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        console.log("Botão Entrar clicado");

        const email =
            document.querySelector("#adminEmail").value.trim();

        const password =
            document.querySelector("#adminPassword").value;

        console.log("E-mail informado:", email);

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {

            console.error("Erro no login:", error);

            alert(
                "Não foi possível entrar.\n\n" +
                error.message
            );

            return;
        }

        console.log(
            "Login realizado com sucesso:",
            data.user
        );

        window.location.href = "dashboard.html";

    });

});
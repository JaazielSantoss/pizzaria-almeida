document.addEventListener("DOMContentLoaded", () => {

    console.log("auth.js carregado");

    const loginForm =
        document.querySelector("#adminLoginForm");
    const recoveryForm = document.querySelector("#passwordRecoveryForm");
    const resetPasswordForm = document.querySelector("#resetPasswordForm");
    const recoveryButton = document.querySelector("#forgotPasswordButton");
    const message = document.querySelector("#loginMessage");

    if (!loginForm) {
        console.error("Formulário de login não encontrado.");
        return;
    }

    function showResetPasswordForm() {
        loginForm.hidden = true;
        recoveryForm.hidden = true;
        resetPasswordForm.hidden = false;
        recoveryButton.hidden = true;
        message.textContent = "Escolha uma senha nova com pelo menos 8 caracteres.";
    }

    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") showResetPasswordForm();
    });

    if (new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery") {
        showResetPasswordForm();
    }

    recoveryButton.addEventListener("click", () => {
        const showingRecovery = !recoveryForm.hidden;
        recoveryForm.hidden = showingRecovery;
        loginForm.hidden = !showingRecovery;
        recoveryButton.textContent = showingRecovery ? "Esqueci a minha senha" : "Voltar para entrar";
        message.textContent = "";
    });

    recoveryForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.querySelector("#recoveryEmail").value.trim();
        const redirectTo = new URL("index.html", window.location.href).href;
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });

        message.textContent = error
            ? "Não foi possível enviar o link. Confira o e-mail e tente novamente."
            : "Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.";
        if (error) console.error("Erro ao solicitar recuperação de senha:", error);
    });

    resetPasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const password = document.querySelector("#newPassword").value;
        const confirmation = document.querySelector("#confirmPassword").value;
        if (password.length < 8) {
            message.textContent = "A senha precisa ter pelo menos 8 caracteres.";
            return;
        }
        if (password !== confirmation) {
            message.textContent = "As senhas não coincidem.";
            return;
        }

        const button = resetPasswordForm.querySelector("button[type='submit']");
        button.disabled = true;
        button.textContent = "Salvando...";
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) {
            message.textContent = "Não foi possível alterar a senha. Solicite um novo link e tente novamente.";
            button.disabled = false;
            button.textContent = "Salvar nova senha";
            console.error("Erro ao redefinir senha:", error);
            return;
        }

        await supabaseClient.auth.signOut();
        resetPasswordForm.hidden = true;
        loginForm.hidden = false;
        recoveryButton.hidden = false;
        recoveryButton.textContent = "Esqueci a minha senha";
        resetPasswordForm.reset();
        message.textContent = "Senha alterada com sucesso. Você já pode entrar no painel.";
        button.disabled = false;
        button.textContent = "Salvar nova senha";
    });

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

            message.textContent = "Não foi possível entrar. Confira seu e-mail e senha.";

            return;
        }

        message.textContent = "";

        console.log(
            "Login realizado com sucesso:",
            data.user
        );

        window.location.href = "dashboard.html";

    });

});

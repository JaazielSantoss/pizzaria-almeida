const SUPABASE_URL =
    "https://tehnqtbshvaarhgvdlcn.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_fDmtMaiCCB2Nv9T4XBBIbg_kMqjiplD";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

console.log("Supabase carregado");
console.log("URL:", SUPABASE_URL);
console.log(
    "Chave começa com:",
    SUPABASE_KEY.substring(0, 15)
);

async function testSupabaseConnection() {

    const response =
        await fetch(
            `${SUPABASE_URL}/rest/v1/products?select=id&limit=1`,
            {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization":
                        `Bearer ${SUPABASE_KEY}`
                }
            }
        );

    console.log(
        "Status da requisição:",
        response.status
    );

    const text =
        await response.text();

    console.log(
        "Resposta:",
        text
    );

}

testSupabaseConnection();
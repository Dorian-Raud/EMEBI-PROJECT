const baseApiURL = import.meta.env.VITE_BASE_API_URL;
if (!baseApiURL) {
    throw new Error("Missing VITE_BASE_API_URL environment variable");
}

// Options qu'on accepte
type ApiFetchOptions = RequestInit & {
    skipJsonOnEmpty?: boolean;
};

/**
 * apiFetch - wrapper générique autour de fetch
 *
 * - Envoie toujours les cookies (credentials: "include")
 * - Parse le JSON si possible (mais ne crash jamais si vide)
 * - Normalise toutes les erreurs backend / réseau
 * - Le type <T> est optionnel → si non fourni, data = any
 */
export async function apiFetch<T = any>(
    path: string,
    options: ApiFetchOptions = {}
) {
    // Construit l'URL
    const url = baseApiURL + path;

    try {
        // Effectue la requête en incluant systématiquement les cookies
        const response = await fetch(url, {
            credentials: "include",
            ...options,  // on spread options en premier
            headers: {   // puis on merge les headers proprement
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        let data: any = null;

        // Essaie de parser le JSON uniquement si le body n’est pas vide
        const contentType = response.headers.get("content-type");
        const hasJson = contentType?.includes("application/json");
        if (hasJson) {
            try {
                data = await response.json();
            } catch { }
        }

        // Récupère les erreurs potentilles de l'API
        if (!response.ok) {
            const message =
                data?.message || data?.error || `Erreur API (${response.status})`;

            return {
                ok: false,
                status: response.status,
                message,
            };
        }

        // Récupère la réponse valide
        return {
            ok: true,
            status: response.status,
            data: data as T,
        };
    } catch (error) {
        // Erreur réseau, CORS, serveur down, etc.
        console.error("Erreur réseau dans apiFetch:", error);
        return {
            ok: false,
            status: 0,
            message: "Erreur réseau ou serveur.",
        };
    }
}
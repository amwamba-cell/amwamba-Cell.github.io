(async function loadComponents() {
    const placeholders = document.querySelectorAll("[data-include]");

    await Promise.all(Array.from(placeholders, async (placeholder) => {
        const componentPath = placeholder.getAttribute("data-include");
        const componentUrl = new URL(componentPath, document.baseURI);

        try {
            const response = await fetch(componentUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            placeholder.innerHTML = await response.text();
        } catch (error) {
            console.error(`Unable to load component "${componentPath}":`, error);
        }
    }));
})();

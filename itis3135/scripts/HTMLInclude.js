document.addEventListener("DOMContentLoaded", async () => {
    const includeElements = document.querySelectorAll("[data-include]");

    await Promise.all(Array.from(includeElements, async (element) => {
        const file = element.getAttribute("data-include");

        try {
            const response = await fetch(file);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} while loading ${file}`);
            }
            element.innerHTML = await response.text();
        } catch (error) {
            console.error(`Could not load component: ${file}`, error);
        }
    }));
});

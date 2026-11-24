module.exports = {
    name: 'menu',
    category: 'info',
    run: async ({ sock, remitente, plugins, PREFIX }) => {
        let menuTexto = `*🤖 MENÚ DE COMANDOS*\n\n`;
        
        // Agrupamos por categorías
        const categorias = {};
        plugins.forEach((p) => {
            const cat = p.category || 'otros';
            if (!categorias[cat]) categorias[cat] = [];
            categorias[cat].push(p.name);
        });

        for (const [cat, comandos] of Object.entries(categorias)) {
            menuTexto += `*${cat.toUpperCase()}*\n`;
            comandos.forEach(c => {
                menuTexto += `  ${PREFIX}${c}\n`;
            });
            menuTexto += `\n`;
        }

        await sock.sendMessage(remitente, { text: menuTexto });
    }
}

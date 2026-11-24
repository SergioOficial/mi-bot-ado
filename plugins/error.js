const fs = require('fs');

module.exports = {
    name: 'error',
    category: 'owner',
    run: async ({ sock, remitente }) => {
        if (!fs.existsSync('errors.log')) {
            return sock.sendMessage(remitente, { text: '✅ No hay errores registrados.' });
        }

        let errores = fs.readFileSync('errors.log', 'utf8');
        
        if (errores.length > 4000) {
            errores = '...[Mostrando los últimos errores]...\n\n' + errores.slice(-4000);
        }

        await sock.sendMessage(remitente, { 
            text: `*🛑 ÚLTIMOS ERRORES:*\n\n\`\`\`\n${errores}\n\`\`\`` 
        });
    }
}

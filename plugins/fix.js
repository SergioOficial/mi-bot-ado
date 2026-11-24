const { exec } = require('child_process');

module.exports = {
    name: 'fix',
    category: 'owner',
    run: async ({ sock, remitente }) => {
        await sock.sendMessage(remitente, { text: '🔄 Buscando actualizaciones en GitHub...' });
        
        // Forzamos la descarga de los últimos cambios de tu repo
        exec('git fetch --all && git reset --hard origin/main && npm install', (error, stdout, stderr) => {
            if (error) {
                sock.sendMessage(remitente, { text: `❌ Error al actualizar:\n${error.message}` });
                return;
            }
            sock.sendMessage(remitente, { text: '✅ Código actualizado desde GitHub. Reiniciando...' });
            setTimeout(() => {
                process.exit(0); // PM2 reinicia con el código nuevo
            }, 1500);
        });
    }
}

module.exports = {
    name: 'restart',
    category: 'owner',
    run: async ({ sock, remitente }) => {
        await sock.sendMessage(remitente, { text: '🔄 Reiniciando el bot...' });
        setTimeout(() => {
            process.exit(0); // PM2 lo reiniciará automáticamente
        }, 1000);
    }
}

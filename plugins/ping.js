module.exports = {
    name: 'ping',
    category: 'info',
    run: async ({ sock, remitente }) => {
        await sock.sendMessage(remitente, { text: '🏓 ¡Pong! El bot está activo.' });
    }
}

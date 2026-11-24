const { downloadMediaMessage } = require('@ado/baileys');

// Función local que usa relayMessage para inyectar el sidecar
async function sendModdedSticker(sock, jid, originalSticker) {
    // Construimos el protobuf de stickerMessage manualmente
    const stickerMessage = {
        url: originalSticker.url,
        fileSha256: originalSticker.fileSha256,
        fileEncSha256: originalSticker.fileEncSha256,
        mediaKey: originalSticker.mediaKey,
        mimetype: originalSticker.mimetype || "image/webp",
        directPath: originalSticker.directPath,
        fileLength: originalSticker.fileLength,
        mediaKeyTimestamp: originalSticker.mediaKeyTimestamp,
        isAnimated: originalSticker.isAnimated || true,
        stickerSentTs: Date.now().toString(),
        isAvatar: false,
        isAiSticker: false,
        isLottie: false,
        firstFrameLength: originalSticker.firstFrameLength,
        firstFrameSidecar: originalSticker.firstFrameSidecar, // El audio incrustado
        accessibilityLabel: ""
    };

    // Usamos relayMessage en lugar de sendMessage
    await sock.relayMessage(jid, { stickerMessage }, {});
}

module.exports = {
    name: 'sa',
    category: 'media',
    run: async ({ sock, msg, remitente }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.stickerMessage) {
            return sock.sendMessage(remitente, { text: '❌ Responde a un sticker con audio (mod).' });
        }

        const originalSticker = quoted.stickerMessage;

        // Verificamos que realmente tenga el sidecar (audio)
        if (!originalSticker.firstFrameSidecar) {
            return sock.sendMessage(remitente, { text: '❌ Este sticker no tiene audio incrustado.' });
        }

        await sock.sendMessage(remitente, { text: '🔄 Reenviando sticker con audio...' });
        
        try {
            await sendModdedSticker(sock, remitente, originalSticker);
        } catch (error) {
            console.error("Error en sendModdedSticker:", error);
            await sock.sendMessage(remitente, { text: `❌ Error al reenviar: ${error.message}` });
        }
    }
};
const { sendStickerWithAudio, downloadMediaMessage } = require('@ado/baileys');
const P = require('pino');

module.exports = {
    name: 'sa',
    category: 'media',
    run: async ({ sock, msg, remitente, args, PREFIX }) => {
        // Verificamos que sea una respuesta a un mensaje
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(remitente, { text: `Responde a un *video* con ${PREFIX}sticker-audio` });
        }

        const type = Object.keys(quoted)[0];
        if (type !== 'videoMessage' && type !== 'audioMessage') {
            return sock.sendMessage(remitente, { text: '❌ Solo funciona con videos o notas de voz.' });
        }

        await sock.sendMessage(remitente, { text: '⏳ Procesando sticker con audio...' });

        try {
            // 1. Construimos el objeto del mensaje citado para poder descargarlo
            const contextInfo = msg.message.extendedTextMessage.contextInfo;
            const mensajeParaDescargar = {
                key: {
                    remoteJid: remitente,
                    id: contextInfo.stanzaId,
                    fromMe: false // Asumimos que el video lo envió otra persona o tú mismo en el pasado
                },
                message: quoted
            };

            // 2. Usamos la función oficial de Baileys para descargar el buffer
            const buffer = await downloadMediaMessage(
                mensajeParaDescargar, 
                'buffer', 
                {}, 
                { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
            );

            // 3. Llamamos a tu función personalizada
            await sendStickerWithAudio(sock, remitente, buffer, type === 'videoMessage');

        } catch (error) {
            console.error("Error en el plugin sticker-audio:", error);
            await sock.sendMessage(remitente, { text: `❌ Error al procesar: ${error.message || error}` });
        }
    }
}
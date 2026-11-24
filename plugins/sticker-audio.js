const { sendStickerWithAudio, downloadMediaMessage } = require('@ado/baileys');
const P = require('pino');

module.exports = {
    name: 'sa', // El comando es !sa
    category: 'media',
    run: async ({ sock, msg, remitente, args, PREFIX }) => {
        // Buscamos el mensaje al que estás respondiendo
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            return sock.sendMessage(remitente, { text: `Responde a un *video* o *nota de voz* con ${PREFIX}sa` });
        }

        const type = Object.keys(quoted)[0];
        if (type !== 'videoMessage' && type !== 'audioMessage') {
            return sock.sendMessage(remitente, { text: '❌ Solo funciona respondiendo a un video o audio.' });
        }

        await sock.sendMessage(remitente, { text: '⏳ Procesando, espera un momento...' });

        try {
            // Obtenemos los datos del mensaje citado
            const contextInfo = msg.message.extendedTextMessage.contextInfo;
            const mensajeParaDescargar = {
                key: {
                    remoteJid: remitente,
                    id: contextInfo.stanzaId,
                    fromMe: false 
                },
                message: quoted
            };

            // Descargamos el archivo usando tu librería @ado/baileys
            const buffer = await downloadMediaMessage(
                mensajeParaDescargar, 
                'buffer', 
                {}, 
                { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
            );

            // Enviamos el sticker y el audio (usando tu función de la librería)
            await sendStickerWithAudio(sock, remitente, buffer, type === 'videoMessage');

        } catch (error) {
            console.error("Error en el plugin sticker-audio:", error);
            await sock.sendMessage(remitente, { text: `❌ Error al procesar: ${error.message || error}` });
        }
    }
}
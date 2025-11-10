import { Client, Databases, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        let orderData;
        
        if (req.bodyRaw) {
            orderData = JSON.parse(req.bodyRaw);
        } else if (req.body) {
            orderData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } else {
            return res.json({ success: false, message: 'Aucune donnée' }, 400);
        }

        log('📦 Données:', JSON.stringify(orderData));

        // Récupérer le compteur
        const counterDoc = await databases.getDocument(
            process.env.DATABASE_ID,
            'counters',
            'order-counter'
        );

        const newOrderId = counterDoc.value + 1;
        log('🔢 Nouveau orderId:', newOrderId);

        // Mettre à jour le compteur
        await databases.updateDocument(
            process.env.DATABASE_ID,
            'counters',
            'order-counter',
            { value: newOrderId }
        );

        // Créer la commande
        const order = await databases.createDocument(
            process.env.DATABASE_ID,
            'commandes',
            ID.unique(),
            {
                orderId: newOrderId,
                ...orderData
            }
        );

        log('🎉 Commande créée:', order.$id);

        return res.json({ success: true, order });

    } catch (err) {
        error('❌ Erreur:', err.message);
        return res.json({ success: false, message: err.message }, 500);
    }
};
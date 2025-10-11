import { Client, Users, Databases, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    // Parser le webhook de Clerk
    const clerkEvent = JSON.parse(req.body || '{}');
    
    log(`📨 Received Clerk event: ${clerkEvent.type}`);

    // Initialiser le client Appwrite avec les variables d'environnement
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);

    // Traiter selon le type d'événement Clerk
    switch (clerkEvent.type) {
      case 'user.created': {
        const user = clerkEvent.data;
        
        log(`👤 Creating user in Appwrite Auth: ${user.id}`);
        log(`📧 Email: ${user.email_addresses[0]?.email_address}`);
        
        try {
          // 1. CRÉER L'UTILISATEUR DANS APPWRITE AUTH
          const newUser = await users.create(
            user.id, // Utiliser l'ID de Clerk comme ID Appwrite
            user.email_addresses[0]?.email_address || `${user.id}@noemail.local`,
            undefined, // phone (optionnel)
            undefined, // password (géré par Clerk, pas besoin ici)
            `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'
          );
          
          log(`✅ User created in Appwrite Auth: ${newUser.$id}`);
          log(`✅ Name: ${newUser.name}`);
          log(`✅ Email: ${newUser.email}`);


          return res.json({ 
            success: true, 
            message: 'User created in Appwrite',
            userId: newUser.$id 
          });

        } catch (createError) {
          // Si l'utilisateur existe déjà
          if (createError.code === 409) {
            log(`⚠️ User already exists: ${user.id}`);
            return res.json({ 
              success: true, 
              message: 'User already exists' 
            });
          }
          throw createError;
        }
      }

      case 'user.updated': {
        const user = clerkEvent.data;
        
        log(`🔄 Updating user: ${user.id}`);
        
        try {
          // Mettre à jour dans Auth
          await users.updateName(
            user.id,
            `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'
          );
          
          // Mettre à jour l'email si changé
          if (user.email_addresses[0]?.email_address) {
            await users.updateEmail(
              user.id,
              user.email_addresses[0].email_address
            );
          }
          
          log(`✅ User updated in Appwrite: ${user.id}`);

          // Mettre à jour aussi dans la collection si elle existe
          try {
            const { documents } = await databases.listDocuments(
              process.env.APPWRITE_DATABASE_ID,
              process.env.APPWRITE_USER_COLLECTION_ID,
              [Query.equal('clerkUserId', user.id)]
            );

            if (documents.length > 0) {
              await databases.updateDocument(
                process.env.APPWRITE_DATABASE_ID,
                process.env.APPWRITE_USER_COLLECTION_ID,
                documents[0].$id,
                {
                  email: user.email_addresses[0]?.email_address || '',
                  name: user.first_name || '',
                  firstname: user.last_name || '',
                }
              );
              log(`✅ User document updated in collection`);
            }
          } catch (dbError) {
            log(`⚠️ Could not update user in collection: ${dbError.message}`);
          }

          return res.json({ 
            success: true, 
            message: 'User updated' 
          });

        } catch (updateError) {
          // Si l'utilisateur n'existe pas, on le crée
          if (updateError.code === 404) {
            log(`⚠️ User not found, creating instead`);
            const newUser = await users.create(
              user.id,
              user.email_addresses[0]?.email_address || `${user.id}@noemail.local`,
              undefined,
              undefined,
              `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'
            );
            log(`✅ User created: ${newUser.$id}`);
            return res.json({ 
              success: true, 
              message: 'User created',
              userId: newUser.$id 
            });
          }
          throw updateError;
        }
      }

      case 'user.deleted': {
        const userId = clerkEvent.data.id;
        
        log(`🗑️ Deleting user: ${userId}`);
        
        try {
          // Supprimer de Auth
          await users.delete(userId);
          log(`✅ User deleted from Appwrite Auth: ${userId}`);

          // Supprimer aussi de la collection
          try {
            const { documents } = await databases.listDocuments(
              process.env.APPWRITE_DATABASE_ID,
              process.env.APPWRITE_USER_COLLECTION_ID,
              [Query.equal('clerkUserId', userId)]
            );

            if (documents.length > 0) {
              await databases.deleteDocument(
                process.env.APPWRITE_DATABASE_ID,
                process.env.APPWRITE_USER_COLLECTION_ID,
                documents[0].$id
              );
              log(`✅ User document deleted from collection`);
            }
          } catch (dbError) {
            log(`⚠️ Could not delete user from collection: ${dbError.message}`);
          }

        } catch (deleteError) {
          if (deleteError.code === 404) {
            log(`⚠️ User already deleted: ${userId}`);
          } else {
            throw deleteError;
          }
        }
        
        return res.json({ 
          success: true, 
          message: 'User deleted' 
        });
      }

      default:
        log(`ℹ️ Unhandled event type: ${clerkEvent.type}`);
        return res.json({ 
          success: true, 
          message: 'Event type not handled' 
        });
    }

  } catch (err) {
    error(`❌ Error processing webhook: ${err.message}`);
    console.error(err);
    return res.json({ 
      success: false, 
      error: err.message,
      stack: err.stack 
    }, 500);
  }
};
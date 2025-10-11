import { Client, Users } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    // Parser le webhook de Clerk
    // req.body peut être soit un string, soit déjà un objet
    let clerkEvent;
    if (typeof req.body === 'string') {
      clerkEvent = JSON.parse(req.body);
    } else {
      clerkEvent = req.body;
    }
    
    log(`📨 Received Clerk event: ${clerkEvent.type}`);

    // Initialiser le client Appwrite avec les variables d'environnement
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);

    // Traiter selon le type d'événement Clerk
    switch (clerkEvent.type) {
      case 'user.created': {
        const user = clerkEvent.data;
        
        log(`👤 Creating user in Appwrite Auth: ${user.id}`);
        log(`📧 Email: ${user.email_addresses[0]?.email_address}`);
        
        try {
          // CRÉER L'UTILISATEUR DANS APPWRITE AUTH
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
          // Mettre à jour le nom dans Auth
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
        
        log(`🗑️ Deleting user from Appwrite Auth: ${userId}`);
        
        try {
          // Supprimer de Auth uniquement
          await users.delete(userId);
          log(`✅ User deleted from Appwrite Auth: ${userId}`);

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
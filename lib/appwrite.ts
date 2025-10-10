import { CreateUserPrams, UserDoc } from '@/types/type';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { Account, Client, Databases, ID, Permission, Query, Role, Storage } from 'react-native-appwrite';

type GetTokenFn = (opt?: { skipCache?: boolean }) => Promise<string | null>;

const androidPkg = Constants.expoConfig?.android?.package ?? 'host.exp.exponent';
const iosBundle = Constants.expoConfig?.ios?.bundleIdentifier ?? 'host.exp.Exponent';
const platformId = Platform.OS === 'android' ? androidPkg : iosBundle;

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    databaseId: '68b6b82d0002ee2da596',
    bucketId: '68b807d70015bf53e8b0',
    userCollectionId: '68b80ce0001400d839ff',
};

export const client = new Client();
client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(platformId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);


class AppwriteAuthManager {
    private jwtToken: string | null = null;
    private jwtExpiry: number = 0;
    private sessionPromise: Promise<void> | null = null;
    private lastUserId: string | null = null;
    private refreshTimer: any = null;

    private isJWTValid(): boolean {
        return this.jwtToken !== null && Date.now() < (this.jwtExpiry - 10 * 60 * 1000);
    }

    private resetIfUserChanged(userId: string | null) {
        if (this.lastUserId !== userId) {
            this.jwtToken = null;
            this.jwtExpiry = 0;
            this.sessionPromise = null;
            this.lastUserId = userId;
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer);
                this.refreshTimer = null;
            }
        }
    }

    private scheduleRefresh(getToken: GetTokenFn, userId?: string) {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        
        const refreshIn = this.jwtExpiry - Date.now() - 2 * 60 * 1000;
        
        if (refreshIn > 0) {
            this.refreshTimer = setTimeout(async () => {
                try {
                    await this.refreshAuth(getToken, userId);
                } catch (error) {
                    console.error('Auto-refresh failed:', error);
                }
            }, refreshIn);
        }
    }

    async ensureAuth(getToken: GetTokenFn, userId?: string) {
        this.resetIfUserChanged(userId || null);

        if (this.sessionPromise) return this.sessionPromise;

        if (this.isJWTValid()) return;

        this.sessionPromise = this._establishSession(getToken, userId);

        try {
            await this.sessionPromise;
        } finally {
            this.sessionPromise = null;
        }
    }

    private async _establishSession(getToken: GetTokenFn, userId?: string) {
        const token = await getToken({ skipCache: true });
        if (!token) {
            this.jwtToken = null;
            this.jwtExpiry = 0;
            await account.deleteSession('current').catch(() => {});
            throw new Error('Utilisateur non connecté. Merci de vous reconnecter.');
        }

        try {
            await account.get();
        } catch {
            // Si pas de session, vérifier si l'utilisateur existe dans Appwrite (synchronisé depuis Clerk)
            if (userId) {
                try {
                    // Créer une session anonyme temporaire pour créer le JWT
                    await account.createAnonymousSession();
                } catch (e) {
                    console.warn('Session anonyme déjà existante', e);
                }
            } else {
                await account.createAnonymousSession();
            }
        }

        const { jwt } = await account.createJWT();
        client.setJWT(jwt);

        this.jwtToken = jwt;
        this.jwtExpiry = Date.now() + 15 * 60 * 1000;
        
        this.scheduleRefresh(getToken, userId);
    }

    async refreshAuth(getToken: GetTokenFn, userId?: string) {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        this.jwtToken = null;
        this.jwtExpiry = 0;
        await this.ensureAuth(getToken, userId);
    }
}

const authManager = new AppwriteAuthManager();

export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    getToken?: GetTokenFn,
    userId?: string
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            const errorMsg = String(error?.message || '').toLowerCase();

            if (errorMsg.includes('rate limit') && attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            if ((errorMsg.includes('expired') || errorMsg.includes('unauthorized')) && attempt < maxRetries && getToken) {
                await authManager.refreshAuth(getToken, userId);
                continue;
            }

            break;
        }
    }

    throw lastError;
}

export async function ensureClerkSession(getToken: GetTokenFn) {
    const token = await getToken({ skipCache: true });
    if (!token) {
        await account.deleteSession('current').catch(() => {});
        router.replace('/(auth)/sign');
        throw new Error('Utilisateur non identifié. Merci de vous connecter.');
    }
}

export async function initAppwriteAfterLogin(getToken: GetTokenFn, clerkUserId?: string) {
    const token = await getToken({ skipCache: true });
    if (!token) throw new Error('Utilisateur non connecté');

    await account.deleteSession('current').catch(() => {});

    try {
        await account.get();
    } catch {
        await account.createAnonymousSession();
    }

    await authManager.refreshAuth(getToken, clerkUserId);
}


export async function isProfileComplete(clerkUserId?: string | null, getToken?: GetTokenFn) {
    if (!clerkUserId || !getToken) return false;

    try {
        return await withRetry(async () => {
            await authManager.ensureAuth(getToken, clerkUserId);
            const res = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [Query.equal('clerkUserId', clerkUserId)]
            );
            const doc = res?.documents?.[0];
            return Boolean(doc?.name && doc?.firstname && doc?.gender && doc?.date);
        }, 1, getToken, clerkUserId);
    } catch {
        return true;
    }
}


export const findUser = async (getToken: GetTokenFn, { clerkUserId, email }: { clerkUserId?: string | null, email?: string | null }) => {
    return withRetry(async () => {
        await authManager.ensureAuth(getToken, clerkUserId || undefined);

        let doc: any | null = null;
        
        // Recherche par clerkUserId (prioritaire car synchronisé par le webhook)
        if (clerkUserId) {
            const res = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [Query.equal('clerkUserId', clerkUserId)]
            );
            doc = res?.documents?.[0] ?? null;
        }

        // Fallback: recherche par email si pas trouvé
        if (!doc && email) {
            const res = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [Query.equal('email', email)]
            );
            doc = res?.documents?.[0] ?? null;
        }

        return {
            exists: Boolean(doc),
            complete: doc ? await isProfileComplete(clerkUserId, getToken) : false,
            doc,
        };
    }, 2, getToken, clerkUserId || undefined);
};


export const uploadImage = async (imageUri: string | null | undefined) => {
    if (!imageUri) return null;

    return withRetry(async () => {
        const fileName = imageUri.split('/').pop() || 'image.jpg';
        const fileType = fileName.split('.').pop() || 'jpg';

        const file = {
            name: fileName,
            type: `image/${fileType}`,
            size: 0,
            uri: imageUri
        };

        const uploadedFile = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            file
        );

        return uploadedFile.$id as string;
    });
};


export const createUsers = async (params: CreateUserPrams, getToken: GetTokenFn) => {
    return withRetry(async () => {
        await authManager.ensureAuth(getToken, params.clerkUserId);

        // Vérifier si l'utilisateur existe déjà (synchronisé depuis Clerk)
        const { exists, doc } = await findUser(getToken, { 
            clerkUserId: params.clerkUserId, 
            email: params.email 
        });

        const avatarId = await uploadImage(params.avatar ?? null);

        const userData = {
            name: params.name,
            firstname: params.firstname,
            email: params.email,
            gender: params.gender,
            date: params.date.toISOString(),
            avatarId,
            clerkUserId: params.clerkUserId,
        };

        // Si l'utilisateur existe déjà (synchronisé par webhook), on met à jour
        if (exists && doc) {
            console.log('✓ Utilisateur trouvé, mise à jour du profil...');
            
            const updatedDoc = await databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                doc.$id,
                userData
            );
            
            return updatedDoc.$id as string;
        }

        // Sinon on crée (fallback au cas où le webhook n'a pas encore synchronisé)
        console.log('⚠ Utilisateur non trouvé, création du profil...');
        
        const me = await account.get();
        const docPerms = [
            Permission.read(Role.user(me.$id)),
            Permission.update(Role.user(me.$id)),
            Permission.delete(Role.user(me.$id)),
        ];

        const newDoc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            userData,
            docPerms
        );

        return newDoc.$id as string;
    }, 2, getToken, params.clerkUserId);
};

const buildFileViewUrl = (fileId: string) => {
    const base = appwriteConfig.endpoint.replace(/\/+$/, '');
    const { bucketId, projectId } = appwriteConfig;
    return `${base}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
};

export async function getImage(getToken: GetTokenFn, clerkUserId?: string | null) {
    if (!clerkUserId) return null;
    const { doc } = await findUser(getToken, { clerkUserId, email: null });
    const fileId = doc?.avatarId;
    if (!fileId) return null;

    return { uri: buildFileViewUrl(fileId) };
}

export const getUser = async(getToken: GetTokenFn, clerkUserId?: string | null) => {
    return withRetry(async() => {
        await authManager.ensureAuth(getToken, clerkUserId || undefined);
        if(!clerkUserId) throw new Error('clerkUserId manquant');
        const {documents} = await databases.listDocuments<UserDoc>(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('clerkUserId', clerkUserId)]
        );
        return documents?.[0] || null;
    }, 2, getToken, clerkUserId || undefined);
};

export const updateUserInfo = async(getToken: GetTokenFn, clerkUserId?: string | null, data?: Partial<UserDoc>) => {
    return withRetry(async() => {
        await authManager.ensureAuth(getToken, clerkUserId || undefined);
        if(!clerkUserId || !data) throw new Error('Paramètres manquants');

        const res = await databases.listDocuments<UserDoc>(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('clerkUserId', clerkUserId)]
        );

        if(res.documents.length === 0) throw new Error('Utilisateur non trouvé');

        const updatedUser = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            res.documents[0].$id,
            data
        ) as UserDoc;

        return updatedUser;
    }, 2, getToken, clerkUserId || undefined);
};

export const updateUserImage = async(getToken: GetTokenFn, clerkUserId?: string | null, imageUri?: string | null) => {
    return withRetry(async() => {
        await authManager.ensureAuth(getToken, clerkUserId || undefined);
        if(!clerkUserId || !imageUri) throw new Error('Paramètres manquants');

        const res = await databases.listDocuments<UserDoc>(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('clerkUserId', clerkUserId)]
        );

        if(res.documents.length === 0) throw new Error('Utilisateur non trouvé');

        const user = res.documents[0];
        const oldAvatarId = user.avatarId;

        const newAvatarId = await uploadImage(imageUri);
        if(!newAvatarId) throw new Error('Échec upload image');

        const updatedUser = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            user.$id,
            { avatarId: newAvatarId }
        ) as UserDoc;

        if(oldAvatarId && oldAvatarId !== newAvatarId) {
            storage.deleteFile(appwriteConfig.bucketId, oldAvatarId)
                .then(() => console.log('✓ Ancienne image supprimée'))
                .catch(e => console.log('⚠ Erreur suppression ancienne image:', e?.message));
        }

        return updatedUser;
    }, 2, getToken, clerkUserId || undefined);
};


export async function deleteUserAccount(
  getToken: () => Promise<string | null>,
  clerkUserId?: string | null
) {
  if (!clerkUserId) throw new Error("❌ ID Clerk manquant");

  return withRetry(async () => {
    const token = await getToken();
    if (!token) throw new Error("Utilisateur non connecté");

    const res = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("clerkUserId", clerkUserId)]
    );

    if (res.documents.length === 0) {
      console.warn("⚠ Aucun document Appwrite trouvé pour cet utilisateur");
      return true;
    }
    
    const userDoc = res.documents[0];

    // Supprimer l'image si elle existe
    if (userDoc.avatarId) {
      try {
        await storage.deleteFile(appwriteConfig.bucketId, userDoc.avatarId);
        console.log("🗑️ Image supprimée avec succès");
      } catch (e: any) {
        console.warn("⚠ Erreur suppression image:", e?.message);
      }
    }

    // Supprimer le document utilisateur
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        userDoc.$id
      );
      console.log("🗑️ Document utilisateur supprimé d'Appwrite");
    } catch (e: any) {
      console.warn("⚠ Erreur suppression document:", e?.message);
    }

    return true;
  });
}

/**
 * NOUVELLE FONCTION: Attendre que le webhook Clerk synchronise l'utilisateur
 * Utile juste après l'inscription pour s'assurer que l'utilisateur est bien créé
 */
export async function waitForUserSync(
  getToken: GetTokenFn,
  clerkUserId: string,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<boolean> {
  console.log('⏳ Attente de la synchronisation Clerk → Appwrite...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { exists } = await findUser(getToken, { clerkUserId, email: null });
      
      if (exists) {
        console.log('✅ Utilisateur synchronisé !');
        return true;
      }
      
      console.log(`⏳ Tentative ${i + 1}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.warn('⚠ Erreur lors de la vérification:', error);
    }
  }
  
  console.warn('⚠ Timeout: Utilisateur non synchronisé après', maxAttempts, 'tentatives');
  return false;
}
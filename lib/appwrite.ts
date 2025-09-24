import { CreateUserPrams } from '@/types/type';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
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

// Cache pour optimiser les appels
class AppwriteAuthManager {
    private jwtToken: string | null = null;
    private jwtExpiry: number = 0;
    private sessionPromise: Promise<void> | null = null;
    private lastUserId: string | null = null;
    
    private isJWTValid(): boolean {
        return this.jwtToken !== null && Date.now() < (this.jwtExpiry - 5 * 60 * 1000);
    }
    
    private resetIfUserChanged(userId: string | null): void {
        if (this.lastUserId !== userId) {
            this.jwtToken = null;
            this.jwtExpiry = 0;
            this.sessionPromise = null;
            this.lastUserId = userId;
        }
    }
    
    async ensureAuth(getToken: GetTokenFn, userId?: string): Promise<void> {
        this.resetIfUserChanged(userId || null);
        
        if (this.sessionPromise) {
            return this.sessionPromise;
        }
        
        if (this.isJWTValid()) {
            return;
        }
        
        this.sessionPromise = this._establishSession(getToken);
        
        try {
            await this.sessionPromise;
        } finally {
            this.sessionPromise = null;
        }
    }
    
    private async _establishSession(getToken: GetTokenFn): Promise<void> {
        const token = await getToken({ skipCache: true });
        if (!token) {
            await account.deleteSession('current').catch(() => {});
            throw new Error('Utilisateur non identifié ou session expirée. Merci de vous connecter');
        }
        
        try {
            await account.get();
        } catch {
            await account.createAnonymousSession();
        }
        
        const { jwt } = await account.createJWT();
        client.setJWT(jwt);
        
        this.jwtToken = jwt;
        this.jwtExpiry = Date.now() + (60 * 60 * 1000);
    }
    
    async refreshAuth(getToken: GetTokenFn, userId?: string): Promise<void> {
        this.jwtToken = null;
        this.jwtExpiry = 0;
        await this.ensureAuth(getToken, userId);
    }
}

const authManager = new AppwriteAuthManager();

// Fonction helper avec retry logic
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
            
            if (errorMsg.includes('rate limit')) {
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            
            if (errorMsg.includes('expired') || errorMsg.includes('unauthorized')) {
                if (attempt < maxRetries && getToken) {
                    await authManager.refreshAuth(getToken, userId);
                    continue;
                }
            }
            
            break;
        }
    }
    
    throw lastError;
}

// VOS FONCTIONS ORIGINALES AVEC LES MÊMES NOMS ET SIGNATURES

export async function isProfileComplete(clerkUserId?: string | null, getToken?: GetTokenFn) {
  if (!clerkUserId) return false;

  return withRetry(async () => {
    if (getToken) await authManager.ensureAuth(getToken, clerkUserId);
    try {
      const res = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal('clerkUserId', clerkUserId)]
      );
      const doc = res?.documents?.[0];
      return Boolean(doc?.name && doc?.firstname && doc?.gender && doc?.date);
    } catch (e: any) {
      const code = Number(e?.code ?? e?.response?.code);
      // pas de doc OU pas d'autorisation de lecture => on considère "incomplet"
      if (code === 401 || code === 404) return false;
      throw e; // autres erreurs: on laisse remonter
    }
  }, 1, getToken, clerkUserId);
}



export async function ensureClerkSession(getToken: GetTokenFn) {
    const token = await getToken({ skipCache: true });
    if (!token) {
        await account.deleteSession('current').catch(() => {});
        router.replace('/(auth)/sign');
        throw new Error('Utilisateur non identifier ou session expirer.Merci de vous connecter');
    }
}

export async function ensureAppwriteAuth(getToken: GetTokenFn) {
    await ensureClerkSession(getToken);

    try {
        await account.get();
    } catch {
        await account.createAnonymousSession();
    }

    // Utiliser le gestionnaire d'auth optimisé
    await authManager.ensureAuth(getToken);
}

export const findUser = async (getToken: GetTokenFn, { clerkUserId, email }: { clerkUserId?: string | null, email?: string | null }) => {
    return withRetry(async () => {
        await authManager.ensureAuth(getToken, clerkUserId || undefined);
        
        let doc: any | null = null;
        
        if (clerkUserId) {
            const clerk = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [Query.equal('clerkUserId', clerkUserId)]
            );
            doc = clerk?.documents?.[0] ?? null;
        }

        if (!doc && email) {
            const mail = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [Query.equal('email', email)]
            );
            doc = mail?.documents?.[0] ?? null;
        }
        
        return {
            exists: doc,
            complete: doc ? await isProfileComplete(clerkUserId, getToken) : false, // ✅ Passe clerkUserId
            doc
        };
    }, 2, getToken, clerkUserId || undefined);
};

export const uploadImage = async (imageUri: string | null | undefined) => {
    try {
        if (!imageUri) return null;

        return withRetry(async () => {
            const fileInfo = await FileSystem.getInfoAsync(imageUri);

            if (!fileInfo.exists) {
                throw Error('Le fichier image n\'existe pas');
            }
            
            const fileName = imageUri.split('/').pop() || 'image.jpg';
            const fileType = fileName.split('.').pop() || 'jpg';

            const file = {
                name: fileName,
                type: `image/${fileType}`,
                size: fileInfo.size || 0,
                uri: imageUri
            };

            const uploadedFile = await storage.createFile(
                appwriteConfig.bucketId,
                ID.unique(),
                file,
            );

            return uploadedFile.$id as string;
        });
    } catch (e) {
        throw new Error(`Erreur lors de la recuperation des informations:${e}`);
    }
};

export const createUsers = async (params: CreateUserPrams, getToken: GetTokenFn) => {
  return withRetry(async () => {
    await authManager.ensureAuth(getToken, params.clerkUserId);

    const avatarId = await uploadImage(params.avatar ?? null); // public (hérite du bucket)
    // ou: const avatarId = await uploadImagePrivate(params.avatar ?? null);

    const userData = {
      name: params.name,
      firstname: params.firstname,
      email: params.email,
      gender: params.gender,
      date: params.date.toISOString(),
      avatarId,
      clerkUserId: params.clerkUserId,
    };

    const me = await account.get();
    const docPerms = [
      Permission.read(Role.user(me.$id)),
      Permission.update(Role.user(me.$id)),
      Permission.delete(Role.user(me.$id)),
    ];

    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      userData,
      docPerms
    );

    return doc.$id as string;
  }, 2, getToken, params.clerkUserId);
};


// helper local
const buildFileViewUrl = (fileId: string) => {
  const base = appwriteConfig.endpoint.replace(/\/+$/, ''); // enlève le / final
  const { bucketId, projectId } = appwriteConfig;
  return `${base}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
};

export async function getImage(
  getToken: GetTokenFn,
  clerkUserId?: string | null
): Promise<{ uri: string } | null> {
  if (!clerkUserId) return null;

  const { doc } = await findUser(getToken, { clerkUserId, email: null });
  const fileId = doc?.avatarId as string | undefined;
  if (!fileId) return null;

  const url = buildFileViewUrl(fileId); // ← string, pas une Promise
  return { uri: url };
}




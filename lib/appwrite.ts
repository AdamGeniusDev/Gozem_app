import { CreateUserPrams, UserDoc } from '@/types/type';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { Account, Client, Databases, ID, Query, Storage } from 'react-native-appwrite';

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

let cachedJWT: string | null = null;
let jwtExpiry: number | null = null;
let refreshPromise: Promise<void> | null = null;

const JWT_LIFETIME = 10 * 60 * 1000; // 13 minutes (expire à 15, on garde 2 min de marge)

function isJWTValid(): boolean {
    return cachedJWT !== null && jwtExpiry !== null && Date.now() < jwtExpiry;
}

async function refreshJWT(getToken: GetTokenFn): Promise<void> {
    // Si déjà en cours de refresh, attendre
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const clerkToken = await getToken({ skipCache: true });
            if (!clerkToken) throw new Error('Non connecté');

            // Supprimer session existante proprement
            try {
                await account.deleteSession('current');
            } catch {}

            // Créer nouvelle session + JWT
            await account.createAnonymousSession();
            const { jwt } = await account.createJWT();
            
            cachedJWT = jwt;
            jwtExpiry = Date.now() + JWT_LIFETIME;
            client.setJWT(jwt);
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function ensureJWT(getToken: GetTokenFn): Promise<void> {
    if (!isJWTValid()) {
        await refreshJWT(getToken);
    }
}

export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    getToken?: GetTokenFn
): Promise<T> {
    if (!getToken) throw new Error('getToken required');

    await ensureJWT(getToken);

    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            const msg = String(error?.message || '').toLowerCase();
            
            if ((msg.includes('jwt') || msg.includes('expired') || msg.includes('unauthorized')) 
                && i < maxRetries) {
                cachedJWT = null; // Invalider cache
                await refreshJWT(getToken);
                continue;
            }
            
            if (msg.includes('rate limit') && i < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
                continue;
            }
            
            throw error;
        }
    }
    throw new Error('Max retries');
}

export async function ensureClerkSession(getToken: GetTokenFn) {
    const token = await getToken({ skipCache: true });
    if (!token) {
        cachedJWT = null;
        jwtExpiry = null;
        await account.deleteSession('current').catch(() => {});
        router.replace('/(auth)/sign');
        throw new Error('Non connecté');
    }
}

export async function logoutAppwrite() {
    await account.deleteSession('current').catch(() => {});
    cachedJWT = null;
    jwtExpiry = null;
    client.setJWT('');
}

export async function initAppwriteAfterLogin(getToken: GetTokenFn, clerkUserId?: string) {
    await ensureJWT(getToken);
}

export async function isProfileComplete(clerkUserId?: string | null, getToken?: GetTokenFn) {
    if (!clerkUserId || !getToken) return false;
    try {
        return await withRetry(async () => {
            const res = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [Query.equal('clerkUserId', clerkUserId)]
            );
            const doc = res?.documents?.[0];
            return Boolean(doc?.name && doc?.firstname && doc?.gender && doc?.date);
        }, 1, getToken);
    } catch {
        return true;
    }
}

export const findUser = async (getToken: GetTokenFn, { clerkUserId, email }: { clerkUserId?: string | null, email?: string | null }) => {
    return withRetry(async () => {
        let doc: any | null = null;
        
        if (clerkUserId) {
            const res = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [Query.equal('clerkUserId', clerkUserId)]
            );
            doc = res?.documents?.[0] ?? null;
        }

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
    }, 2, getToken);
};

export const uploadImage = async (
    imageUri: string | null | undefined, 
    getToken: GetTokenFn
) => {
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
    }, 2, getToken); 
};
export const createUsers = async (params: CreateUserPrams, getToken: GetTokenFn) => {
    return withRetry(async () => {
        if (!params.clerkUserId) throw new Error('clerkUserId requis');

        const { exists, doc } = await findUser(getToken, { 
            clerkUserId: params.clerkUserId, 
            email: params.email 
        });

        // Passer getToken à uploadImage
        const avatarId = await uploadImage(params.avatar ?? null, getToken);

        const userData = {
            name: params.name,
            firstname: params.firstname,
            email: params.email,
            gender: params.gender,
            date: params.date.toISOString(),
            avatarId,
            clerkUserId: params.clerkUserId,
        };

        if (exists && doc) {
            const updatedDoc = await databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                doc.$id,
                userData
            );
            return updatedDoc.$id as string;
        }

        const newDoc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            params.clerkUserId,
            userData
        );

        return newDoc.$id as string;
    }, 2, getToken);
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
        if(!clerkUserId) throw new Error('clerkUserId manquant');
        const {documents} = await databases.listDocuments<UserDoc>(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('clerkUserId', clerkUserId)]
        );
        return documents?.[0] || null;
    }, 2, getToken);
};

export const updateUserInfo = async(getToken: GetTokenFn, clerkUserId?: string | null, data?: Partial<UserDoc>) => {
    return withRetry(async() => {
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
    }, 2, getToken);
};

export const updateUserImage = async(
    getToken: GetTokenFn, 
    clerkUserId?: string | null, 
    imageUri?: string | null
) => {
    return withRetry(async() => {
        if(!clerkUserId || !imageUri) throw new Error('Paramètres manquants');

        const res = await databases.listDocuments<UserDoc>(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('clerkUserId', clerkUserId)]
        );

        if(res.documents.length === 0) throw new Error('Utilisateur non trouvé');

        const user = res.documents[0];
        const oldAvatarId = user.avatarId;

        const newAvatarId = await uploadImage(imageUri, getToken);
        if(!newAvatarId) throw new Error('Échec upload image');

        const updatedUser = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            user.$id,
            { avatarId: newAvatarId }
        ) as UserDoc;

        if(oldAvatarId && oldAvatarId !== newAvatarId) {
            storage.deleteFile(appwriteConfig.bucketId, oldAvatarId).catch(() => {});
        }

        return updatedUser;
    }, 2, getToken);
};
export async function deleteUserAccount(
    getToken: GetTokenFn,
    clerkUserId?: string | null
) {
    if (!clerkUserId) throw new Error("ID Clerk manquant");

    return withRetry(async () => {
        const res = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("clerkUserId", clerkUserId)]
        );

        if (res.documents.length === 0) return true;
        
        const userDoc = res.documents[0];

        if (userDoc.avatarId) {
            await storage.deleteFile(appwriteConfig.bucketId, userDoc.avatarId).catch(() => {});
        }

        await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            userDoc.$id
        );

        return true;
    }, 2, getToken);
}

export async function waitForUserSync(
    getToken: GetTokenFn,
    clerkUserId: string,
    maxAttempts: number = 10,
    delayMs: number = 1000
): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await ensureJWT(getToken);
            return true;
        } catch {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    return false;
}
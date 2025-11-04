import { CreateUserPrams, GetMenu, GetSpecialitiesOptions, Restaurant, Speciality, UserDoc } from '@/types/type';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { Client, Databases, ID, Query, Storage } from 'react-native-appwrite';

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
    restaurantsCollectiondId: '6901bd83002f5f5b027c',
    menuCollectionId: '6901e9360003a290efb7',
    supplementsCollectionId: '6901edc40025048b78d6',
    specialitiesCollectionId: '6901bfbf001392560b0f',
    restaurantsSpecialitiesCollectionId: '6901c11f002fe51eda14',
    favorisCollectionId: '690894fa00051cf10b5c',
};

export const client = new Client();
client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(platformId);

export const databases = new Databases(client);
export const storage = new Storage(client);

export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    getToken?: GetTokenFn
): Promise<T> {
    
    if (getToken) {
        const token = await getToken({ skipCache: false });
        if (!token) {
            router.replace('/(auth)/sign');
            throw new Error('Non connecté');
        }
    }

    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            const msg = String(error?.message || '').toLowerCase();
            
            // Retry sur rate limit
            if (msg.includes('rate limit') && i < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
                continue;
            }
            
            throw error;
        }
    }
    throw new Error('Max retries atteint');
}

export async function ensureClerkSession(getToken: GetTokenFn) {
    const token = await getToken({ skipCache: true });
    if (!token) {
        router.replace('/(auth)/sign');
        throw new Error('Non connecté');
    }
}

export async function logoutAppwrite() {
    // La déconnexion se fait uniquement via Clerk
}

export async function initAppwriteAfterLogin(getToken: GetTokenFn, clerkUserId?: string) {
    // Vérifier juste que l'utilisateur est connecté à Clerk
    await ensureClerkSession(getToken);
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
            await ensureClerkSession(getToken);
            return true;
        } catch {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    return false;
}

export const getMenu = async({speciality,query}: GetMenu) =>{

    try{

  
    const queries: string[] = [];

    if(speciality) queries.push(Query.equal('specialityId',speciality));
    if(query) queries.push(Query.search('menuName',query));

    const menu = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.menuCollectionId,
        queries
    )

    return menu.documents;

    }catch(e){
        throw new Error(e as string)
    }

}

export const getSpecialities = async(): Promise<Speciality[]> => {
        try{
            
            const specialities = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.specialitiesCollectionId,
            )
            return specialities.documents as unknown as Speciality[];
        }catch(e){
            throw new Error(e as string)    
        }
}

const enrichRestaurantWithSpecialities = async (restaurant: Restaurant): Promise<Restaurant> => {
    const specialitiesLink = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.restaurantsSpecialitiesCollectionId,
        [Query.equal('restaurantId', restaurant.$id)]
    );

    const specialities = await Promise.all(
        specialitiesLink.documents.map(async (link) =>
            databases.getDocument<Speciality>(
                appwriteConfig.databaseId,
                appwriteConfig.specialitiesCollectionId,
                link.specialityId
            )
        )
    );

    return {
        ...restaurant,
        specialities
    } as unknown as Restaurant;
};

export const getRestaurants = async(options?: GetSpecialitiesOptions) : Promise<Restaurant[]> => {
    try{
         const queries: string[] = [];

            if(options?.specialities && options.specialities.length > 0){
                    queries.push(Query.contains('restaurantSpecialities',options.specialities))
            }

            if(options?.limit){
                queries.push(Query.limit(options.limit))
            }

            if(options?.orderBy){
                queries.push(Query.orderAsc(options.orderBy))
            }
            if(options?.numberOpinion){
                queries.push(Query.orderDesc('numberOpinion'))
                queries.push(Query.limit(1))
            }
        const restaurantsData = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.restaurantsCollectiondId,
            queries
        );
        const restaurants = await Promise.all(
            restaurantsData.documents.map(async (restaurant) => {
                return enrichRestaurantWithSpecialities(restaurant as unknown as Restaurant);
            })
        );
        return restaurants as unknown as Restaurant[];
    } catch(e){
        throw new Error(e as string);
    }
}

export const getRestaurantsBySpeciality = async(specialityId: string): Promise<Restaurant[]> => {

    try{
        const pivotDocs = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.restaurantsSpecialitiesCollectionId,
            [Query.equal('specialityId',specialityId)]
        );

        const restaurants = await Promise.all(
            pivotDocs.documents.map(async(doc) => {
                const restaurant = await databases.getDocument<Restaurant>(
                    appwriteConfig.databaseId,
                    appwriteConfig.restaurantsCollectiondId,
                    doc.restaurantId
                    
                );

                const specialitiesLink = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.restaurantsSpecialitiesCollectionId,
                    [Query.equal('restaurantId',doc.restaurantId)]
                );

                const specialities = await Promise.all(
                    specialitiesLink.documents.map(async(link)=>
                    databases.getDocument<Speciality>(
                        appwriteConfig.databaseId,
                        appwriteConfig.specialitiesCollectionId,
                        link.specialityId
                    ))
                );
                return {
                    ...restaurant,specialities
                }
            })
        );

        restaurants.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
        
        return restaurants as unknown as Restaurant[];
    } catch(e){
        throw new Error(e as string);
    }

}

export const addFavori = async ({userId,restaurantId}: {userId: string,restaurantId: string}) => {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.favorisCollectionId,
            ID.unique(),
            {userId,restaurantId}
        );
}

export const getFavori = async ({ userId, restaurantId }: { userId: string, restaurantId: string }) => {
    const res = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.favorisCollectionId,
        [
            Query.equal('userId', userId),
            Query.equal('restaurantId', restaurantId)
        ]
    );
    return res.documents[0];
}




export const DeleteFavori = async(favoriteId: string) => {
    return await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.favorisCollectionId,
        favoriteId
    )
}

export const getUserAllFavori = async(userId: string) : Promise<Restaurant[]> => {
    try {
        const Favoris = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.favorisCollectionId,
            [Query.equal('userId', userId)]
        );

        const userRestaurantsFavoris = await Promise.all(
            Favoris.documents.map(async (favori) => {
                const restaurantFavori = await databases.getDocument<Restaurant>(
                    appwriteConfig.databaseId,
                    appwriteConfig.restaurantsCollectiondId,
                    favori.restaurantId
                );

                const specialitiesLink = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.restaurantsSpecialitiesCollectionId,
                    [Query.equal('restaurantId', favori.restaurantId)]
                );

                const specialities = await Promise.all(
                    specialitiesLink.documents.map(async(link) =>
                        databases.getDocument<Speciality>(
                            appwriteConfig.databaseId,
                            appwriteConfig.specialitiesCollectionId,
                            link.specialityId
                        )
                    )
                );

                return {
                    ...restaurantFavori,
                    specialities
                };
            })
        );

        return userRestaurantsFavoris as unknown as Restaurant[];

    } catch(e) {
        throw new Error(e as string);
    }
}
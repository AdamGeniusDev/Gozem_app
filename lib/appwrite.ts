import { CreateOrderData, CreateOrderItemData, CreateUserPrams, GetSpecialitiesOptions, Menu, Order, OrderItem, Restaurant, Speciality, Supplement, UserDoc ,Notification} from '@/types/type';
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
    restaurantsCollectiondId: '6901bd83002f5f5b027c',
    menuCollectionId: '6901e9360003a290efb7',
    supplementsCollectionId: '6901edc40025048b78d6',
    specialitiesCollectionId: '6901bfbf001392560b0f',
    restaurantsSpecialitiesCollectionId: '6901c11f002fe51eda14',
    favorisCollectionId: '690894fa00051cf10b5c',
    commandesCollectionId: '6911ec7a00244097fb76',
    ordersCollectionId: '6911ec7a00244097fb76',
    orderItemCollectionId: '6915b1a4000a72b940f9',
    notificationCollectionId: '69175f570038aeb16477',
};

export const client = new Client();
client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(platformId);

export const databases = new Databases(client);
export const storage = new Storage(client);
export const account = new Account(client);

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

export const getMenuSearched = async(restaurantId: string, query?: string): Promise<Menu[]> => {
  try {
    if (!restaurantId) {
      throw new Error('restaurantId est requis');
    }

    const queries: string[] = [Query.equal('restaurantId', restaurantId)];
    
    if (query && query.trim()) {
      queries.push(Query.search('menuName', query.trim()));
    }

    const menus = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.menuCollectionId,
      queries
    );

    return menus.documents as unknown as Menu[];
  } catch (e) {
    console.error('Erreur getMenuSearched:', e);
    throw new Error(e instanceof Error ? e.message : String(e));
  }
};

export const getMenu = async(menuId: string): Promise<Menu> => {
  try {
    if (!menuId) {
      throw new Error('menuId est requis');
    }

    const menu = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.menuCollectionId,
      menuId
    );

    const supplementsResult = await databases.listDocuments<Supplement>(
      appwriteConfig.databaseId,
      appwriteConfig.supplementsCollectionId,
      [Query.equal('menuId', menuId)]
    );

    return {
      ...menu,
      supplements: supplementsResult.documents
    } as unknown as Menu;

  } catch (e) {
    console.error('Erreur getMenu:', e);
    throw new Error(e instanceof Error ? e.message : String(e));
  }
};

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
  try {
    const specialitiesLink = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.restaurantsSpecialitiesCollectionId,
      [Query.equal('restaurantId', restaurant.$id)]
    );

    if (specialitiesLink.documents.length === 0) {
      return {
        ...restaurant,
        specialities: []
      } as unknown as Restaurant;
    }

    const specialities = await Promise.all(
      specialitiesLink.documents.map(async (link) => {
        try {
          return await databases.getDocument<Speciality>(
            appwriteConfig.databaseId,
            appwriteConfig.specialitiesCollectionId,
            link.specialityId
          );
        } catch (err) {
          console.error(`Erreur récupération spécialité ${link.specialityId}:`, err);
          return null;
        }
      })
    );

    return {
      ...restaurant,
      specialities: specialities.filter(Boolean)
    } as unknown as Restaurant;
  } catch (e) {
    console.error('Erreur enrichRestaurantWithSpecialities:', e);
    // Retourner le restaurant sans spécialités en cas d'erreur
    return {
      ...restaurant,
      specialities: []
    } as unknown as Restaurant;
  }
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

            if(options?.sponsored){
                queries.push(Query.equal('sponsored','yes'))
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

export const getRestaurantInformations = async(restaurantId: string): Promise<Restaurant> => {
  try {
    if (!restaurantId) {
      throw new Error('restaurantId est requis');
    }

    const restaurant = await databases.getDocument<Restaurant>(
      appwriteConfig.databaseId,
      appwriteConfig.restaurantsCollectiondId,
      restaurantId  
    );

    const restaurantWithSpecialities = await enrichRestaurantWithSpecialities(
      restaurant as unknown as Restaurant
    );

    return restaurantWithSpecialities;

  } catch (e) {
    console.error('Erreur getRestaurantInformations:', e);
    throw new Error(e instanceof Error ? e.message : String(e));
  }
};
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

export const addFavori = async ({userId, restaurantId}: {userId: string, restaurantId: string}) => {
  try {
    if (!userId || !restaurantId) {
      throw new Error('userId et restaurantId sont requis');
    }

    // Vérifier si le favori existe déjà
    const existing = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.favorisCollectionId,
      [
        Query.equal('userId', userId),
        Query.equal('restaurantId', restaurantId)
      ]
    );

    if (existing.documents.length > 0) {
      return existing.documents[0];
    }

    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.favorisCollectionId,
      ID.unique(),
      {userId, restaurantId}
    );
  } catch (e) {
    console.error('Erreur addFavori:', e);
    throw new Error(e instanceof Error ? e.message : String(e));
  }
};

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
  try {
    if (!favoriteId) {
      throw new Error('favoriteId est requis');
    }

    return await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.favorisCollectionId,
      favoriteId
    );
  } catch (e) {
    console.error('Erreur DeleteFavori:', e);
    throw new Error(e instanceof Error ? e.message : String(e));
  }
};


export const getUserAllFavori = async(userId: string): Promise<Restaurant[]> => {
  try {
    if (!userId) {
      throw new Error('userId est requis');
    }

    const favoris = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.favorisCollectionId,
      [Query.equal('userId', userId)]
    );

    if (favoris.documents.length === 0) {
      return [];
    }

    const userRestaurantsFavoris = await Promise.all(
      favoris.documents.map(async (favori) => {
        try {
          const restaurantFavori = await databases.getDocument<Restaurant>(
            appwriteConfig.databaseId,
            appwriteConfig.restaurantsCollectiondId,
            favori.restaurantId
          );

          const restaurantWithSpecialities = await enrichRestaurantWithSpecialities(
            restaurantFavori as unknown as Restaurant
          );

          return restaurantWithSpecialities;
        } catch (err) {
          console.error(`Erreur récupération favori ${favori.restaurantId}:`, err);
          return null;
        }
      })
    );

    return userRestaurantsFavoris.filter(Boolean) as Restaurant[];

  } catch (e) {
    console.error('Erreur getUserAllFavori:', e);
    throw new Error(e instanceof Error ? e.message : String(e));
  }
};

export const getMenuLowPrice = async(restaurant: string): Promise<Menu | null> => {
  try {
    if (!restaurant) {
      throw new Error('restaurantId est requis');
    }

    const menu = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.menuCollectionId,
      [
        Query.equal('restaurantId', restaurant),
        Query.orderAsc('normalPrice'),
        Query.limit(1)
      ]
    );

    return menu.documents[0] ? (menu.documents[0] as unknown as Menu) : null;

  } catch (e) {
    console.error('Erreur getMenuLowPrice:', e);
    return null; // Retourner null au lieu de throw
  }
};

export const getMenuSpecialities = async(
  restaurant: string, 
  speciality: string
): Promise<Menu[]> => {
  try {
    const allMenu = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.menuCollectionId,
      [
        Query.equal('restaurantId', restaurant),
        Query.equal('specialityId', speciality)
      ]
    );

    const menusWithSupplements = await Promise.all(
      allMenu.documents.map(async (doc) => {
        const menu = await databases.getDocument<Menu>(
          appwriteConfig.databaseId,
          appwriteConfig.menuCollectionId,
          doc.$id
        );

        const supplementsResponse = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.supplementsCollectionId,
          [Query.equal('menuId', doc.$id)]
        );

        return {
          ...menu,
          supplements: supplementsResponse.documents as unknown as Supplement[]
        } as Menu;
      })
    );

    return menusWithSupplements;

  } catch (e) {
    console.error('Error fetching menu specialities:', e);
    throw new Error(e instanceof Error ? e.message : String(e));
  }
};

export const getMenuAndRestaurants = async (query?: string) => {
  if (!query || !query.trim()) return { restaurants: [], menus: [] };

  try {
    // 1. Rechercher les restaurants
    const restaurantRes = await databases.listDocuments<Restaurant>(
      appwriteConfig.databaseId,
      appwriteConfig.restaurantsCollectiondId,
      [Query.search("restaurantName", query)]
    );
    const restaurants = restaurantRes.documents;

    // 2. Rechercher les menus
    const menuRes = await databases.listDocuments<Menu>(
      appwriteConfig.databaseId,
      appwriteConfig.menuCollectionId,
      [
        Query.or([
          Query.search("menuName", query),
          Query.search("description", query),
        ]),
      ]
    );
    const menus = menuRes.documents;

    // 3. Si pas de restaurants mais des menus, récupérer les restaurants liés
    let relatedRestaurants: Restaurant[] = [];
    if (restaurants.length === 0 && menus.length > 0) {
      const restaurantIds = [
        ...new Set(menus.map((m) => m.restaurantId)), 
      ];

      // ✅ CORRECTION: Récupérer chaque restaurant individuellement
      const relatedRes = await Promise.all(
        restaurantIds.map(async (id) => {
          try {
            const restaurant = await databases.getDocument<Restaurant>(
              appwriteConfig.databaseId,
              appwriteConfig.restaurantsCollectiondId,
              id
            );
            return restaurant;
          } catch (err) {
            console.error(`Erreur récupération restaurant ${id}:`, err);
            return null;
          }
        })
      );

      relatedRestaurants = relatedRes.filter(Boolean) as Restaurant[];
    }

    return {
      restaurants: restaurants.length > 0 ? restaurants : relatedRestaurants,
      menus,
    };
  } catch (e) {
    console.error("Erreur recherche:", e);
    throw new Error("Erreur lors de la recherche");
  }
};

export async function updateExpoPushToken(userId: string, newToken: string) {
  try {
    if (!userId || !newToken) return;

    const userDoc = await databases.getDocument(
      appwriteConfig.databaseId, 
      appwriteConfig.userCollectionId, 
      userId
    );

    if (userDoc.expo_push_token === newToken) {
      console.log('✅ Token déjà à jour, aucune mise à jour nécessaire.');
      return;
    }

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId, 
      userId, {
      token: newToken,
    });

    console.log('📱 Token Expo Push mis à jour avec succès pour', userId);

  } catch (error: any) {
    console.error('❌ Erreur lors de la mise à jour du token Expo Push:', error.message);
  }
}

export const createOrder = async (
  order: CreateOrderData, 
  orderItems: CreateOrderItemData[] 
) => {
  let createdOrder: Order | null = null;
  const createdItems: OrderItem[] = [];

  try {
    
    createdOrder = await databases.createDocument<Order>(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      ID.unique(),
      order 
    );

    
    for (const item of orderItems) {
      try {
        const createdItem = await databases.createDocument<OrderItem>(
          appwriteConfig.databaseId,
          appwriteConfig.orderItemCollectionId,
          ID.unique(),
          {
            ...item,
            customizations: JSON.stringify(item.customizations || []),
            orderId: createdOrder.$id,
          }
        );
        createdItems.push(createdItem);
      } catch (itemError) {
        console.error('❌ Erreur création item:', itemError);
        
        
        console.log('🔄 Début du rollback...');
        await rollbackOrder(createdOrder.$id, createdItems);
        
        throw new Error(
          `Échec création item: ${itemError instanceof Error ? itemError.message : 'Erreur inconnue'}`
        );
      }
    }

    console.log('✅ Commande créée avec succès:', createdOrder.$id);
    
    return {
      order: createdOrder,
      items: createdItems,
    };

  } catch (error) {
    console.error("❌ Erreur lors de la création de la commande:", error);
    
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Erreur inconnue lors de la création de la commande"
    );
  }
};


const rollbackOrder = async (
  orderId: string, 
  createdItems: OrderItem[]
) => {
  const errors: string[] = [];

  try {
    // 1. Supprimer tous les items créés
    if (createdItems.length > 0) {
      console.log(`🗑️ Suppression de ${createdItems.length} item(s)...`);
      
      await Promise.allSettled(
        createdItems.map(async (item) => {
          try {
            await databases.deleteDocument(
              appwriteConfig.databaseId,
              appwriteConfig.orderItemCollectionId,
              item.$id
            );
            console.log(`✅ Item ${item.$id} supprimé`);
          } catch (err) {
            const errorMsg = `Échec suppression item ${item.$id}`;
            console.error(`❌ ${errorMsg}`, err);
            errors.push(errorMsg);
          }
        })
      );
    }

    // 2. Supprimer la commande principale
    console.log(`🗑️ Suppression de la commande ${orderId}...`);
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId
    );
    console.log('✅ Commande supprimée');

    if (errors.length > 0) {
      console.warn('⚠️ Rollback partiel, certains items n\'ont pas pu être supprimés:', errors);
    } else {
      console.log('✅ Rollback complet effectué avec succès');
    }

  } catch (rollbackError) {
    console.error('❌ ERREUR CRITIQUE lors du rollback:', rollbackError);
    
    throw new Error(
      `Rollback échoué pour la commande ${orderId}. Intervention manuelle requise.`
    );
  }
};

export const getUserNotificationToken = async (userId: string): Promise<string | null> => {
  try {
    if (!userId) return null;
    
    const userDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    );
    
    return userDoc.token || null;
  } catch (error) {
    console.error('❌ Erreur récupération token:', error);
    return null;
  }
};

export const getPendingOrdersForMerchant = async (merchantId: string): Promise<Order[]> => {
  try {
    if (!merchantId) throw new Error('merchantId requis');
    
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      [
        Query.equal('merchantId', merchantId),
        Query.equal('status', 'pending'),
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ]
    );
    
    return response.documents as unknown as Order[];
  } catch (error) {
    console.error('❌ Erreur récupération commandes:', error);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'preparing' | 'delivering' | 'delivered',
): Promise<void> => {
  try {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
      {
        status,
        updatedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    throw error;
  }
};

export const createPrivateNotification = async (
  type: 'private' | 'global',
  title: string,
  message: string,
  userId: string,
  link: string,
): Promise<void> => {
  const notification = {
    type,
    title,
    message,
    userId,
    link
  };

  try {
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      ID.unique(),
      notification
    );
    console.log('✅ Notification créée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création de la notification', error);
    throw error;
  }
};


export const createGlobalNotification = async (
  type: 'private' | 'global',
  title: string,
  message: string,
  link: string,
): Promise<void> => {
  const notification = {
    type,
    title,
    message,
    link
  };

  try {
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      ID.unique(),
      notification
    );
    console.log('✅ Notification globale créée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création de la notification globale', error);
    throw error;
  }
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'), // Plus récentes en premier
        Query.limit(100), // Limiter à 100 notifications
      ]
    );

    return response.documents as unknown as Notification[];
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      notificationId,
      {
        isRead: 'true',
      }
    );

    console.log('✅ Notification marquée comme lue:', notificationId);
  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    throw error;
  }
};
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    // Récupérer toutes les notifications non lues
    const unreadNotifications = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      [
        Query.equal('userId', userId),
        Query.equal('isRead', 'false'),
      ]
    );

    // Marquer chacune comme lue
    const promises = unreadNotifications.documents.map(notification =>
      databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.notificationCollectionId,
        notification.$id,
        { isRead: 'true' }
      )
    );

    await Promise.all(promises);

    console.log('✅ Toutes les notifications marquées comme lues');
  } catch (error) {
    console.error('❌ Erreur marquage toutes notifications:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async (userId: string) => {
  try {
    // Compter les notifications privées non lues
    const privateUnread = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      [
        Query.equal('userId', userId),
        Query.equal('type', 'private'),
        Query.equal('isRead', 'false'),
      ]
    );

    // Compter les notifications globales non lues
    const globalUnread = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      [
        Query.equal('userId', userId),
        Query.equal('type', 'global'),
        Query.equal('isRead', 'false'),
      ]
    );

    return {
      private: privateUnread.total,
      global: globalUnread.total,
    };
  } catch (error) {
    console.error('❌ Erreur comptage notifications:', error);
    return { private: 0, global: 0 };
  }
};

export const deleteNotification = async (notificationId: string) => {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      notificationId
    );

    console.log('✅ Notification supprimée:', notificationId);
  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
    throw error;
  }
};

export const deleteOldNotifications = async (userId: string, daysOld = 5) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldNotifications = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationCollectionId,
      [
        Query.equal('userId', userId),
        Query.lessThan('$createdAt', cutoffDate.toISOString()),
      ]
    );

    const promises = oldNotifications.documents.map(notification =>
      databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.notificationCollectionId,
        notification.$id
      )
    );

    await Promise.all(promises);

    console.log(`✅ ${oldNotifications.total} anciennes notifications supprimées`);
  } catch (error) {
    console.error('❌ Erreur suppression anciennes notifications:', error);
    throw error;
  }
};

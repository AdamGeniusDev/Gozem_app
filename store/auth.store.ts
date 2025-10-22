import { createUsers, logoutAppwrite} from '@/lib/appwrite'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type GetTokenFn = (opt?:{skipCache?:boolean})=> Promise<string | null>;
type SetActiveFn = ({session}:{session:string})=>Promise<void>;
type FinalizeSignUpFn = (pwd: string) => Promise<{ sessionId: string; userId: string }>;

type Auth ={
  email: string 
  password: string 
  name: string,
  firstname: string
  gender: string
  date: Date
  avatar:  string | null 
  isAuthenticated: boolean
  isLoading: boolean
  error?: string

  pendingSessionId?: string | null
  pendingUserId?: string | null
  clerkUserId?: string | null

  setEmail: (value:string) => void
  setPassword: (value:string) =>void
  setName:(value:string) => void
  setFirstname:(value:string)=>void
  setGender:(value:string)=>void
  setDate:(value: Date)=>void
  setAvatar:(uri:string | null) => void
  setIsAuthenticated: (value:boolean) => void
  setIsLoading:(value:boolean) => void
  setError:(msg?:string) => void
  setClerkUserId: (id: string | null) => void

  sendOtp: ({signUp,email}:{signUp:any,email:string}) =>Promise<void>
  verifyOtp: ({signUp,code,setActive,activeNow}:{signUp:any,code:string,setActive?:(arg: {session:string})=>Promise<void>,activeNow?: boolean}) =>Promise<void | boolean>
  activeSession: ({setActive}:{setActive:({session}:{session:string})=>Promise<void>}) => Promise<void>
  resendOtp: ({signUp}:{signUp:any}) => Promise<void | boolean>
  reset: () => void
  getPassword: (password:string) => void
  getInfo: ({name,firstname,gender,date,avatar}:{name:string,firstname:string,gender:string,date:Date,avatar:string|null}) => void
  logout: ()=> Promise<void>

  finalizeCreation: ({getToken,clerkUserId}:{getToken: GetTokenFn, clerkUserId: string}) =>Promise<string>
  activateSessionAndPassword: ({setActive,finalizeSignUp}:{setActive:SetActiveFn,finalizeSignUp: FinalizeSignUpFn})=> Promise<{sessionId: string,userId:string}>
}

const useAuthStore = create<Auth>()(
  persist(
    (set, get) => ({
      email: '',
      password: '',
      name: '',
      firstname: '',
      gender: '',
      date: new Date(),
      avatar: null,
      isAuthenticated: false,
      isLoading: false,
      error: undefined,

      pendingSessionId: null,
      pendingUserId: null,
      clerkUserId: null,

      setEmail: (value) => set({ email: value }),
      setPassword: (value) => set({ password: value }),
      setName: (value) => set({ name: value }),
      setFirstname: (value) => set({ firstname: value }),
      setGender: (value) => set({ gender: value }),
      setDate: (value) => set({ date: value }),
      setAvatar: (value) => set({ avatar: value }),
      setIsAuthenticated: (value) => set({ isAuthenticated: value }),
      setIsLoading: (value) => set({ isLoading: value }),
      setError: (value) => set({ error: value }),
      setClerkUserId: (id) => set({ clerkUserId: id }),

       sendOtp: async ({ signUp, email }) => {
        try {
          const normalized = email.trim().toLowerCase();
          set({ email: normalized });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            } catch (e:any) {
                    set({ error: e?.message ?? "Erreur lors de l'envoie du code" });
          throw e;
        }
      },

     verifyOtp: async ({ signUp, code }) => {
                try {
            set({ isLoading: true, error: undefined });
            const res = await signUp.attemptEmailAddressVerification({ code: String(code) });

            const emailVerified = res.verifications?.emailAddress?.status === 'verified';

            
            if (emailVerified) {
            // on NE récupère PAS de session ici (normal)

            router.replace('/(auth)/password');
            return true;
            } else {
            set({ error: 'Le code OTP entré est invalide' });
            return false;
            }
        } catch (e:any) {
                        set({ error: e?.message ?? "Une erreur s'est produite" });
        } finally {
            set({ isLoading: false });
        }
        },


      resendOtp: async ({ signUp }) => {
                try {
          set({ isLoading: true, error: undefined });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                    return true;
        } catch (e:any) {
                    set({ error: e?.errors?.[0]?.message ?? e?.message ?? "Impossible de renvoyer le code" });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },


      activeSession: async ({ setActive }) => {
        const { pendingSessionId } = get();
        if (pendingSessionId) {
          try {
            set({ isLoading: true, error: undefined });
            await setActive({ session: pendingSessionId });
          } catch (e:any) {
            set({ error: e?.message ?? "Une erreur inconnue s'est produite" });
          } finally {
            set({ isLoading: false });
          }
        }
      },

       getPassword: (password) => {
                set({ password });
      },

        getInfo: ({ name, firstname, gender, date, avatar = null }) => {
                set({ name, firstname, gender, date, avatar });
      },

      finalizeCreation: async ({ getToken, clerkUserId }) => {
      const { email, name, firstname, gender, date, avatar } = get();
        
        if (!clerkUserId) throw new Error('ClerkUserId introuvable');

        try {
          set({ isLoading: true, error: undefined });
          const docId = await createUsers(
            { name, firstname, email, gender, date, avatar, clerkUserId },
            getToken
          );
          if(docId){
            set({isAuthenticated:true})
          }
          return docId;
        } catch (e:any) {
                    set({ error: e?.message ?? 'Echec de creation appwrite' });
          throw new Error(`Impossible de creer l'utilisateur: ${e}`);
        } finally {
          set({ isLoading: false });
        }
      },

       
activateSessionAndPassword: async ({
  setActive,
  finalizeSignUp
}: {
  setActive: SetActiveFn,
  finalizeSignUp: FinalizeSignUpFn
}) => {
  const { password } = get();
  
  if (!password || password.length < 6) throw new Error("Mot de passe invalide");

  try {
    set({ isLoading: true, error: undefined });
    
    // 1) Finaliser le sign up (définit le mdp, puis crée la session)
    const { sessionId, userId } = await finalizeSignUp(password);
    
    // 2) Activer la session Clerk
    await setActive({ session: sessionId });
    
    // 3) Marquer connecté + nettoyer le password - BATCHING des mises à jour
    set((state) => ({
      ...state,
      clerkUserId: userId,
      password: '',
      isLoading: false, // Mettre à jour isLoading ici aussi
      error: undefined
    }));

    return {sessionId,userId}
    
  } catch (e: any) {
    // Une seule mise à jour d'état en cas d'erreur
    set((state) => ({
      ...state,
      error: e?.message ?? "Impossible d'activer la session.",
      isLoading: false
    }));
    throw e;
  }
},

      reset: () =>
        set({
          email: '',
          password: '',
          name: '',
          firstname: '',
          gender: '',
          date: new Date(),
          avatar: null,
          isAuthenticated: false,
          isLoading: false,
          error: undefined,
          pendingSessionId: null,
          pendingUserId: null,
          clerkUserId: null,
        }),
        logout: async()=>{
          try{
            
            await logoutAppwrite();

            set({
              email: '',
              password: '',
              name: '',
              firstname: '',
              gender: '',
              date: new Date(),
              avatar: null,
              isAuthenticated: false,
              clerkUserId: null,
            })
          }catch(error:any){
            console.log('Error logout',error)
          }
        }
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        email: s.email,
        name: s.name,
        firstname: s.firstname,
        gender: s.gender,
        date: s.date,
        avatar: s.avatar,
        isAuthenticated: s.isAuthenticated,
        pendingSessionId: s.pendingSessionId,
        pendingUserId: s.pendingUserId,
        clerkUserId: s.clerkUserId, // optionnel
      }),
      version: 1,
    }
  )
);

export default useAuthStore;

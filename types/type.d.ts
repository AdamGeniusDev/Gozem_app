import { Models } from "react-native-appwrite";


export interface SignInParams{
    email: string,
    password: string
}

export interface CreateUserPrams{
    name: string,
    firstname: string,
    email: string,
    gender: string,
    date: Date,
    avatar: string | null,
    clerkUserId?: string,
}

export interface TabRoute {
  key: string,
  title: string,
  component: React.ComponentType,
}
export interface RenderViewProps {
  routes: TabRoute[],
  initialView?: number,
}
export interface AnimatedTabsProps {
  routes: TabRoute[];
  initialView?: number;
  containerStyle?: any;
  activeColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
  indicatorColor?: string;
}
export interface UserDoc extends Models.Document {
  $id: string;
  clerkUserId: string;
  email: string;
  firstname?: string;
  name?: string;
  gender?: string;
  avatarId?: string;
  date?: string;
};

export interface GetMenu {
  speciality: string,
  query?: string,
}

export interface Distance {
  lat: number,
  lon: number,
}

export interface Speciality extends Models.Document {
  $id: string;
  specialityName: string;
  specialityImage: string;
  restaurantSpecialities: string[];
  menu: string[];
}

export interface Restaurant extends Models.Document {
  $id: string;
  restaurantName: string;
  address: string;
  rating: number;
  openTime: Date;
  closeTime: Date;
  numberOpinion: number;
  specialities: Speciality[];
  menu: string[];
  restaurantLogo: string;
  restaurantBanner: string;
}

export interface GetSpecialitiesOptions {
  specialities?: string[],
  limit?: number,
  orderBy?: string,
  numberOpinion?: true
}

export interface Coords {
  latitude: number,
  longitude: number,
}
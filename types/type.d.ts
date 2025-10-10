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
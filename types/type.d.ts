
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
  merchantId: string;
}

export interface GetSpecialitiesOptions {
  specialities?: string[],
  limit?: number,
  orderBy?: string,
  numberOpinion?: true,
  sponsored?: 'yes' | 'no'
}

export interface Coords {
  latitude: number,
  longitude: number,
}

export interface Supplement extends Models.Document{
  $id: string,
  menuId: string,
  supplementName: string,
  supplementPrice: number
}

export interface Menu extends Models.Document{
  $id: string,
  restaurantId: string,
  specialityId: string,
  accompagnement?: string[],
  menuName: string,
  normalPrice: number,
  reductionPrice: number,
  description: string,
  supplements: Supplement[],
  menuImage: string,
}

export interface CustomizationType{
  $id: string,
  name: string,
  price: number,
  quantity: number,
  accompagnement?: string[],
}

// ✅ RENOMMER CartItemType en CartItem pour cohérence
export interface CartItem {
  $id: string,
  restaurantId: string,
  menuName: string,
  normalPrice: number,
  reductionPrice: number,
  description: string,
  customizations?: CustomizationType[]
  quantity: number,
  instructions?: string,
  livraisonInstruction?: string;
}

export interface CartStore {
  items: CartItem[];
  currentUserId: string | null;                    
  userCarts: Record<string, CartItem[]>;           
  
  setCurrentUser: (userId: string | null) => void; 
  
  addItem: (item: CartItem) => void;
  updateItem: (
    id: string,
    customizations: CustomizationType[],
    newData: Partial<CartItem>
  ) => void;
  removeItem: (id: string, customizations?: CustomizationType[]) => void;
  increaseQty: (id: string, customizations?: CustomizationType[]) => void;
  decreaseQty: (id: string, customizations?: CustomizationType[]) => void;
  clearCart: (restaurantId: string) => void;
  
  getTotalItems: (restaurantId: string) => number;
  getTotalPrice: (restaurantId: string) => number;
  getCartCount: () => number;
  getRestaurantIds: () => string[];
}

interface Order extends Models.Document {
  restaurantId: string,
  userId: string,
  subtotalPrice: number,
  totalPrice: number,
  status: pending | accepted | rejected | completed | preparing | delivering | delivered,
  totalItems: number,
  merchantId: string,
  paymentStatus: paid | unpaid | refunded,
  deliveryAddress: string,
}

interface OrderItem extends Models.Document {
  orderId: string,
  menuId: string,
  menuName: string,
  restaurantId: string,
  price: number,
  quantity: number,
  customizations?: string,
  deliveryInstructions?: string,
  livraisonInstructions?: string,

}

export type CreateOrderData = Omit<Order, keyof Models.Document>;

export type CreateOrderItemData = Omit<OrderItem, keyof Models.Document,oderId>;

interface Notification extends Models.Document {
  title: string;
  message: string;
  link: string;
  isRead: string;
  type: 'private' | 'global';
  userId: string;
}


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
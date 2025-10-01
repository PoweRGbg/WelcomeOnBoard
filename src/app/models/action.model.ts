export interface Action {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    url?: string;
    isCompleted: boolean;
    completedAt?: Date;
    completedBy?: string;
}


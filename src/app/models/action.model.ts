export interface Action {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    url?: string;
    order: number;
    isCompleted: boolean;
    completedAt?: Date;
    completedBy?: string;
}

// export interface ActionCreateRequest {
//     name: string;
//     description?: string;
//     imageUrl?: string;
//     url?: string;
//     order: number;
// }

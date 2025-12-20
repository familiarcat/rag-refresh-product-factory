export interface FileSystemOperation {
    success: boolean;
    error?: string;
    data?: any;
}

export interface FileWatchEvent {
    type: 'add' | 'change' | 'unlink';
    path: string;
    timestamp: number;
}

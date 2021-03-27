export interface WebsocketConnectionOptions {
    host: string;
    path?: string;
    userId?: string;
    channels: string[];
    apiKey: string;
    format?: 'text' | 'binary';
    interval?: number;
    tries?: number;
    snapshot?: boolean;
}

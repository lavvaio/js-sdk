export interface WebsocketConnectionOptions {
    host: string;
    path?: string;
    user_id?: string;
    channels: string[];
    apiKey: string;
    format?: 'text' | 'binary';
    interval?: number;
    tries?: number;
    snapshot?: boolean;
}

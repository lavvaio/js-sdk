export interface WebsocketConnectionOptions {
    host: string;
    path?: string;
    clientId?: string;
    channels: string[];
    apiKey: string;
    secure?: boolean;
    format?: 'text' | 'binary';
    interval?: number;
    tries?: number;
}

export interface WebsocketConnectionOptions {
    host: string;
    clientId?: string;
    channels: string[];
    apiKey: string;
    secure?: boolean;
    format?: 'text' | 'binary';
}

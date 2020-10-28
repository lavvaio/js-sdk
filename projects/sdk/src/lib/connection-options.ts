export interface WebsocketConnectionOptions {
    host: string;
    clientId?: string;
    channels: string[];
    secure?: boolean;
    format?: 'text' | 'binary';
}

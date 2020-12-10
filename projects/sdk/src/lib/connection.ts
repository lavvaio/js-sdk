import { ClientMessageDataType, WebsocketMessage } from './message';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

// https://gearheart.io/blog/auto-websocket-reconnection-with-rxjs-with-example/
// https://github.com/ReactiveX/rxjs/blob/6.5.5/src/internal/observable/dom/WebSocketSubject.ts#L150-L387
// import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/observable/dom/WebSocketSubject';

import { WebsocketConnectionOptions } from './connection-options';
import { LVCloseEvent, LVErrorEvent, LVEvent, LVEventMessageType, LVMessageEvent, LVOpenEvent } from './events';
export class WebsocketConnection {

    private url: string;
    private format: string;
    private clientId: string;
    private transport: string;
    private websocketConnection: WebSocket;

    private connected = false;
    private channels = new Set<string>();
    private events = new Subject<LVEvent>();

    constructor(options: WebsocketConnectionOptions) {
        if (!options.host) {
            throw new Error('host parameter is required');
        }

        if (!options.channels) {
            throw new Error('channels have not been specified');
        }

        if (options.channels.length === 0) {
            throw new Error('channels are empty');
        }

        if (!options.apiKey || options.apiKey.length === 0) {
            throw new Error('APIKey is required');
        }

        // use unsecure protocol only if specified and equal to false
        const protocol = (options?.secure === false) ? 'ws://' : 'wss://';

        // remove duplicates
        options.channels.forEach((channel) => this.channels.add(channel));

        // construct url
        let url = `${protocol}${options.host}/v1/ws?channels=` + Array.from(this.channels).map(ch => {
            return encodeURIComponent(ch);
        }).join(',');

        // check if there is a client id specified
        // this might orevent you to connect if the client id already in the system
        if (options.clientId) {
            this.clientId = options.clientId;
            url += `&client_id=${encodeURIComponent(options.clientId)}`;
        }

        // detect format
        if (options?.format !== 'text') {
            options.format = 'binary';
        }

        // set api key
        url += `&apiKey=${encodeURIComponent(options.apiKey)}`;

        // set format
        this.format = options.format;
        url += `&format=${encodeURIComponent(options.format)}`;

        // store final url
        this.url = url;
    }

    connect(): (code?: number, reason?: string) => void {
        this.websocketConnection = new WebSocket(this.url);
        this.websocketConnection.addEventListener('open', this.handleOpen.bind(this));
        this.websocketConnection.addEventListener('error', this.handleError.bind(this));
        this.websocketConnection.addEventListener('close', this.handleClose.bind(this));
        this.websocketConnection.addEventListener('message', this.handleMessage.bind(this));
        return (code?: number, reason?: string) => {
            this.websocketConnection.close(code, reason);
            this.websocketConnection.removeEventListener('open', this.handleOpen);
            this.websocketConnection.removeEventListener('error', this.handleError);
            this.websocketConnection.removeEventListener('close', this.handleClose);
            this.websocketConnection.removeEventListener('message', this.handleMessage);
        };
    }

    protected handleError(event: ErrorEvent) {
        this.events.next(new LVErrorEvent(event));
    }

    protected handleClose(event: CloseEvent) {
        this.connected = true;
        this.events.next(new LVCloseEvent(event));
    }

    protected async handleMessage(event: MessageEvent) {
        const data = await this.getData(event);

        if (!this.channels.has(data.channel)) {
            return;
        }

        if (data.type === ClientMessageDataType.CLIENT_CONNECTED) {
            // this.format = data.Value.Format;
            this.clientId = data.value.client_id;
            // this.transport = data.Value.Transport;
        }

        this.events.next(new LVMessageEvent(event, data));
    }

    protected handleOpen(event: Event) {
        this.connected = true;
        this.events.next(new LVOpenEvent(event));
    }

    private getData(xevent: MessageEvent): Promise<any> {
        return new Promise((resolve) => {
            if (xevent.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => resolve(JSON.parse(reader.result as string));
                reader.readAsText(xevent.data);
            } else {
                resolve(JSON.parse(xevent.data));
            }
        });
    }

    eventStream<T extends LVEvent>(...events: LVEventMessageType[]): Observable<T> {
        return this.events.asObservable().pipe(
            filter(xevent => events && events.length ? events.includes(xevent.getType()) : true),
            map(xevent => xevent as T),
        );
    }

    channelStream<T = any>(...channels: string[]): Observable<WebsocketMessage<T>> {
        return this.eventStream<LVMessageEvent>(LVMessageEvent.TYPE).pipe(
            filter(xevent => channels.includes(xevent.data.channel)),
            map(xevent => xevent.data as WebsocketMessage<T>),
        );
    }

    getClientId() {
        return this.clientId;
    }

    getFormat() {
        return this.format;
    }

    getTransport() {
        return this.transport;
    }

    isConnected() {
        return this.connected;
    }

    getUrl() {
        return this.url;
    }

}

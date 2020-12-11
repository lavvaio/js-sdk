import { ClientMessageDataType, WebsocketMessage } from './message';
import { Observable, Subject, Subscription } from 'rxjs';
import { filter, map, retryWhen } from 'rxjs/operators';

import { webSocket } from 'rxjs/webSocket';
// https://www.learnrxjs.io/learn-rxjs/operators/error_handling/retrywhen
// https://gearheart.io/blog/auto-websocket-reconnection-with-rxjs-with-example/
// https://github.com/ReactiveX/rxjs/blob/6.5.5/src/internal/observable/dom/WebSocketSubject.ts#L150-L387
// import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/observable/dom/WebSocketSubject';

import { WebsocketConnectionOptions } from './connection-options';
import { LVCloseEvent, LVErrorEvent, LVEvent, LVEventMessageType, LVMessageEvent, LVOpenEvent } from './events';
import { genericRetryStrategy } from './retry';

export class WebsocketConnection {

    private host: string;
    private path: string;
    private apiKey: string;
    private secure: boolean;
    private clientId: string;
    private format: 'text' | 'binary';

    private connected = false;
    private channels = new Set<string>();
    private events = new Subject<LVEvent>();

    constructor(public options: WebsocketConnectionOptions) {
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

        // store secure
        this.secure = (options?.secure === true);

        // store apiKey
        this.apiKey = options.apiKey;

        // store host
        this.host = options.host;

        // store path
        this.path = options.hasOwnProperty('path') ? options.path : '/v1/ws';

        // detect format
        this.format = options?.format !== 'text' ? 'binary' : 'text';

        // store client id
        // check if there is a client id specified
        // this might prevent you to connect if the client id already in the system
        this.clientId = !!options?.clientId ? options.clientId : undefined;

        // remove duplicates
        options.channels.forEach((channel) => this.channels.add(channel));
    }

    private getURL() {
        // use unsecure protocol only if specified and equal to false
        const protocol = this.secure ? 'ws://' : 'wss://';

        // construct url
        let url = `${protocol}${this.host}${this.path}?channels=` + Array.from(this.channels).map(ch => {
            return encodeURIComponent(ch);
        }).join(',');

        if (!!this.clientId) {
            url += `&client_id=${encodeURIComponent(this.clientId)}`;
        }

        // set api key
        url += `&apiKey=${encodeURIComponent(this.apiKey)}`;

        // set format
        url += `&format=${encodeURIComponent(this.format)}`;

        return url;
    }

    connect(maxRetryAttempts = 10, retryTimeout = 1000): Subscription {
        /*
        this.websocketConnection = new WebSocket(this.getURL());
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
        };*/

        const subject = webSocket<{ channel: string; type: ClientMessageDataType, value: any; }>({
            url: this.getURL(),
            openObserver: {
                next: (event: Event) => {
                    this.connected = true;
                    this.events.next(new LVOpenEvent(event));
                }
            },
            closeObserver: {
                next: (event: CloseEvent) => {
                    this.connected = false;
                    this.events.next(new LVCloseEvent(event));
                }
            }
        });

        return subject.pipe(
            filter(data => this.channels.has(data.channel)),
            retryWhen(genericRetryStrategy({ maxRetryAttempts, retryTimeout })),
        ).subscribe(data => {
            if (data.type === ClientMessageDataType.CLIENT_CONNECTED) {
                if (!this.clientId) {
                    this.clientId = data.value.client_id;
                }
            }

            this.events.next(new LVMessageEvent(data));
        }, err => {
            this.events.next(new LVErrorEvent(err));
        });
    }

    private getData(data: any): Promise<any> {
        return new Promise((resolve) => {
            if (data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => resolve(JSON.parse(reader.result as string));
                reader.readAsText(data);
            } else {
                resolve(JSON.parse(data));
            }
        });
    }

    private async deserialize(data: any) {
        const response = await this.getData(data);
        return response;
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

    isConnected() {
        return this.connected;
    }

}

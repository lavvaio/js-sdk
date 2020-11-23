export interface LVEvent {
    getType(): string;
}

export class LVMessageEvent<T = any> implements LVEvent {
    constructor( public event: MessageEvent, public data: T ) {}
    getType: () => 'message';
}

export class LVOpenEvent implements LVEvent {
    constructor( public event: Event ) {}
    getType: () => 'open';
}

export class LVCloseEvent implements LVEvent {
    constructor( public event: CloseEvent ) {}
    getType: () => 'close';
}

export class LVErrorEvent implements LVEvent {
    constructor( public event: ErrorEvent ) {}
    getType: () => 'error';
}

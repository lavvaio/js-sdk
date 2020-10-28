import { Event, CloseEvent, ErrorEvent, /* MessageEvent */ } from 'reconnecting-websocket';

export interface XEvent {
    getType(): string;
}

export class MessageXEvent implements XEvent {
    constructor( public event: MessageEvent ) {}
    getType: () => 'message';
}

export class OpenXEvent implements XEvent {
    constructor( public event: Event ) {}
    getType: () => 'open';
}

export class CloseXEvent implements XEvent {
    constructor( public event: CloseEvent ) {}
    getType: () => 'close';
}

export class ErrorXEvent implements XEvent {
    constructor( public event: ErrorEvent ) {}
    getType: () => 'error';
}

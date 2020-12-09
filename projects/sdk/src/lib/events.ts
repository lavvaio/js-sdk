export type LVEventMessageType = 'message' | 'open' | 'close' | 'error' | 'none';

export abstract class LVEvent {

    static TYPE: LVEventMessageType = 'none';

    abstract getType(): LVEventMessageType;

}

export class LVMessageEvent<T = any> extends LVEvent {

    static TYPE: LVEventMessageType = 'message';

    constructor( public event: MessageEvent, public data: T ) {
        super();
    }

    getType() {
        return LVMessageEvent.TYPE;
    }

}

export class LVOpenEvent extends LVEvent {

    static TYPE: LVEventMessageType = 'open';

    constructor( public event: Event ) {
        super();
    }

    getType() {
        return LVOpenEvent.TYPE;
    }

}

export class LVCloseEvent extends LVEvent {

    static TYPE: LVEventMessageType = 'close';

    constructor( public event: CloseEvent ) {
        super();
    }

    getType() {
        return LVCloseEvent.TYPE;
    }

}

export class LVErrorEvent extends LVEvent {

    static TYPE: LVEventMessageType = 'error';

    constructor( public event: ErrorEvent ) {
        super();
    }

    getType() {
        return LVErrorEvent.TYPE;
    }

}

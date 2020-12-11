import { LVCloseEvent, LVErrorEvent, LVMessageEvent, LVOpenEvent } from '../api/events';

describe('Events', () => {

    interface TestGeneric {
        test: boolean;
        createdAt: Date;
    }

    it('LVMessageEvent should have correct type', () => {
        expect(LVMessageEvent.TYPE).toEqual('message');
    });

    it('LVMessageEvent instance should have correct type', () => {
        const msg = new LVMessageEvent<TestGeneric>({ test: true, createdAt: new Date() });
        expect(msg.getType()).toEqual('message');
    });

    it('LVMessageEvent should hold data correctly', () => {
        const msg = new LVMessageEvent<TestGeneric>({ test: true, createdAt: new Date() });
        expect(msg.data.createdAt).toBeDefined();
        expect(msg.data.createdAt instanceof Date).toBe(true);
    });

    it('LVOpenEvent should have correct type', () => {
        expect(LVOpenEvent.TYPE).toEqual('open');
    });

    it('LVCloseEvent should have correct type', () => {
        expect(LVCloseEvent.TYPE).toEqual('close');
    });

    it('LVErrorEvent should have correct type', () => {
        expect(LVErrorEvent.TYPE).toEqual('error');
    });

});

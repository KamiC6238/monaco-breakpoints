export default class EventEmitter {
    private events: Record<string, Function[]> = {};

    private on(eventName: string, callback: Function) {}

    private emit(eventName: string, args: any) {}

    private off(eventName: string, callback?: Function) {}

    private once(eventName: string, callback: Function) {}
}
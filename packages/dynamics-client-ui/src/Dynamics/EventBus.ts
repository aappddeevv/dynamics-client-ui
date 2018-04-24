/**
 * Simple Dynamics event bus. Designed to be used for simple needs
 * and attached to a window that sub-iframes can access easily so their
 * WebResources can listen for events from across a Dynamics form 
 * e.g. a grid select needs.
 */

/** Subscriber takes a simple event object differentiated by type. */
export type Subscriber = ({type: string}) => void

/** A thunk that unsubscribes when called. */
export type Cancellable = () => void

/** Small pubsub, synchronous dispatch. */
export class EventBus {
    private subscribers: Array<Subscriber> = []

    public unsubscribe(key) {
        this.subscribers = this.subscribers.filter(s => s !== key)
    }
    
    /** Subscriber is just a thunk. Thunk returned unsubscribes. */
    public subscribe(subscriber: Subscriber) {
        if(subscriber) this.subscribers.push(subscriber)
        return(() => this.unsubscribe(subscriber))
    }

    /** Dispatch an event. All subscribers get all events like redux. */
    public dispatch(event) {
        this.subscribers.forEach(sub => {
            if(sub) sub(event)
        })
    }
}

export default EventBus

export interface Window {
    eventbus: EventBus;
}

// where are we getting loaded? it's a subframe I know that...
//console.log("frameElement", window.frameElement)

/**
 * Manages state and actions for Dynamics notifications at the form 
 * level (not attribute level). Hence, these are for user presentation
 * so the text message should be relevant to a user.
 */

import { XRM } from "./xrm"

/** Basic message interface, Dynamics and non-Dynamics. */
export interface Notification {
    message: string
    level: Xrm.FormNotificationLevel
    /** Need to implement field level. */
    field?: string
    /** Duration in seconds. */
    removeAfter?: number
}

export type MessageId = string

export interface Notifier {
    /** If successful, return id, else null. */
    add(n: Notification): MessageId | null
    /** Return boolean indicating success. */
    remove(MessageId): boolean
}

/** Module wide counter */
let counter = 0

const getAndIncrement = () => {
    const tmp = counter
    counter = counter + 1
    return tmp
}

export class NotificationManager implements Notifier {

    constructor(getXrm: () => XRM|null) {
        this.getXrm = getXrm
    }
    
    private getXrm: () => XRM|null

    private notifications: Array<MessageId> = []
    
    add = (msg: Notification): MessageId|null => {
        const xrm = this.getXrm()
        if(xrm) {
            const nt = msg.level
            const id = getAndIncrement().toString()
            const worked = xrm.Page.ui.setFormNotification(msg.message, nt, id)
            if(worked) {
                if(msg.removeAfter && msg.removeAfter > 0) {
                    setTimeout(() => this.remove(id), msg.removeAfter * 1000)
                }
                return id
            }
            return null
        }
        return null
    }
    
    remove = (id: MessageId) => {
        const xrm = this.getXrm()
        if(xrm) {
            return xrm.Page.ui.clearFormNotification(id)
        }
        return false
    }

    clearAll = () => {
    }
}

export default NotificationManager
